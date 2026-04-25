import { sql } from '@/lib/db'
import type { ActiveBlockInfo, BlockWithSessions, SessionWithHistory, TrainingBlock } from '@/lib/types'

export async function getActiveBlock(): Promise<ActiveBlockInfo | null> {
  const blockRows = await sql`
    SELECT * FROM training_blocks WHERE status = 'active' ORDER BY started_at DESC LIMIT 1
  `
  if (!blockRows[0]) return null
  const block = blockRows[0] as TrainingBlock

  // Count completed sessions
  const countRows = await sql`
    SELECT COUNT(*) AS cnt FROM sessions
    WHERE block_id = ${block.id} AND status = 'completed'
  `
  const completedCount = Number(countRows[0].cnt)

  // Find in-progress session
  const inProgressRows = await sql`
    SELECT * FROM sessions
    WHERE block_id = ${block.id} AND status = 'in_progress'
    ORDER BY session_number ASC LIMIT 1
  `
  const inProgressSession = inProgressRows[0] ?? null

  // Next session to start (highest completed session_number + 1, not yet created)
  // We'll compute next session number
  const nextSessionNumber = completedCount + (inProgressSession ? 1 : 0) + 1
  const nextSession =
    !inProgressSession && nextSessionNumber <= block.session_count
      ? { session_number: nextSessionNumber }
      : null

  // Last completed session drills (for score targets)
  let lastSessionDrills: ActiveBlockInfo['lastSessionDrills'] = []
  if (completedCount > 0) {
    const lastRows = await sql`
      SELECT
        sd.*,
        d.name, d.description, d.instructions,
        d.scoring_direction, d.max_score, d.min_score, d.unit, d.is_default, d.created_at AS drill_created_at
      FROM sessions s
      JOIN session_drills sd ON sd.session_id = s.id
      JOIN drills d ON d.id = sd.drill_id
      WHERE s.block_id = ${block.id} AND s.status = 'completed'
      ORDER BY s.session_number DESC, sd.sort_order ASC
    `
    // Take only the most recent session's drills
    const lastSessionId = lastRows[0]?.session_id
    lastSessionDrills = lastRows
      .filter((r: Record<string, unknown>) => r.session_id === lastSessionId)
      .map((r: Record<string, unknown>) => ({
        id: r.id,
        session_id: r.session_id,
        drill_id: r.drill_id,
        score: r.score,
        sort_order: r.sort_order,
        drill: {
          id: r.drill_id,
          name: r.name,
          description: r.description,
          instructions: r.instructions,
          scoring_direction: r.scoring_direction,
          max_score: r.max_score,
          min_score: r.min_score,
          unit: r.unit,
          is_default: r.is_default,
          created_at: r.drill_created_at,
        },
      }))
  }

  return {
    block,
    nextSession: nextSession as ActiveBlockInfo['nextSession'],
    inProgressSession: inProgressSession ?? null,
    completedCount,
    lastSessionDrills,
  }
}

export async function getBlocks(): Promise<TrainingBlock[]> {
  const rows = await sql`
    SELECT * FROM training_blocks ORDER BY started_at DESC
  `
  return rows as TrainingBlock[]
}

export async function getBlock(id: string): Promise<BlockWithSessions | null> {
  const blockRows = await sql`
    SELECT tb.*, bt.name AS template_name, bt.description AS template_description,
           bt.session_count AS template_session_count, bt.is_default AS template_is_default,
           bt.created_at AS template_created_at
    FROM training_blocks tb
    LEFT JOIN block_templates bt ON bt.id = tb.template_id
    WHERE tb.id = ${id}
  `
  if (!blockRows[0]) return null

  const r = blockRows[0] as Record<string, unknown>
  const block: BlockWithSessions = {
    id: r.id as string,
    template_id: r.template_id as string | null,
    name: r.name as string,
    session_count: r.session_count as number,
    status: r.status as 'active' | 'completed',
    started_at: r.started_at as string,
    completed_at: r.completed_at as string | null,
    template: r.template_name
      ? {
          id: r.template_id as string,
          name: r.template_name as string,
          description: r.template_description as string | null,
          session_count: r.template_session_count as number,
          is_default: r.template_is_default as boolean,
          created_at: r.template_created_at as string,
        }
      : null,
    sessions: [],
  }

  const sessionRows = await sql`
    SELECT
      s.*,
      sd.id AS sd_id, sd.drill_id, sd.score, sd.sort_order,
      d.name AS drill_name, d.description AS drill_description,
      d.instructions, d.scoring_direction, d.max_score, d.min_score, d.unit,
      d.is_default, d.created_at AS drill_created_at
    FROM sessions s
    LEFT JOIN session_drills sd ON sd.session_id = s.id
    LEFT JOIN drills d ON d.id = sd.drill_id
    WHERE s.block_id = ${id}
    ORDER BY s.session_number ASC, sd.sort_order ASC
  `

  const sessionMap = new Map<string, SessionWithHistory>()
  for (const row of sessionRows as Record<string, unknown>[]) {
    if (!sessionMap.has(row.id as string)) {
      sessionMap.set(row.id as string, {
        id: row.id as string,
        block_id: row.block_id as string,
        session_number: row.session_number as number,
        session_date: row.session_date as string,
        status: row.status as 'in_progress' | 'completed',
        notes: row.notes as string | null,
        created_at: row.created_at as string,
        drills: [],
      })
    }
    if (row.sd_id) {
      sessionMap.get(row.id as string)!.drills.push({
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

  block.sessions = Array.from(sessionMap.values())
  return block
}
