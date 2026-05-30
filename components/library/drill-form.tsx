'use client'

import { useState } from 'react'
import type { Drill } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'

interface DrillFormProps {
  drill: Drill | null
  onSave: (data: {
    name: string
    description: string
    instructions: string
    scoring_direction: 'higher_better' | 'lower_better'
    max_score: number | null
    min_score: number
    unit: string
  }) => void
  onClose: () => void
  isPending: boolean
}

export function DrillForm({ drill, onSave, onClose, isPending }: DrillFormProps) {
  const [name, setName] = useState(drill?.name ?? '')
  const [description, setDescription] = useState(drill?.description ?? '')
  const [instructions, setInstructions] = useState(drill?.instructions ?? '')
  const [direction, setDirection] = useState<'higher_better' | 'lower_better'>(
    drill?.scoring_direction ?? 'higher_better'
  )
  const [unit, setUnit] = useState(drill?.unit ?? '')
  const [minScore, setMinScore] = useState(String(drill?.min_score ?? 0))
  const [maxScore, setMaxScore] = useState(drill?.max_score !== null && drill?.max_score !== undefined ? String(drill.max_score) : '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      name: name.trim(),
      description: description.trim(),
      instructions: instructions.trim(),
      scoring_direction: direction,
      max_score: maxScore.trim() === '' ? null : Number(maxScore),
      min_score: Number(minScore),
      unit: unit.trim(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center">
      <div className="bg-background w-full max-w-lg rounded-t-2xl border-t border-border max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <h2 className="font-semibold">{drill ? 'Edit Drill' : 'New Drill'}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="d-name">Name</Label>
            <Input id="d-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="d-desc">Description</Label>
            <Input id="d-desc" value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="d-inst">Instructions</Label>
            <textarea
              id="d-inst"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              required
              rows={3}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Scoring Direction</Label>
            <div className="flex gap-3">
              {(['higher_better', 'lower_better'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDirection(d)}
                  className={`flex-1 py-2 px-3 rounded-md border text-sm transition-colors ${
                    direction === d
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  {d === 'higher_better' ? '↑ Higher is better' : '↓ Lower is better'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="d-unit">Unit</Label>
              <Input id="d-unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="misses" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-min">Min</Label>
              <Input id="d-min" type="number" value={minScore} onChange={(e) => setMinScore(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-max">Max</Label>
              <Input id="d-max" type="number" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} placeholder="none" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? 'Saving...' : 'Save Drill'}
            </Button>
          </div>
        </form>

        {/* Safe area */}
        <div style={{ height: 'max(0px, env(safe-area-inset-bottom))' }} />
      </div>
    </div>
  )
}
