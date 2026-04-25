'use server'

import { sql } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function logDrillScore(
  drillId: string,
  score: number,
  date?: string,
  notes?: string
): Promise<void> {
  const logDate = date ?? new Date().toISOString().split('T')[0]
  await sql`
    INSERT INTO drill_logs (drill_id, score, logged_at, notes)
    VALUES (${drillId}, ${score}, ${logDate}, ${notes ?? null})
  `
  revalidatePath('/drills')
  revalidatePath('/progress')
}

export async function deleteDrillLog(logId: string): Promise<void> {
  await sql`DELETE FROM drill_logs WHERE id = ${logId}`
  revalidatePath('/drills')
  revalidatePath('/progress')
}
