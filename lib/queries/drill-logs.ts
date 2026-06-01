import { getRows, toObj, nullNum, today } from '@/lib/sheets'
import { rowToDrill } from '@/lib/queries/drills'
import type { BlockDrillItem, DrillComparison, Drill } from '@/lib/types'

export async function getBlockDrills(blockId: string): Promise<BlockDrillItem[]> {
  const [blockRows, btdRows, drillRows, logRows] = await Promise.all([
    getRows('training_blocks'),
    getRows('block_template_drills'),
    getRows('drills'),
    getRows('drill_logs'),
  ])

  const block = blockRows.map(toObj).find(r => r.id === blockId)
  if (!block) return []

  const drillMap = new Map(drillRows.map(toObj).map(r => [r.id, rowToDrill(r)]))

  const templateDrills = btdRows
    .map(toObj)
    .filter(r => r.template_id === block.template_id)
    .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))

  const blockLogs = logRows
    .map(toObj)
    .filter(r => r.block_id === blockId && r.skipped === 'false' && r.score !== '')

  const todayStr = today()

  return templateDrills
    .map(btd => {
      const drill = drillMap.get(btd.drill_id)
      if (!drill) return null

      const drillLogs = blockLogs
        .filter(l => l.drill_id === btd.drill_id)
        .sort((a, b) => {
          const d = b.log_date.localeCompare(a.log_date)
          return d !== 0 ? d : b.created_at.localeCompare(a.created_at)
        })

      const doneToday = drillLogs.some(l => l.log_date === todayStr)
      const lastLog = drillLogs[0] ?? null

      return {
        drill,
        sort_order:     Number(btd.sort_order),
        done_today:     doneToday,
        session_count:  drillLogs.length,
        last_score:     lastLog ? Number(lastLog.score) : null,
        last_log_date:  lastLog ? lastLog.log_date : null,
      } satisfies BlockDrillItem
    })
    .filter((x): x is BlockDrillItem => x !== null)
    // Done-today drills go to the bottom
    .sort((a, b) => {
      if (a.done_today !== b.done_today) return a.done_today ? 1 : -1
      return a.sort_order - b.sort_order
    })
}

export async function getDrillComparison(
  blockId: string,
  drillId: string,
  currentScore: number
): Promise<DrillComparison> {
  const [drillRows, logRows] = await Promise.all([
    getRows('drills'),
    getRows('drill_logs'),
  ])

  const drillRaw = drillRows.map(toObj).find(r => r.id === drillId)
  if (!drillRaw) throw new Error(`Drill not found: ${drillId}`)
  const drill = rowToDrill(drillRaw)

  // All scored non-skipped logs for this drill in this block, newest first
  const drillLogs = logRows
    .map(toObj)
    .filter(r => r.block_id === blockId && r.drill_id === drillId && r.skipped === 'false' && r.score !== '')
    .sort((a, b) => {
      const d = b.log_date.localeCompare(a.log_date)
      return d !== 0 ? d : b.created_at.localeCompare(a.created_at)
    })

  // Previous score = second entry (index 1, since current was just inserted)
  const previousScore = drillLogs[1] ? Number(drillLogs[1].score) : null

  // Personal best across ALL logs for this drill (not just this block)
  const allDrillLogs = logRows
    .map(toObj)
    .filter(r => r.drill_id === drillId && r.skipped === 'false' && r.score !== '')
    .map(r => Number(r.score))

  const personalBest = allDrillLogs.length === 0
    ? null
    : drill.scoring_direction === 'higher_better'
      ? Math.max(...allDrillLogs)
      : Math.min(...allDrillLogs)

  let trend: DrillComparison['trend']
  if (previousScore === null) {
    trend = 'first'
  } else if (currentScore === previousScore) {
    trend = 'same'
  } else if (drill.scoring_direction === 'higher_better') {
    trend = currentScore > previousScore ? 'better' : 'worse'
  } else {
    trend = currentScore < previousScore ? 'better' : 'worse'
  }

  return { current_score: currentScore, previous_score: previousScore, personal_best: personalBest, trend, drill }
}
