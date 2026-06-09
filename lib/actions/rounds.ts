'use server'

import { revalidatePath } from 'next/cache'
import { getSheet, newId, today, nowISO, invalidateSheetCache } from '@/lib/sheets'
import { type HoleEntry, CHARLIE_YATES } from '@/lib/round-scoring'

export async function saveRound(holes: HoleEntry[]): Promise<string> {
  const roundId = newId()

  const roundsSheet = await getSheet('rounds')
  await roundsSheet.addRow({
    id: roundId,
    course: CHARLIE_YATES.key,
    date: today(),
    created_at: nowISO(),
  })

  const holesSheet = await getSheet('round_holes')
  for (let i = 0; i < holes.length; i++) {
    const h = holes[i]
    await holesSheet.addRow({
      id: newId(),
      round_id: roundId,
      hole_number: String(i + 1),
      par: String(CHARLIE_YATES.pars[i]),
      shots_to_sz: String(h.shotsToSZ),
      approaches_in_sz: String(h.approachesInSZ),
      total_putts: String(h.totalPutts),
      putts_inside_4ft: String(h.puttsInside4ft),
      penalty: String(h.penalty),
    })
  }

  invalidateSheetCache()
  revalidatePath('/play')
  return roundId
}
