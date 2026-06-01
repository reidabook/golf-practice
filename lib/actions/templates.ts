'use server'

import { getSheet, getRows, newId, nowISO, invalidateSheetCache } from '@/lib/sheets'
import { revalidatePath } from 'next/cache'

export async function createTemplate(data: {
  name: string
  description: string
  target_sessions: number
  drill_ids: string[]
}): Promise<void> {
  const templateId = newId()
  const templateSheet = await getSheet('block_templates')
  await templateSheet.addRow({
    id:              templateId,
    name:            data.name,
    description:     data.description || '',
    target_sessions: String(data.target_sessions),
    is_default:      'false',
    created_at:      nowISO(),
  })

  if (data.drill_ids.length > 0) {
    const btdSheet = await getSheet('block_template_drills')
    await btdSheet.addRows(
      data.drill_ids.map((drillId, i) => ({
        id:          newId(),
        template_id: templateId,
        drill_id:    drillId,
        sort_order:  String(i + 1),
      }))
    )
  }

  invalidateSheetCache()
  revalidatePath('/drills')
}

export async function updateTemplate(
  id: string,
  data: {
    name: string
    description: string
    target_sessions: number
    drill_ids: string[]
  }
): Promise<void> {
  // Update template row
  const templateRows = await getRows('block_templates')
  const templateRow = templateRows.find(r => r.get('id') === id)
  if (!templateRow) throw new Error(`Template not found: ${id}`)
  templateRow.set('name', data.name)
  templateRow.set('description', data.description || '')
  templateRow.set('target_sessions', String(data.target_sessions))
  await templateRow.save()

  // Delete old junction rows
  const btdRows = await getRows('block_template_drills')
  const toDelete = btdRows.filter(r => r.get('template_id') === id)
  await Promise.all(toDelete.map(r => r.delete()))

  // Insert new junction rows
  if (data.drill_ids.length > 0) {
    const btdSheet = await getSheet('block_template_drills')
    await btdSheet.addRows(
      data.drill_ids.map((drillId, i) => ({
        id:          newId(),
        template_id: id,
        drill_id:    drillId,
        sort_order:  String(i + 1),
      }))
    )
  }

  invalidateSheetCache()
  revalidatePath('/drills')
}

export async function deleteTemplate(id: string): Promise<void> {
  // Delete junction rows first
  const btdRows = await getRows('block_template_drills')
  const toDelete = btdRows.filter(r => r.get('template_id') === id)
  await Promise.all(toDelete.map(r => r.delete()))

  // Delete template
  const templateRows = await getRows('block_templates')
  const row = templateRows.find(r => r.get('id') === id)
  if (row) await row.delete()

  invalidateSheetCache()
  revalidatePath('/drills')
}
