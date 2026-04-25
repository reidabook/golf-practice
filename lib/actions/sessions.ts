'use server'

import { sql } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createSession(blockId: string, sessionNumber: number): Promise<string> {
  // Get the template drills via the block's template
  const blockRows = await sql`
    SELECT tb.*, bt.id AS bt_id
    FROM training_blocks tb
    LEFT JOIN block_templates bt ON bt.id = tb.template_id
    WHERE tb.id = ${blockId}
  `
  if (!blockRows[0]) throw new Error('Block not found')
  const block = blockRows[0] as { bt_id: string | null }

  const sessionRows = await sql`
    INSERT INTO sessions (block_id, session_number, session_date)
    VALUES (${blockId}, ${sessionNumber}, CURRENT_DATE)
    RETURNING id
  `
  const sessionId = sessionRows[0].id as string

  if (block.bt_id) {
    const templateDrills = await sql`
      SELECT drill_id, sort_order
      FROM block_template_drills
      WHERE template_id = ${block.bt_id}
      ORDER BY sort_order ASC
    `
    for (const td of templateDrills as { drill_id: string; sort_order: number }[]) {
      await sql`
        INSERT INTO session_drills (session_id, drill_id, sort_order)
        VALUES (${sessionId}, ${td.drill_id}, ${td.sort_order})
      `
    }
  }

  revalidatePath('/')
  return sessionId
}

export async function reorderDrills(
  sessionId: string,
  orderedDrillIds: string[]
): Promise<void> {
  for (let i = 0; i < orderedDrillIds.length; i++) {
    await sql`
      UPDATE session_drills
      SET sort_order = ${i + 1}
      WHERE session_id = ${sessionId} AND drill_id = ${orderedDrillIds[i]}
    `
  }
  revalidatePath(`/sessions/${sessionId}`)
}

export async function completeSession(sessionId: string, notes?: string): Promise<void> {
  await sql`
    UPDATE sessions
    SET status = 'completed', notes = ${notes ?? null}
    WHERE id = ${sessionId}
  `

  // Get the block info
  const sessionRows = await sql`
    SELECT block_id FROM sessions WHERE id = ${sessionId}
  `
  const blockId = sessionRows[0]?.block_id as string

  // Check if this was the last session in the block
  const blockRows = await sql`
    SELECT session_count FROM training_blocks WHERE id = ${blockId}
  `
  const sessionCount = blockRows[0]?.session_count as number

  const completedRows = await sql`
    SELECT COUNT(*) AS cnt FROM sessions
    WHERE block_id = ${blockId} AND status = 'completed'
  `
  const completedCount = Number(completedRows[0].cnt)

  revalidatePath('/')
  revalidatePath(`/sessions/${sessionId}`)

  if (completedCount >= sessionCount) {
    // Complete the block
    await sql`
      UPDATE training_blocks
      SET status = 'completed', completed_at = now()
      WHERE id = ${blockId}
    `
    revalidatePath(`/history/${blockId}`)
    redirect(`/history/${blockId}`)
  } else {
    // Create next session
    const nextNumber = completedCount + 1
    const nextSessionRows = await sql`
      INSERT INTO sessions (block_id, session_number, session_date)
      VALUES (${blockId}, ${nextNumber}, CURRENT_DATE)
      RETURNING id
    `
    const nextSessionId = nextSessionRows[0].id as string

    // Copy drills from template
    const blockInfoRows = await sql`
      SELECT template_id FROM training_blocks WHERE id = ${blockId}
    `
    const templateId = blockInfoRows[0]?.template_id as string | null
    if (templateId) {
      const templateDrills = await sql`
        SELECT drill_id, sort_order
        FROM block_template_drills
        WHERE template_id = ${templateId}
        ORDER BY sort_order ASC
      `
      for (const td of templateDrills as { drill_id: string; sort_order: number }[]) {
        await sql`
          INSERT INTO session_drills (session_id, drill_id, sort_order)
          VALUES (${nextSessionId}, ${td.drill_id}, ${td.sort_order})
        `
      }
    }

    revalidatePath('/')
    redirect('/')
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  // Only in-progress sessions can be deleted
  const rows = await sql`
    SELECT block_id, status FROM sessions WHERE id = ${sessionId}
  `
  if (!rows[0]) throw new Error('Session not found')
  if (rows[0].status !== 'in_progress') throw new Error('Cannot delete a completed session')

  const blockId = rows[0].block_id as string

  await sql`DELETE FROM sessions WHERE id = ${sessionId}`

  revalidatePath('/')
  revalidatePath(`/history/${blockId}`)
  redirect('/')
}
