'use server'

import { sql } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function createTemplate(data: {
  name: string
  description: string
  target_sessions: number
  drill_ids: string[]
}): Promise<void> {
  const templateRows = await sql`
    INSERT INTO block_templates (name, description, target_sessions)
    VALUES (${data.name}, ${data.description || null}, ${data.target_sessions})
    RETURNING id
  `
  const templateId = templateRows[0].id as string

  for (let i = 0; i < data.drill_ids.length; i++) {
    await sql`
      INSERT INTO block_template_drills (template_id, drill_id, sort_order)
      VALUES (${templateId}, ${data.drill_ids[i]}, ${i + 1})
    `
  }

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
  await sql`
    UPDATE block_templates
    SET name = ${data.name},
        description = ${data.description || null},
        target_sessions = ${data.target_sessions}
    WHERE id = ${id}
  `

  await sql`DELETE FROM block_template_drills WHERE template_id = ${id}`

  for (let i = 0; i < data.drill_ids.length; i++) {
    await sql`
      INSERT INTO block_template_drills (template_id, drill_id, sort_order)
      VALUES (${id}, ${data.drill_ids[i]}, ${i + 1})
    `
  }

  revalidatePath('/drills')
}

export async function deleteTemplate(id: string): Promise<void> {
  await sql`DELETE FROM block_templates WHERE id = ${id}`
  revalidatePath('/drills')
}
