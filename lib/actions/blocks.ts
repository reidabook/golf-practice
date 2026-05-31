'use server'

import { sql } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function startBlock(templateId: string): Promise<void> {
  const templateRows = await sql`
    SELECT * FROM block_templates WHERE id = ${templateId}
  `
  if (!templateRows[0]) throw new Error('Template not found')
  const template = templateRows[0] as { name: string; target_sessions: number }

  const blockRows = await sql`
    INSERT INTO training_blocks (template_id, name, target_sessions)
    VALUES (${templateId}, ${template.name}, ${template.target_sessions})
    RETURNING id
  `
  const blockId = blockRows[0].id as string

  revalidatePath('/')
  redirect(`/blocks/${blockId}/drills`)
}

export async function completeBlock(blockId: string): Promise<void> {
  await sql`
    UPDATE training_blocks
    SET status = 'completed', completed_at = now()
    WHERE id = ${blockId}
  `
  revalidatePath('/')
  revalidatePath(`/history/${blockId}`)
  redirect(`/history/${blockId}`)
}

export async function endBlockEarly(blockId: string): Promise<void> {
  await sql`
    UPDATE training_blocks
    SET status = 'ended_early', completed_at = now()
    WHERE id = ${blockId}
  `
  revalidatePath('/')
  revalidatePath(`/history/${blockId}`)
  redirect('/')
}

export async function extendBlock(blockId: string, additionalSessions: number): Promise<void> {
  await sql`
    UPDATE training_blocks
    SET target_sessions = target_sessions + ${additionalSessions}
    WHERE id = ${blockId}
  `
  revalidatePath('/')
  revalidatePath(`/blocks/${blockId}/drills`)
}

export async function deleteBlock(blockId: string): Promise<void> {
  await sql`DELETE FROM training_blocks WHERE id = ${blockId}`
  revalidatePath('/')
  redirect('/')
}
