import { getRows, toObj } from '@/lib/sheets'
import { rowToDrill } from '@/lib/queries/drills'
import type { DrillProgress } from '@/lib/types'

export async function getProgressForAllDrills(): Promise<DrillProgress[]> {
  const [drillRows, logRows, blockRows] = await Promise.all([
    getRows('drills'),
    getRows('drill_logs'),
    getRows('training_blocks'),
  ])

  const blockMap = new Map(blockRows.map(toObj).map(r => [r.id, r]))

  const scoredLogs = logRows
    .map(toObj)
    .filter(r => r.skipped === 'false' && r.score !== '')
    .sort((a, b) => {
      const d = a.log_date.localeCompare(b.log_date)
      return d !== 0 ? d : a.created_at.localeCompare(b.created_at)
    })

  // Group logs by drill_id
  const logsByDrill = new Map<string, typeof scoredLogs>()
  for (const log of scoredLogs) {
    const list = logsByDrill.get(log.drill_id) ?? []
    list.push(log)
    logsByDrill.set(log.drill_id, list)
  }

  const results: DrillProgress[] = []

  for (const drillRaw of drillRows.map(toObj)) {
    const logs = logsByDrill.get(drillRaw.id)
    if (!logs || logs.length === 0) continue

    const drill = rowToDrill(drillRaw)

    const dataPoints = logs.map(l => ({
      date:      l.log_date,
      score:     Number(l.score),
      blockName: blockMap.get(l.block_id)?.name ?? '',
      blockId:   l.block_id,
      source:    'drill_log' as const,
    }))

    const scores = dataPoints.map(d => d.score)
    const personalBest = drill.scoring_direction === 'higher_better'
      ? Math.max(...scores)
      : Math.min(...scores)

    const seenBlocks = new Set<string>()
    const blockBoundaries: { blockId: string; blockName: string }[] = []
    for (const dp of dataPoints) {
      if (dp.blockId && !seenBlocks.has(dp.blockId)) {
        seenBlocks.add(dp.blockId)
        blockBoundaries.push({ blockId: dp.blockId, blockName: dp.blockName })
      }
    }

    results.push({
      drill: { id: drill.id, name: drill.name, unit: drill.unit, scoring_direction: drill.scoring_direction },
      dataPoints,
      personalBest,
      blockBoundaries,
    })
  }

  return results.sort((a, b) => a.drill.name.localeCompare(b.drill.name))
}
