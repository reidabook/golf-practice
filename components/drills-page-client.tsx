'use client'

import { useState, useTransition } from 'react'
import type { Drill, BlockTemplate } from '@/lib/types'
import { createDrill, updateDrill, deleteDrill } from '@/lib/actions/drills'
import { createTemplate, updateTemplate, deleteTemplate } from '@/lib/actions/templates'
import { logDrillScore } from '@/lib/actions/drill-logs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Plus, Pencil, Trash2, LineChart, X } from 'lucide-react'
import { toast } from 'sonner'
import { DrillForm } from '@/components/drill-form'
import { TemplateForm } from '@/components/template-form'

interface DrillsPageClientProps {
  drills: Drill[]
  templates: BlockTemplate[]
}

interface LogFormState {
  drillId: string
  score: string
  date: string
  notes: string
}

export function DrillsPageClient({ drills: initialDrills, templates: initialTemplates }: DrillsPageClientProps) {
  const [drills, setDrills] = useState(initialDrills)
  const [templates, setTemplates] = useState(initialTemplates)
  const [drillFormOpen, setDrillFormOpen] = useState(false)
  const [editingDrill, setEditingDrill] = useState<Drill | null>(null)
  const [templateFormOpen, setTemplateFormOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<BlockTemplate | null>(null)
  const [isPending, startTransition] = useTransition()
  const [logForm, setLogForm] = useState<LogFormState | null>(null)
  const [isLogging, setIsLogging] = useState(false)

  function handleSaveDrill(data: Parameters<typeof createDrill>[0]) {
    startTransition(async () => {
      try {
        if (editingDrill) {
          await updateDrill(editingDrill.id, data)
          setDrills((prev) => prev.map((d) => (d.id === editingDrill.id ? { ...d, ...data } : d)))
          toast.success('Drill updated')
        } else {
          await createDrill(data)
          toast.success('Drill created')
          // Reload to get the new ID
          window.location.reload()
        }
        setDrillFormOpen(false)
        setEditingDrill(null)
      } catch {
        toast.error('Failed to save drill')
      }
    })
  }

  function handleDeleteDrill(id: string) {
    startTransition(async () => {
      const result = await deleteDrill(id)
      if (result.error) {
        toast.error(result.error)
      } else {
        setDrills((prev) => prev.filter((d) => d.id !== id))
        toast.success('Drill deleted')
      }
    })
  }

  function handleSaveTemplate(data: Parameters<typeof createTemplate>[0]) {
    startTransition(async () => {
      try {
        if (editingTemplate) {
          await updateTemplate(editingTemplate.id, data)
          toast.success('Template updated')
          window.location.reload()
        } else {
          await createTemplate(data)
          toast.success('Template created')
          window.location.reload()
        }
        setTemplateFormOpen(false)
        setEditingTemplate(null)
      } catch {
        toast.error('Failed to save template')
      }
    })
  }

  function handleDeleteTemplate(id: string) {
    startTransition(async () => {
      try {
        await deleteTemplate(id)
        setTemplates((prev) => prev.filter((t) => t.id !== id))
        toast.success('Template deleted')
      } catch {
        toast.error('Failed to delete template')
      }
    })
  }

  function openLogForm(drill: Drill) {
    const today = new Date().toISOString().split('T')[0]
    setLogForm({ drillId: drill.id, score: '', date: today, notes: '' })
  }

  async function handleLogScore() {
    if (!logForm) return
    const score = parseFloat(logForm.score)
    if (isNaN(score)) {
      toast.error('Enter a valid score')
      return
    }
    setIsLogging(true)
    try {
      await logDrillScore(logForm.drillId, score, logForm.date || undefined, logForm.notes || undefined)
      toast.success('Score logged')
      setLogForm(null)
    } catch {
      toast.error('Failed to log score')
    } finally {
      setIsLogging(false)
    }
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Drills</h1>

      {/* Block Templates section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Block Templates</h2>
          <Button
            size="sm"
            onClick={() => { setEditingTemplate(null); setTemplateFormOpen(true) }}
          >
            <Plus className="w-4 h-4 mr-1" />
            New
          </Button>
        </div>

        {templates.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No templates yet.</p>
        ) : (
          <div className="space-y-2">
            {templates.map((t) => (
              <Card key={t.id}>
                <CardContent className="flex items-center gap-3 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{t.name}</p>
                      {t.is_default && <Badge variant="secondary" className="text-xs">Default</Badge>}
                    </div>
                    {t.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{t.session_count} sessions</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { setEditingTemplate(t); setTemplateFormOpen(true) }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete template?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will delete &ldquo;{t.name}&rdquo;. Existing training blocks using this template won&apos;t be affected.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteTemplate(t.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Separator />

      {/* Drill Library section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Drill Library</h2>
          <Button
            size="sm"
            onClick={() => { setEditingDrill(null); setDrillFormOpen(true) }}
          >
            <Plus className="w-4 h-4 mr-1" />
            New
          </Button>
        </div>

        {drills.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No drills yet.</p>
        ) : (
          <div className="space-y-2">
            {drills.map((d) => (
              <div key={d.id} className="space-y-0">
                <Card>
                  <CardContent className="flex items-center gap-3 py-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{d.name}</p>
                        {d.is_default && <Badge variant="secondary" className="text-xs">Default</Badge>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{d.unit}</span>
                        <Badge variant="outline" className="text-xs">
                          {d.scoring_direction === 'higher_better' ? '↑ higher' : '↓ lower'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openLogForm(d)}
                        title="Log score"
                      >
                        <LineChart className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setEditingDrill(d); setDrillFormOpen(true) }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete drill?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove &ldquo;{d.name}&rdquo; from the library. Drills with recorded scores cannot be deleted.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteDrill(d.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>

                {/* Inline log form */}
                {logForm?.drillId === d.id && (
                  <Card className="border-t-0 rounded-t-none border-primary/30">
                    <CardContent className="py-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Log Score</p>
                        <button onClick={() => setLogForm(null)} className="text-muted-foreground hover:text-foreground">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Score ({d.unit})</label>
                          <input
                            type="number"
                            value={logForm.score}
                            onChange={(e) => setLogForm((f) => f ? { ...f, score: e.target.value } : f)}
                            placeholder="0"
                            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Date</label>
                          <input
                            type="date"
                            value={logForm.date}
                            onChange={(e) => setLogForm((f) => f ? { ...f, date: e.target.value } : f)}
                            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Notes (optional)</label>
                        <input
                          type="text"
                          value={logForm.notes}
                          onChange={(e) => setLogForm((f) => f ? { ...f, notes: e.target.value } : f)}
                          placeholder="Any notes..."
                          className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={handleLogScore}
                        disabled={isLogging}
                        className="w-full"
                      >
                        {isLogging ? 'Saving...' : 'Save Log'}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Drill form modal */}
      {drillFormOpen && (
        <DrillForm
          drill={editingDrill}
          onSave={handleSaveDrill}
          onClose={() => { setDrillFormOpen(false); setEditingDrill(null) }}
          isPending={isPending}
        />
      )}

      {/* Template form modal */}
      {templateFormOpen && (
        <TemplateForm
          template={editingTemplate}
          drills={drills}
          onSave={handleSaveTemplate}
          onClose={() => { setTemplateFormOpen(false); setEditingTemplate(null) }}
          isPending={isPending}
        />
      )}
    </div>
  )
}
