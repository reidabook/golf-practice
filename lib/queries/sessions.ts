import { sql } from '@/lib/db'
import type { SessionWithDrills } from '@/lib/types'

export async function getSessionWithDrills(id: string): Promise<SessionWithDrills | null> {
  const rows = await sql`
    SELECT
      s.*,
      tb.id AS block_id_check, tb.name AS block_name, tb.session_count AS block_session_count,
      tb.status AS block_status, tb.started_at AS block_started_at,
      tb.completed_at AS block_completed_at, tb.template_id AS block_template_id,
      sd.id AS sd_id, sd.drill_id, sd.score, sd.sort_order,
      d.name AS drill_name, d.description AS drill_description,
      d.instructions, d.scoring_direction, d.max_score, d.min_score, d.unit,
      d.is_default, d.created_at AS drill_created_at
    FROM sessions s
    JOIN training_blocks tb ON tb.id = s.block_id
    LEFT JOIN session_drills sd ON sd.session_id = s.id
    LEFT JOIN drills d ON d.id = sd.drill_id
    WHERE s.id = ${id}
    ORDER BY sd.sort_order ASC
  `

  if (!rows[0]) return null

  const first = rows[0] as Record<string, unknown>
  const session: SessionWithDrills = {
    id: first.id as string,
    block_id: first.block_id as string,
    session_number: first.session_number as number,
    session_date: first.session_date as string,
    status: first.status as 'in_progress' | 'completed',
    notes: first.notes as string | null,
    created_at: first.created_at as string,
    block: {
      id: first.block_id as string,
      template_id: first.block_template_id as string | null,
      name: first.block_name as string,
      session_count: first.block_session_count as number,
      status: first.block_status as 'active' | 'completed',
      started_at: first.block_started_at as string,
      completed_at: first.block_completed_at as string | null,
    },
    drills: [],
  }

  for (const row of rows as Record<string, unknown>[]) {
    if (row.sd_id) {
      session.drills.push({
        id: row.sd_id as string,
        session_id: row.id as string,
        drill_id: row.drill_id as string,
        score: row.score as number | null,
        sort_order: row.sort_order as number,
        drill: {
          id: row.drill_id as string,
          name: row.drill_name as string,
          description: row.drill_description as string,
          instructions: row.instructions as string,
          scoring_direction: row.scoring_direction as 'higher_better' | 'lower_better',
          max_score: row.max_score as number | null,
          min_score: row.min_score as number,
          unit: row.unit as string,
          is_default: row.is_default as boolean,
          created_at: row.drill_created_at as string,
        },
      })
    }
  }

  return session
}
