'use client'

import { useState } from 'react'
import type { BlockTemplate, Drill } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, GripVertical } from 'lucide-react'

interface TemplateFormProps {
  template: BlockTemplate | null
  drills: Drill[]
  onSave: (data: {
    name: string
    description: string
    target_days: number
    drill_ids: string[]
  }) => void
  onClose: () => void
  isPending: boolean
}

export function TemplateForm({ template, drills, onSave, onClose, isPending }: TemplateFormProps) {
  const [name, setName] = useState(template?.name ?? '')
  const [description, setDescription] = useState(template?.description ?? '')
  const [targetDays, setTargetDays] = useState(String(template?.target_days ?? 8))
  const [selectedIds, setSelectedIds] = useState<string[]>(
    template?.drills?.map((d) => d.drill_id) ?? []
  )
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  function toggleDrill(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
  }

  function handleDrop(index: number) {
    if (dragIndex === null || dragIndex === index) return
    const next = [...selectedIds]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(index, 0, moved)
    setSelectedIds(next)
    setDragIndex(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      name: name.trim(),
      description: description.trim(),
      target_days: Number(targetDays),
      drill_ids: selectedIds,
    })
  }

  const selectedDrills = selectedIds.map((id) => drills.find((d) => d.id === id)).filter(Boolean) as Drill[]
  const unselectedDrills = drills.filter((d) => !selectedIds.includes(d.id))

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center">
      <div className="bg-background w-full max-w-lg rounded-t-2xl border-t border-border max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <h2 className="font-semibold">{template ? 'Edit Template' : 'New Template'}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="t-name">Template Name</Label>
            <Input id="t-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="t-desc">Description</Label>
            <Input id="t-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="t-count">Number of Days</Label>
            <Input
              id="t-count"
              type="number"
              min={1}
              max={52}
              value={targetDays}
              onChange={(e) => setTargetDays(e.target.value)}
              required
            />
          </div>

          {/* Selected drills (reorderable) */}
          <div className="space-y-2">
            <Label>Drills (in order)</Label>
            {selectedDrills.length === 0 ? (
              <p className="text-sm text-muted-foreground">Select drills below</p>
            ) : (
              <div className="space-y-1 border border-border rounded-lg overflow-hidden">
                {selectedDrills.map((d, i) => (
                  <div
                    key={d.id}
                    draggable
                    onDragStart={() => setDragIndex(i)}
                    onDragOver={(e) => handleDragOver(e, i)}
                    onDrop={() => handleDrop(i)}
                    className="flex items-center gap-2 px-3 py-2 bg-accent/50 border-b border-border last:border-0"
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0 cursor-grab" />
                    <span className="flex-1 text-sm">{d.name}</span>
                    <button
                      type="button"
                      onClick={() => toggleDrill(d.id)}
                      className="text-destructive text-xs px-2 py-0.5 rounded hover:bg-destructive/10"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available drills to add */}
          {unselectedDrills.length > 0 && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Add Drills</Label>
              <div className="space-y-1">
                {unselectedDrills.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDrill(d.id)}
                    className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg border border-border hover:bg-accent transition-colors text-sm"
                  >
                    <span>{d.name}</span>
                    <span className="text-primary text-xs">+ Add</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || selectedIds.length === 0} className="flex-1">
              {isPending ? 'Saving...' : 'Save Template'}
            </Button>
          </div>
        </form>

        <div style={{ height: 'max(0px, env(safe-area-inset-bottom))' }} />
      </div>
    </div>
  )
}
