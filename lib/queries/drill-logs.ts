import { getCachedRows, today } from '@/lib/sheets'
import { rowToDrill } from '@/lib/queries/drills'
import type { BlockDrillItem, DrillComparison } from '@/lib/types'

const parseBoolStr = (v: string) => v.toLowerCase() === 'true'

export async function getBlockDrills(blockId: string): Promise<BlockDrillItem[]> {
  const [blockRows, btdRows, drillRows, logRows] = await Promise.all([
    getCachedRows('training_blocks'), getCachedRows('block_template_drills'),
    getCachedRows('drills'), getCachedRows('drill_logs'),
  ])
  const block = blockRows.find(r => r.id === blockId)
  if (!block) return []
  const drillMap = new Map(drillRows.map(r => [r.id, rowToDrill(r)]))
  const templateDrills = btdRows
    .filter(r => r.template_id === block.template_id)
    .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
  const blockLogs = logRows.filter(r => r.block_id === blockId && !parseBoolStr(r.skipped) && r.score !== '')
  const todayStr = today()

  return templateDrills
    .map(btd => {
      const drill = drillMap.get(btd.drill_id)
      if (!drill) return null
      const drillLogs = blockLogs
        .filter(l => l.drill_id === btd.drill_id)
        .sort((a, b) => { const d = b.log_date.localeCompare(a.log_date); return d !== 0 ? d : b.created_at.localeCompare(a.created_at) })
      const lastLog = drillLogs[0] ?? null
      return {
        drill, sort_order: Number(btd.sort_order),
        done_today: drillLogs.some(l => l.log_date === todayStr),
        session_count: drillLogs.length,
        last_score: lastLog ? Number(lastLog.score) : null,
        last_log_date: lastLog ? lastLog.log_date : null,
      } satisfies BlockDrillItem
    })
    .filter((x): x is BlockDrillItem => x !== null)
    .sort((a, b) => { if (a.done_today !== b.done_today) return a.done_today ? 1 : -1; return a.sort_order - b.sort_order })
}

export async function getDrillComparison(blockId: string, drillId: string, currentScore: number): Promise<DrillComparison> {
  const [drillRows, logRows] = await Promise.all([getCachedRows('drills'), getCachedRows('drill_logs')])
  const drillRaw = drillRows.find(r => r.id === drillId)
  if (!drillRaw) throw new Error(`Drill not found: ${drillId}`)
  const drill = rowToDrill(drillRaw)
  const drillLogs = logRows
    .filter(r => r.block_id === blockId && r.drill_id === drillId && !parseBoolStr(r.skipped) && r.score !== '')
    .sort((a, b) => { const d = b.log_date.localeCompare(a.log_date); return d !== 0 ? d : b.created_at.localeCompare(a.created_at) })
  const previousScore = drillLogs[1] ? Number(drillLogs[1].score) : null
  const allScores = logRows
    .filter(r => r.drill_id === drillId && !parseBoolStr(r.skipped) && r.score !== '')
    .map(r => Number(r.score))
  const personalBest = allScores.length === 0 ? null
    : drill.scoring_direction === 'higher_better' ? Math.max(...allScores) : Math.min(...allScores)
  const trend: DrillComparison['trend'] = previousScore === null ? 'first'
    : currentScore === previousScore ? 'same'
    : drill.scoring_direction === 'higher_better' ? (currentScore > previousScore ? 'better' : 'worse')
    : (currentScore < previousScore ? 'better' : 'worse')
  return { current_score: currentScore, previous_score: previousScore, personal_best: personalBest, trend, drill }
}
