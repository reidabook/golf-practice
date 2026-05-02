import { sql } from '@/lib/db'
import type { HandicapSnapshot } from '@/lib/types'

/**
 * Returns all handicap snapshots ordered oldest-first for charting.
 * Returns an empty array if the table doesn't exist yet.
 */
export async function getHandicapHistory(): Promise<HandicapSnapshot[]> {
  try {
    const rows = await sql`
      SELECT snapshot_date::text AS snapshot_date, handicap_index
      FROM handicap_snapshots
      ORDER BY snapshot_date ASC
    `
    return rows.map((row: Record<string, unknown>) => ({
      snapshot_date: String(row.snapshot_date),
      handicap_index: Number(row.handicap_index),
    }))
  } catch {
    return []
  }
}
