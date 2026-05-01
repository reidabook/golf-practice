import { sql } from '@/lib/db'
import type { Drill } from '@/lib/types'

export async function getDrills(): Promise<Drill[]> {
  const rows = await sql`
    SELECT * FROM drills ORDER BY is_default DESC, name ASC
  `
  return rows as unknown as Drill[]
}

export async function getDrill(id: string): Promise<Drill | null> {
  const rows = await sql`
    SELECT * FROM drills WHERE id = ${id}
  `
  return (rows[0] as Drill) ?? null
}
