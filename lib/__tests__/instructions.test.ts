import { describe, expect, it } from 'vitest'
import { parseInstructions } from '@/lib/instructions'

describe('parseInstructions', () => {
  it('groups "- " lines into steps and keeps other lines as text', () => {
    const raw = '- Hit 10 balls. \n - Land short. \n \n\n Your score is the total. A perfect score is 10.'
    expect(parseInstructions(raw)).toEqual([
      { type: 'steps', items: ['Hit 10 balls.', 'Land short.'] },
      { type: 'text', text: 'Your score is the total. A perfect score is 10.' },
    ])
  })
  it('plain text stays a paragraph', () => {
    expect(parseInstructions('Make 25 in a row.')).toEqual([{ type: 'text', text: 'Make 25 in a row.' }])
  })
  it('empty input', () => {
    expect(parseInstructions('  \n ')).toEqual([])
  })
})
