import { sql } from '@/lib/db'
import type { ActiveBlockInfo, BlockWithDayLogs, TrainingBlock, Drill } from '@/lib/types'

export async function getActiveBlock(): Promise<ActiveBlockInfo | null> {
  const blockRows = await sql`
    SELECT * FROM training_blocks WHERE status = 'active' ORDER BY started_at DESC LIMIT 1
  `
  if (!blockRows[0]) return null
  const block = blockRows[0] as TrainingBlock

  const statsRows = await sql`
    SELECT
      COUNT(*) FILTER (WHERE skipped = false AND score IS NOT NULL) AS completed_drills,
      COUNT(*) FILTER (WHERE log_date = CURRENT_DATE AND skipped = false AND score IS NOT NULL) AS todays_drill_count
    FROM drill_logs
    WHERE block_id = ${block.id}
  `
  const completed_drills = Number(statsRows[0]?.completed_drills ?? 0)
  const todays_drill_count = Number(statsRows[0]?.todays_drill_count ?? 0)

  const templateDrillRows = await sql`
    SELECT COUNT(*) AS drill_count
    FROM block_template_drills
    WHERE template_id = ${block.template_id}
  `
  const template_drill_count = Number(templateDrillRows[0]?.drill_count ?? 0)
  const total_drills = template_drill_count * block.target_days

  return { block, completed_drills, total_drills, todays_drill_count }
}

export async function getBlocks(): Promise<TrainingBlock[]> {
  const rows = await sql`
    SELECT * FROM training_blocks ORDER BY started_at DESC
  `
  return rows as unknown as TrainingBlock[]
}

export async function getBlock(id: string): Promise<BlockWithDayLogs | null> {
  const blockRows = await sql`
    SELECT
      tb.*,
      bt.id          AS template_id_join,
      bt.name        AS template_name,
      bt.description AS template_description,
      bt.target_days AS template_target_days,
      bt.is_default  AS template_is_default,
      bt.created_at  AS template_created_at
    FROM training_blocks tb
    LEFT JOIN block_templates bt ON bt.id = tb.template_id
    WHERE tb.id = ${id}
  `
  if (!blockRows[0]) return null

  const r = blockRows[0] as Record<string, unknown>

  const block: BlockWithDayLogs = {
    id: r.id as string,
    template_id: r.template_id as string | null,
    name: r.name as string,
    target_days: r.target_days as number,
    status: r.status as 'active' | 'completed',
    started_at: r.started_at as string,
    completed_at: r.completed_at as string | null,
    template: r.template_name
      ? {
          id: r.template_id_join as string,
          name: r.template_name as string,
          description: r.template_description as string | null,
          target_days: r.template_target_days as number,
          is_default: r.template_is_default as boolean,
          created_at: r.template_created_at as string,
        }
      : null,
    day_logs: [],
  }

  const logRows = await sql`
    SELECT
      dl.id,
      dl.drill_id,
      dl.score,
      dl.skipped,
      dl.log_date::text AS log_date,
      dl.created_at,
      d.name        AS drill_name,
      d.description AS drill_description,
      d.instructions,
      d.scoring_direction,
      d.max_score,
      d.min_score,
      d.unit,
      d.is_default,
      d.created_at  AS drill_created_at
    FROM drill_logs dl
    JOIN drills d ON d.id = dl.drill_id
    WHERE dl.block_id = ${id}
    ORDER BY dl.log_date DESC, dl.created_at DESC
  `

  const dayMap = new Map<string, BlockWithDayLogs['day_logs'][number]>()
  for (const row of logRows as Record<string, unknown>[]) {
    const dateKey = String(row.log_date)
    if (!dayMap.has(dateKey)) {
      dayMap.set(dateKey, { log_date: dateKey, drills: [] })
    }
    dayMap.get(dateKey)!.drills.push({
      id: row.id as string,
      block_id: id,
      drill_id: row.drill_id as string,
      score: row.score !== null && row.score !== undefined ? Number(row.score) : null,
      skipped: Boolean(row.skipped),
      log_date: dateKey,
      created_at: row.created_at as string,
      drill: {
        id: row.drill_id as string,
        name: row.drill_name as string,
        description: row.drill_description as string,
        instructions: row.instructions as string,
        scoring_direction: row.scoring_direction as Drill['scoring_direction'],
        max_score: row.max_score as number | null,
        min_score: row.min_score as number,
        unit: row.unit as string,
        is_default: row.is_default as boolean,
        created_at: row.drill_created_at as string,
      },
    })
  }

  block.day_logs = Array.from(dayMap.values())
  return block
}
