'use server'

import { getSheet, getRows, toObj, newId, nowISO } from '@/lib/sheets'
import { revalidatePath } from 'next/cache'

export async function createDrill(data: {
  name: string
  description: string
  instructions: string
  scoring_direction: 'higher_better' | 'lower_better'
  max_score: number | null
  min_score: number
  unit: string
}): Promise<void> {
  const sheet = await getSheet('drills')
  await sheet.addRow({
    id:                newId(),
    name:              data.name,
    description:       data.description,
    instructions:      data.instructions,
    scoring_direction: data.scoring_direction,
    max_score:         data.max_score === null ? '' : String(data.max_score),
    min_score:         String(data.min_score),
    unit:              data.unit,
    is_default:        'false',
    category:          '',
    source:            '',
    created_at:        nowISO(),
  })
  revalidatePath('/drills')
}

export async function updateDrill(
  id: string,
  data: {
    name: string
    description: string
    instructions: string
    scoring_direction: 'higher_better' | 'lower_better'
    max_score: number | null
    min_score: number
    unit: string
  }
): Promise<void> {
  const rows = await getRows('drills')
  const row = rows.find(r => r.get('id') === id)
  if (!row) throw new Error(`Drill not found: ${id}`)
  row.set('name', data.name)
  row.set('description', data.description)
  row.set('instructions', data.instructions)
  row.set('scoring_direction', data.scoring_direction)
  row.set('max_score', data.max_score === null ? '' : String(data.max_score))
  row.set('min_score', String(data.min_score))
  row.set('unit', data.unit)
  await row.save()
  revalidatePath('/drills')
}

export async function deleteDrill(id: string): Promise<{ error?: string }> {
  try {
    // Check for existing logs (replaces DB foreign key constraint)
    const logRows = await getRows('drill_logs')
    const hasLogs = logRows.some(r => r.get('drill_id') === id)
    if (hasLogs) return { error: 'Cannot delete a drill that has recorded scores.' }

    // Check for template references
    const btdRows = await getRows('block_template_drills')
    const inTemplate = btdRows.some(r => r.get('drill_id') === id)
    if (inTemplate) return { error: 'Cannot delete a drill that is used in a template.' }

    const rows = await getRows('drills')
    const row = rows.find(r => r.get('id') === id)
    if (!row) return { error: 'Drill not found.' }
    await row.delete()
    revalidatePath('/drills')
    return {}
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : String(e) }
  }
}
