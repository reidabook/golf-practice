import { getCachedRows, getRows, nullStr, today } from '@/lib/sheets'
import { rowToDrill } from '@/lib/queries/drills'
import type { ActiveBlockInfo, BlockWithDayLogs, TrainingBlock } from '@/lib/types'

function rowToBlock(r: Record<string, string>): TrainingBlock {
  return {
    id: r.id, template_id: nullStr(r.template_id), name: r.name,
    target_sessions: Number(r.target_sessions),
    status: r.status as TrainingBlock['status'],
    started_at: r.started_at, completed_at: nullStr(r.completed_at),
  }
}

async function fetchBlockInfo(
  block: TrainingBlock,
  allLogs: Record<string, string>[],
  templateDrillCounts: Map<string, number>
): Promise<ActiveBlockInfo> {
  const blockLogs = allLogs.filter(l => l.block_id === block.id)
  const scoredLogs = blockLogs.filter(l => parseBoolStr(l.skipped) === false && l.score !== '')
  const total_drills = (block.template_id ? (templateDrillCounts.get(block.template_id) ?? 0) : 0) * block.target_sessions
  return { block, completed_drills: scoredLogs.length, total_drills,
    todays_drill_count: scoredLogs.filter(l => l.log_date === today()).length }
}

const parseBoolStr = (v: string) => v.toLowerCase() === 'true'

export async function getActiveBlocks(): Promise<ActiveBlockInfo[]> {
  const [blockRows, templateRows, btdRows, logRows] = await Promise.all([
    getCachedRows('training_blocks'), getCachedRows('block_templates'),
    getCachedRows('block_template_drills'), getCachedRows('drill_logs'),
  ])
  const templateMap = new Map(templateRows.map(r => [r.id, r]))
  const templateDrillCounts = new Map<string, number>()
  for (const btd of btdRows) {
    templateDrillCounts.set(btd.template_id, (templateDrillCounts.get(btd.template_id) ?? 0) + 1)
  }
  const activeBlocks = blockRows
    .filter(r => r.status === 'active')
    .sort((a, b) => b.started_at.localeCompare(a.started_at))
    .map(r => rowToBlock({ ...r, name: (r.template_id ? templateMap.get(r.template_id)?.name : undefined) ?? r.name }))
  return Promise.all(activeBlocks.map(b => fetchBlockInfo(b, logRows, templateDrillCounts)))
}

export async function getActiveBlock(): Promise<ActiveBlockInfo | null> {
  return (await getActiveBlocks())[0] ?? null
}

export async function getBlocks(): Promise<TrainingBlock[]> {
  const rows = await getCachedRows('training_blocks')
  return rows.map(rowToBlock).sort((a, b) => b.started_at.localeCompare(a.started_at))
}

export async function getBlock(id: string): Promise<BlockWithDayLogs | null> {
  const [blockRows, templateRows, logRows, drillRows] = await Promise.all([
    getCachedRows('training_blocks'), getCachedRows('block_templates'),
    getCachedRows('drill_logs'), getCachedRows('drills'),
  ])
  const blockRaw = blockRows.find(r => r.id === id)
  if (!blockRaw) return null
  const tmplRaw = blockRaw.template_id ? templateRows.find(r => r.id === blockRaw.template_id) : null
  const block: BlockWithDayLogs = {
    ...rowToBlock(blockRaw),
    template: tmplRaw ? {
      id: tmplRaw.id, name: tmplRaw.name, description: nullStr(tmplRaw.description),
      target_sessions: Number(tmplRaw.target_sessions), is_default: parseBoolStr(tmplRaw.is_default),
      created_at: tmplRaw.created_at,
    } : null,
    day_logs: [],
  }
  const drillMap = new Map(drillRows.map(r => [r.id, rowToDrill(r)]))
  const blockLogs = logRows
    .filter(r => r.block_id === id)
    .sort((a, b) => { const d = b.log_date.localeCompare(a.log_date); return d !== 0 ? d : b.created_at.localeCompare(a.created_at) })
  const dayMap = new Map<string, BlockWithDayLogs['day_logs'][number]>()
  for (const r of blockLogs) {
    const drill = drillMap.get(r.drill_id)
    if (!drill) continue
    if (!dayMap.has(r.log_date)) dayMap.set(r.log_date, { log_date: r.log_date, drills: [] })
    dayMap.get(r.log_date)!.drills.push({
      id: r.id, block_id: id, drill_id: r.drill_id,
      score: r.score === '' ? null : Number(r.score),
      skipped: parseBoolStr(r.skipped), log_date: r.log_date, created_at: r.created_at, drill,
    })
  }
  block.day_logs = Array.from(dayMap.values())
  return block
}

export async function isBlockComplete(blockId: string): Promise<boolean> {
  const [blockRows, btdRows, logRows] = await Promise.all([
    getRows('training_blocks'), getRows('block_template_drills'), getRows('drill_logs'),
  ])
  const block = blockRows.map(r => ({ id: r.get('id'), status: r.get('status'), template_id: r.get('template_id'), target_sessions: r.get('target_sessions') })).find(r => r.id === blockId)
  if (!block || block.status !== 'active' || !block.template_id) return false
  const templateDrills = btdRows.filter(r => r.get('template_id') === block.template_id)
  if (templateDrills.length === 0) return false
  const scoredLogs = logRows.filter(r => r.get('block_id') === blockId && r.get('skipped').toLowerCase() === 'false' && r.get('score') !== '')
  const target = Number(block.target_sessions)
  return templateDrills.every(btd => scoredLogs.filter(l => l.get('drill_id') === btd.get('drill_id')).length >= target)
}
