'use server'

import { sql } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getDrillComparison } from '@/lib/queries/drill-logs'
import type { DrillSaveResult } from '@/lib/types'

export async function saveDrillLog(
  blockId: string,
  drillId: string,
  score: number
): Promise<DrillSaveResult> {
  const logRows = await sql`
    INSERT INTO drill_logs (block_id, drill_id, score, skipped, log_date)
    VALUES (${blockId}, ${drillId}, ${score}, false, CURRENT_DATE)
    RETURNING id, block_id, drill_id, score, skipped, log_date, created_at
  `
  const row = logRows[0] as Record<string, unknown>
  const log = {
    id: row.id as string,
    block_id: row.block_id as string,
    drill_id: row.drill_id as string,
    score: Number(row.score),
    skipped: Boolean(row.skipped),
    log_date: String(row.log_date),
    created_at: row.created_at as string,
  }

  revalidatePath(`/blocks/${blockId}/drills`)
  revalidatePath('/progress')

  const comparison = await getDrillComparison(blockId, drillId, score)
  return { log, comparison }
}

export async function skipDrillLog(blockId: string, drillId: string): Promise<void> {
  await sql`
    INSERT INTO drill_logs (block_id, drill_id, score, skipped, log_date)
    VALUES (${blockId}, ${drillId}, NULL, true, CURRENT_DATE)
  `
  revalidatePath(`/blocks/${blockId}/drills`)
}
