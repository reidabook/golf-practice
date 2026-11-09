export type InstructionBlock = { type: 'steps'; items: string[] } | { type: 'text'; text: string }

/**
 * Turns a drill's free-text instructions into display blocks: consecutive lines starting
 * with "- " become a numbered list, other lines become paragraphs. Blank lines are dropped.
 */
export function parseInstructions(raw: string): InstructionBlock[] {
  const blocks: InstructionBlock[] = []
  for (const line of raw.split('\n').map((l) => l.trim()).filter(Boolean)) {
    const step = line.match(/^[-•*]\s+(.*)$/)
    const last = blocks[blocks.length - 1]
    if (step) {
      if (last?.type === 'steps') last.items.push(step[1])
      else blocks.push({ type: 'steps', items: [step[1]] })
    } else {
      blocks.push({ type: 'text', text: line })
    }
  }
  return blocks
}
