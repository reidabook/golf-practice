import { sql } from '@/lib/db'
import type { DrillProgress } from '@/lib/types'

export async function getProgressForAllDrills(): Promise<DrillProgress[]> {
  const drills = await sql`
    SELECT DISTINCT d.id, d.name, d.unit, d.scoring_direction
    FROM drills d
    WHERE EXISTS (
      SELECT 1 FROM drill_logs dl
      WHERE dl.drill_id = d.id
        AND dl.skipped = false
        AND dl.score IS NOT NULL
    )
    ORDER BY d.name ASC
  `

  const results = await Promise.all(
    drills.map(async (drill) => {
      const logRows = await sql`
        SELECT
          dl.score,
          dl.log_date,
          tb.name AS block_name,
          tb.id   AS block_id
        FROM drill_logs dl
        JOIN training_blocks tb ON tb.id = dl.block_id
        WHERE dl.drill_id = ${drill.id}
          AND dl.skipped = false
          AND dl.score IS NOT NULL
        ORDER BY dl.log_date ASC, dl.created_at ASC
      `

      const dataPoints = logRows.map((row: Record<string, unknown>) => ({
        date: String(row.log_date),
        score: Number(row.score),
        blockName: row.block_name as string,
        blockId: row.block_id as string,
        source: 'drill_log' as const,
      }))

      const scores = dataPoints.map((dp) => dp.score)
      const personalBest =
        scores.length > 0
          ? drill.scoring_direction === 'higher_better'
            ? Math.max(...scores)
            : Math.min(...scores)
          : null

      const seenBlocks = new Set<string>()
      const blockBoundaries: { blockId: string; blockName: string }[] = []
      for (const dp of dataPoints) {
        if (dp.blockId && !seenBlocks.has(dp.blockId)) {
          seenBlocks.add(dp.blockId)
          blockBoundaries.push({ blockId: dp.blockId, blockName: dp.blockName })
        }
      }

      return {
        drill: {
          id: drill.id,
          name: drill.name,
          unit: drill.unit,
          scoring_direction: drill.scoring_direction,
        },
        dataPoints,
        personalBest,
        blockBoundaries,
      }
    })
  )

  return results
}
