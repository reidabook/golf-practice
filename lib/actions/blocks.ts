'use server'

import { sql } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function startBlock(templateId: string): Promise<void> {
  // Load template
  const templateRows = await sql`
    SELECT * FROM block_templates WHERE id = ${templateId}
  `
  if (!templateRows[0]) throw new Error('Template not found')
  const template = templateRows[0] as { name: string; session_count: number }

  // Ensure no other active block
  const activeRows = await sql`
    SELECT id FROM training_blocks WHERE status = 'active' LIMIT 1
  `
  if (activeRows[0]) throw new Error('A block is already active. Complete it first.')

  // Create the training block
  const blockRows = await sql`
    INSERT INTO training_blocks (template_id, name, session_count)
    VALUES (${templateId}, ${template.name}, ${template.session_count})
    RETURNING id
  `
  const blockId = blockRows[0].id as string

  // Load template drills in order
  const templateDrills = await sql`
    SELECT drill_id, sort_order
    FROM block_template_drills
    WHERE template_id = ${templateId}
    ORDER BY sort_order ASC
  `

  // Create session 1 with its drills (transactional-ish via sequential inserts)
  const sessionRows = await sql`
    INSERT INTO sessions (block_id, session_number, session_date)
    VALUES (${blockId}, 1, CURRENT_DATE)
    RETURNING id
  `
  const sessionId = sessionRows[0].id as string

  for (const td of templateDrills as { drill_id: string; sort_order: number }[]) {
    await sql`
      INSERT INTO session_drills (session_id, drill_id, sort_order)
      VALUES (${sessionId}, ${td.drill_id}, ${td.sort_order})
    `
  }

  revalidatePath('/')
  redirect(`/sessions/${sessionId}`)
}

export async function completeBlock(blockId: string): Promise<void> {
  await sql`
    UPDATE training_blocks
    SET status = 'completed', completed_at = now()
    WHERE id = ${blockId}
  `
  revalidatePath('/')
  revalidatePath(`/history/${blockId}`)
}
