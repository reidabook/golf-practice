'use server'

import { sql } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function startBlock(templateId: string): Promise<void> {
  const templateRows = await sql`
    SELECT * FROM block_templates WHERE id = ${templateId}
  `
  if (!templateRows[0]) throw new Error('Template not found')
  const template = templateRows[0] as { name: string; target_days: number }

  const activeRows = await sql`
    SELECT id FROM training_blocks WHERE status = 'active' LIMIT 1
  `
  if (activeRows[0]) throw new Error('A block is already active. Complete it first.')

  const blockRows = await sql`
    INSERT INTO training_blocks (template_id, name, target_days)
    VALUES (${templateId}, ${template.name}, ${template.target_days})
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

export async function deleteBlock(blockId: string): Promise<void> {
  await sql`DELETE FROM training_blocks WHERE id = ${blockId}`
  revalidatePath('/')
  redirect('/')
}
