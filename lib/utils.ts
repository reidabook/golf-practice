import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatScoreWithUnit(score: number | null, unit: string): string {
  if (score === null) return '—'
  return `${score} ${unit}`
}

export function clampScore(value: number, min: number, max: number | null): number {
  if (value < min) return min
  if (max !== null && value > max) return max
  return value
}
