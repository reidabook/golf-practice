import { sql } from '@/lib/db'
import type { DrillProgress } from '@/lib/types'

export async function getProgressForAllDrills(): Promise<DrillProgress[]> {
  // Get all drills that have at least one completed session score OR a standalone log
  const drills = await sql`
    SELECT DISTINCT d.id, d.name, d.unit, d.scoring_direction
    FROM drills d
    WHERE EXISTS (
      SELECT 1
      FROM session_drills sd
      JOIN sessions s ON s.id = sd.session_id
      WHERE sd.drill_id = d.id
        AND s.status = 'completed'
        AND sd.score IS NOT NULL
        AND (sd.skipped = false OR sd.skipped IS NULL)
    )
    OR EXISTS (
      SELECT 1 FROM drill_logs dl WHERE dl.drill_id = d.id
    )
    ORDER BY d.name ASC
  `

  const results = await Promise.all(
    drills.map(async (drill) => {
      const [dataRows, logRows] = await Promise.all([
        sql`
          SELECT
            sd.score,
            s.session_date,
            s.session_number,
            tb.name AS block_name,
            tb.id AS block_id
          FROM session_drills sd
          JOIN sessions s ON s.id = sd.session_id
          JOIN training_blocks tb ON tb.id = s.block_id
          WHERE sd.drill_id = ${drill.id}
            AND s.status = 'completed'
            AND sd.score IS NOT NULL
            AND (sd.skipped = false OR sd.skipped IS NULL)
          ORDER BY s.session_date ASC, s.created_at ASC
        `,
        sql`
          SELECT score, logged_at
          FROM drill_logs
          WHERE drill_id = ${drill.id}
          ORDER BY logged_at ASC
        `,
      ])

      const sessionPoints = dataRows.map((row: any) => ({
        date: String(row.session_date),
        score: Number(row.score),
        blockName: row.block_name as string,
        sessionNumber: row.session_number as number,
        blockId: row.block_id as string,
        source: 'session' as const,
      }))

      const standalonePoints = logRows.map((row: any) => ({
        date: String(row.logged_at),
        score: Number(row.score),
        blockName: 'Standalone',
        sessionNumber: 0,
        blockId: '',
        source: 'standalone' as const,
      }))

      const dataPoints = [...sessionPoints, ...standalonePoints].sort((a, b) =>
        a.date.localeCompare(b.date)
      )

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
