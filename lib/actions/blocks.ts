'use server'

import { getSheet, getRows, newId, nowISO } from '@/lib/sheets'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function startBlock(templateId: string): Promise<void> {
  const templateRows = await getRows('block_templates')
  const template = templateRows.find(r => r.get('id') === templateId)
  if (!template) throw new Error('Template not found')

  const blockId = newId()
  const sheet = await getSheet('training_blocks')
  await sheet.addRow({
    id:              blockId,
    template_id:     templateId,
    name:            template.get('name'),
    target_sessions: template.get('target_sessions'),
    status:          'active',
    started_at:      nowISO(),
    completed_at:    '',
  })

  revalidatePath('/')
  redirect(`/blocks/${blockId}/drills`)
}

export async function completeBlock(blockId: string): Promise<void> {
  const rows = await getRows('training_blocks')
  const row = rows.find(r => r.get('id') === blockId)
  if (!row) throw new Error('Block not found')
  row.set('status', 'completed')
  row.set('completed_at', nowISO())
  await row.save()

  revalidatePath('/')
  revalidatePath(`/history/${blockId}`)
  redirect(`/history/${blockId}`)
}

export async function endBlockEarly(blockId: string): Promise<void> {
  const rows = await getRows('training_blocks')
  const row = rows.find(r => r.get('id') === blockId)
  if (!row) throw new Error('Block not found')
  row.set('status', 'ended_early')
  row.set('completed_at', nowISO())
  await row.save()

  revalidatePath('/')
  revalidatePath(`/history/${blockId}`)
  redirect('/')
}

export async function extendBlock(blockId: string, additionalSessions: number): Promise<void> {
  const rows = await getRows('training_blocks')
  const row = rows.find(r => r.get('id') === blockId)
  if (!row) throw new Error('Block not found')
  const current = Number(row.get('target_sessions')) || 0
  row.set('target_sessions', String(current + additionalSessions))
  await row.save()

  revalidatePath('/')
  revalidatePath(`/blocks/${blockId}/drills`)
}

export async function deleteBlock(blockId: string): Promise<void> {
  // Delete all drill logs for this block
  const logRows = await getRows('drill_logs')
  const logsToDelete = logRows.filter(r => r.get('block_id') === blockId)
  await Promise.all(logsToDelete.map(r => r.delete()))

  // Delete the block
  const blockRows = await getRows('training_blocks')
  const row = blockRows.find(r => r.get('id') === blockId)
  if (row) await row.delete()

  revalidatePath('/')
  redirect('/')
}
