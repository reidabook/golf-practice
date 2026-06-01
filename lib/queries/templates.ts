import { getRows, toObj, parseBool, nullStr } from '@/lib/sheets'
import { rowToDrill } from '@/lib/queries/drills'
import type { BlockTemplate, TemplateDrill } from '@/lib/types'

function rowToTemplate(r: Record<string, string>, drills: TemplateDrill[] = []): BlockTemplate {
  return {
    id:              r.id,
    name:            r.name,
    description:     nullStr(r.description),
    target_sessions: Number(r.target_sessions),
    is_default:      parseBool(r.is_default),
    created_at:      r.created_at,
    drills,
  }
}

export async function getTemplates(): Promise<BlockTemplate[]> {
  const [templateRows, btdRows, drillRows] = await Promise.all([
    getRows('block_templates'),
    getRows('block_template_drills'),
    getRows('drills'),
  ])

  const templates = templateRows.map(toObj)
  const btds = btdRows.map(toObj)
  const drillMap = new Map(drillRows.map(toObj).map(r => [r.id, rowToDrill(r)]))

  const drillsByTemplate: Record<string, TemplateDrill[]> = {}
  for (const btd of btds) {
    const drill = drillMap.get(btd.drill_id)
    if (!drill) continue
    const td: TemplateDrill = {
      id:          btd.id,
      template_id: btd.template_id,
      drill_id:    btd.drill_id,
      sort_order:  Number(btd.sort_order),
      drill,
    }
    if (!drillsByTemplate[btd.template_id]) drillsByTemplate[btd.template_id] = []
    drillsByTemplate[btd.template_id].push(td)
  }

  // Sort each template's drills by sort_order
  for (const templateId of Object.keys(drillsByTemplate)) {
    drillsByTemplate[templateId].sort((a: TemplateDrill, b: TemplateDrill) => a.sort_order - b.sort_order)
  }

  return templates
    .map(t => rowToTemplate(t, drillsByTemplate[t.id] ?? []))
    .sort((a: BlockTemplate, b: BlockTemplate) => {
      if (a.is_default !== b.is_default) return a.is_default ? -1 : 1
      return a.created_at.localeCompare(b.created_at)
    })
}

export async function getTemplate(id: string): Promise<BlockTemplate | null> {
  const templates = await getTemplates()
  return templates.find(t => t.id === id) ?? null
}
