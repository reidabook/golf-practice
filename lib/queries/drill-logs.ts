import { sql } from '@/lib/db'
import type { BlockDrillItem, DrillComparison, Drill } from '@/lib/types'

export async function getBlockDrills(blockId: string): Promise<BlockDrillItem[]> {
  const rows = await sql`
    WITH today_done AS (
      SELECT DISTINCT drill_id
      FROM drill_logs
      WHERE block_id = ${blockId}
        AND log_date = CURRENT_DATE
        AND skipped = false
        AND score IS NOT NULL
    ),
    last_scores AS (
      SELECT DISTINCT ON (dl.drill_id)
        dl.drill_id,
        dl.score AS last_score,
        dl.log_date AS last_log_date
      FROM drill_logs dl
      WHERE dl.block_id = ${blockId}
        AND dl.skipped = false
        AND dl.score IS NOT NULL
      ORDER BY dl.drill_id, dl.log_date DESC, dl.created_at DESC
    )
    SELECT
      d.id,
      d.name,
      d.description,
      d.instructions,
      d.scoring_direction,
      d.max_score,
      d.min_score,
      d.unit,
      d.is_default,
      d.created_at,
      btd.sort_order,
      CASE WHEN td.drill_id IS NOT NULL THEN true ELSE false END AS done_today,
      ls.last_score,
      ls.last_log_date
    FROM block_template_drills btd
    JOIN training_blocks tb ON tb.id = ${blockId}
    JOIN drills d ON d.id = btd.drill_id
    LEFT JOIN today_done td ON td.drill_id = d.id
    LEFT JOIN last_scores ls ON ls.drill_id = d.id
    WHERE btd.template_id = tb.template_id
    ORDER BY
      CASE WHEN td.drill_id IS NOT NULL THEN 1 ELSE 0 END ASC,
      btd.sort_order ASC
  `

  return rows.map((r: Record<string, unknown>) => ({
    drill: {
      id: r.id as string,
      name: r.name as string,
      description: r.description as string,
      instructions: r.instructions as string,
      scoring_direction: r.scoring_direction as Drill['scoring_direction'],
      max_score: r.max_score as number | null,
      min_score: r.min_score as number,
      unit: r.unit as string,
      is_default: r.is_default as boolean,
      created_at: r.created_at as string,
    },
    sort_order: r.sort_order as number,
    done_today: Boolean(r.done_today),
    last_score: r.last_score !== null && r.last_score !== undefined ? Number(r.last_score) : null,
    last_log_date: r.last_log_date ? String(r.last_log_date) : null,
  }))
}

export async function getDrillComparison(
  blockId: string,
  drillId: string,
  currentScore: number
): Promise<DrillComparison> {
  const drillRows = await sql`
    SELECT id, name, description, instructions, scoring_direction, max_score, min_score, unit, is_default, created_at
    FROM drills WHERE id = ${drillId}
  `
  const drill = drillRows[0] as Record<string, unknown>

  // Previous score: second most recent scored log for this drill in this block
  const prevRows = await sql`
    SELECT score FROM drill_logs
    WHERE block_id = ${blockId}
      AND drill_id = ${drillId}
      AND skipped = false
      AND score IS NOT NULL
    ORDER BY log_date DESC, created_at DESC
    OFFSET 1 LIMIT 1
  `
  const previousScore = prevRows[0] ? Number(prevRows[0].score) : null

  // Personal best across all blocks
  const pbRows = await sql`
    SELECT
      CASE WHEN d.scoring_direction = 'higher_better' THEN MAX(dl.score)
           ELSE MIN(dl.score)
      END AS personal_best
    FROM drill_logs dl
    JOIN drills d ON d.id = dl.drill_id
    WHERE dl.drill_id = ${drillId}
      AND dl.skipped = false
      AND dl.score IS NOT NULL
    GROUP BY d.scoring_direction
  `
  const personalBest = pbRows[0] ? Number(pbRows[0].personal_best) : null

  const scoringDirection = drill.scoring_direction as Drill['scoring_direction']
  let trend: DrillComparison['trend']
  if (previousScore === null) {
    trend = 'first'
  } else if (currentScore === previousScore) {
    trend = 'same'
  } else if (scoringDirection === 'higher_better') {
    trend = currentScore > previousScore ? 'better' : 'worse'
  } else {
    trend = currentScore < previousScore ? 'better' : 'worse'
  }

  return {
    current_score: currentScore,
    previous_score: previousScore,
    personal_best: personalBest,
    trend,
    drill: {
      id: drill.id as string,
      name: drill.name as string,
      description: drill.description as string,
      instructions: drill.instructions as string,
      scoring_direction: scoringDirection,
      max_score: drill.max_score as number | null,
      min_score: drill.min_score as number,
      unit: drill.unit as string,
      is_default: drill.is_default as boolean,
      created_at: drill.created_at as string,
    },
  }
}
