'use server'

import { getSheet, newId, nowISO, today } from '@/lib/sheets'
import { revalidatePath } from 'next/cache'
import { getDrillComparison } from '@/lib/queries/drill-logs'
import { isBlockComplete } from '@/lib/queries/blocks'
import type { DrillSaveResult } from '@/lib/types'

export async function saveDrillLog(
  blockId: string,
  drillId: string,
  score: number
): Promise<DrillSaveResult> {
  const logId = newId()
  const now = nowISO()
  const sheet = await getSheet('drill_logs')
  await sheet.addRow({
    id:         logId,
    block_id:   blockId,
    drill_id:   drillId,
    score:      String(score),
    skipped:    'false',
    log_date:   today(),
    created_at: now,
  })

  revalidatePath(`/blocks/${blockId}/drills`)
  revalidatePath(`/blocks/${blockId}/drills/${drillId}`)
  revalidatePath('/progress')

  const [comparison, blockComplete] = await Promise.all([
    getDrillComparison(blockId, drillId, score),
    isBlockComplete(blockId),
  ])

  const log = {
    id:         logId,
    block_id:   blockId,
    drill_id:   drillId,
    score,
    skipped:    false,
    log_date:   today(),
    created_at: now,
  }

  return { log, comparison, blockComplete }
}

export async function skipDrillLog(blockId: string, drillId: string): Promise<void> {
  const sheet = await getSheet('drill_logs')
  await sheet.addRow({
    id:         newId(),
    block_id:   blockId,
    drill_id:   drillId,
    score:      '',
    skipped:    'true',
    log_date:   today(),
    created_at: nowISO(),
  })
  revalidatePath(`/blocks/${blockId}/drills`)
}

export async function logDrillScore(
  drillId: string,
  score: number,
  date?: string,
  _notes?: string
): Promise<void> {
  const sheet = await getSheet('drill_logs')
  await sheet.addRow({
    id:         newId(),
    block_id:   '',
    drill_id:   drillId,
    score:      String(score),
    skipped:    'false',
    log_date:   date ?? today(),
    created_at: nowISO(),
  })
  revalidatePath('/progress')
}
