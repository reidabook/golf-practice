'use server'

import { getSheet, getRows, newId, nowISO, invalidateSheetCache } from '@/lib/sheets'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// One block runs at a time: starting a block ends any active one early (the UI confirms first).
export async function startBlock(templateId: string): Promise<void> {
  const [templateRows, blockRows] = await Promise.all([getRows('block_templates'), getRows('training_blocks')])
  const template = templateRows.find(r => r.get('id') === templateId)
  if (!template) throw new Error('Template not found')

  const stamp = nowISO()
  for (const row of blockRows.filter(r => r.get('status') === 'active')) {
    row.set('status', 'ended_early')
    row.set('completed_at', stamp)
    await row.save()
  }

  const blockId = newId()
  const sheet = await getSheet('training_blocks')
  await sheet.addRow({
    id:              blockId,
    template_id:     templateId,
    name:            template.get('name'),
    target_sessions: template.get('target_sessions'),
    status:          'active',
    started_at:      stamp,
    completed_at:    '',
  })

  invalidateSheetCache()
  revalidatePath('/')
  redirect('/')
}

export async function completeBlock(blockId: string): Promise<void> {
  const rows = await getRows('training_blocks')
  const row = rows.find(r => r.get('id') === blockId)
  if (!row) throw new Error('Block not found')
  row.set('status', 'completed')
  row.set('completed_at', nowISO())
  await row.save()

  invalidateSheetCache()
  revalidatePath('/')
  invalidateSheetCache()
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

  invalidateSheetCache()
  revalidatePath('/')
  invalidateSheetCache()
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

  invalidateSheetCache()
  revalidatePath('/')
  invalidateSheetCache()
  revalidatePath(`/blocks/${blockId}/drills`, 'layout')
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

  invalidateSheetCache()
  revalidatePath('/')
  redirect('/')
}
