'use server'

import { sql } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function createDrill(data: {
  name: string
  description: string
  instructions: string
  scoring_direction: 'higher_better' | 'lower_better'
  max_score: number | null
  min_score: number
  unit: string
}): Promise<void> {
  await sql`
    INSERT INTO drills (name, description, instructions, scoring_direction, max_score, min_score, unit)
    VALUES (
      ${data.name}, ${data.description}, ${data.instructions},
      ${data.scoring_direction}, ${data.max_score}, ${data.min_score}, ${data.unit}
    )
  `
  revalidatePath('/drills')
}

export async function updateDrill(
  id: string,
  data: {
    name: string
    description: string
    instructions: string
    scoring_direction: 'higher_better' | 'lower_better'
    max_score: number | null
    min_score: number
    unit: string
  }
): Promise<void> {
  await sql`
    UPDATE drills
    SET name = ${data.name},
        description = ${data.description},
        instructions = ${data.instructions},
        scoring_direction = ${data.scoring_direction},
        max_score = ${data.max_score},
        min_score = ${data.min_score},
        unit = ${data.unit}
    WHERE id = ${id}
  `
  revalidatePath('/drills')
}

export async function deleteDrill(id: string): Promise<{ error?: string }> {
  try {
    await sql`DELETE FROM drills WHERE id = ${id}`
    revalidatePath('/drills')
    return {}
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes('restrict') || msg.includes('RESTRICT') || msg.includes('foreign key')) {
      return { error: 'Cannot delete a drill that has recorded scores.' }
    }
    return { error: msg }
  }
}
