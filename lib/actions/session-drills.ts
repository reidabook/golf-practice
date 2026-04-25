'use server'

import { sql } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function saveScore(sessionDrillId: string, score: number): Promise<void> {
  await sql`
    UPDATE session_drills SET score = ${score} WHERE id = ${sessionDrillId}
  `
  // Get session id for revalidation
  const rows = await sql`
    SELECT session_id FROM session_drills WHERE id = ${sessionDrillId}
  `
  if (rows[0]) {
    revalidatePath(`/sessions/${rows[0].session_id}`)
  }
}

export async function skipDrill(sessionDrillId: string): Promise<void> {
  await sql`UPDATE session_drills SET skipped = true, score = NULL WHERE id = ${sessionDrillId}`
  const rows = await sql`SELECT session_id FROM session_drills WHERE id = ${sessionDrillId}`
  if (rows[0]) {
    revalidatePath(`/sessions/${rows[0].session_id}`)
  }
}
