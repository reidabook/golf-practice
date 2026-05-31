import { sql } from '@/lib/db'
import type { BlockTemplate, TemplateDrill } from '@/lib/types'

export async function getTemplates(): Promise<BlockTemplate[]> {
  const templateRows = await sql`
    SELECT * FROM block_templates ORDER BY is_default DESC, created_at ASC
  `
  if (templateRows.length === 0) return []

  const drillRows = await sql`
    SELECT
      btd.id, btd.template_id, btd.drill_id, btd.sort_order,
      d.name, d.description, d.instructions, d.scoring_direction,
      d.max_score, d.min_score, d.unit, d.is_default,
      d.created_at AS drill_created_at
    FROM block_template_drills btd
    JOIN drills d ON d.id = btd.drill_id
    ORDER BY btd.template_id, btd.sort_order ASC
  `

  const drillsByTemplate = new Map<string, TemplateDrill[]>()
  for (const r of drillRows as Record<string, unknown>[]) {
    const td: TemplateDrill = {
      id: r.id as string,
      template_id: r.template_id as string,
      drill_id: r.drill_id as string,
      sort_order: r.sort_order as number,
      drill: {
        id: r.drill_id as string,
        name: r.name as string,
        description: r.description as string,
        instructions: r.instructions as string,
        scoring_direction: r.scoring_direction as 'higher_better' | 'lower_better',
        max_score: r.max_score as number | null,
        min_score: r.min_score as number,
        unit: r.unit as string,
        is_default: r.is_default as boolean,
        created_at: r.drill_created_at as string,
      },
    }
    const list = drillsByTemplate.get(td.template_id) ?? []
    list.push(td)
    drillsByTemplate.set(td.template_id, list)
  }

  return (templateRows as unknown as BlockTemplate[]).map((t) => ({
    ...t,
    drills: drillsByTemplate.get(t.id) ?? [],
  }))
}

export async function getTemplate(id: string): Promise<BlockTemplate | null> {
  const rows = await sql`
    SELECT * FROM block_templates WHERE id = ${id}
  `
  if (!rows[0]) return null

  const template = rows[0] as BlockTemplate

  const drillRows = await sql`
    SELECT
      btd.*,
      d.id          AS drill_id,
      d.name        AS drill_name,
      d.description AS drill_description,
      d.instructions,
      d.scoring_direction,
      d.max_score,
      d.min_score,
      d.unit,
      d.is_default,
      d.created_at  AS drill_created_at
    FROM block_template_drills btd
    JOIN drills d ON d.id = btd.drill_id
    WHERE btd.template_id = ${id}
    ORDER BY btd.sort_order ASC
  `

  template.drills = drillRows.map((r: Record<string, unknown>) => ({
    id: r.id,
    template_id: r.template_id,
    drill_id: r.drill_id,
    sort_order: r.sort_order,
    drill: {
      id: r.drill_id,
      name: r.drill_name,
      description: r.drill_description,
      instructions: r.instructions,
      scoring_direction: r.scoring_direction,
      max_score: r.max_score,
      min_score: r.min_score,
      unit: r.unit,
      is_default: r.is_default,
      created_at: r.drill_created_at,
    },
  })) as unknown as TemplateDrill[]

  return template
}
