'use client'

import { useState, useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { Drill, BlockTemplate } from '@/lib/types'
import { createDrill, updateDrill, deleteDrill } from '@/lib/actions/drills'
import { createTemplate, updateTemplate, deleteTemplate } from '@/lib/actions/templates'
import { logDrillScore } from '@/lib/actions/drill-logs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader, Segmented } from '@/components/ui/page'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ChevronDown, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { DrillForm } from '@/components/library/drill-form'
import { TemplateForm } from '@/components/library/template-form'
import { StartBlockButton } from '@/components/library/start-block-button'
import { Guides } from '@/components/library/guides'
import { cn } from '@/lib/utils'

type Tab = 'drills' | 'blocks' | 'guides'
const TABS: { value: Tab; label: string }[] = [
  { value: 'drills', label: 'Drills' },
  { value: 'blocks', label: 'Blocks' },
  { value: 'guides', label: 'Guides' },
]

interface LibraryClientProps {
  drills: Drill[]
  templates: BlockTemplate[]
  activeBlock: { name: string; template_id: string | null } | null
  initialTab?: string
}

export function LibraryClient({ drills: initialDrills, templates: initialTemplates, activeBlock, initialTab }: LibraryClientProps) {
  const activeBlockName = activeBlock?.name ?? null
  const router = useRouter()
  const pathname = usePathname()
  const [tab, setTabState] = useState<Tab>(initialTab === 'blocks' || initialTab === 'guides' ? initialTab : 'drills')

  const [drills, setDrills] = useState(initialDrills)
  const [templates, setTemplates] = useState(initialTemplates)
  const [drillFormOpen, setDrillFormOpen] = useState(false)
  const [editingDrill, setEditingDrill] = useState<Drill | null>(null)
  const [templateFormOpen, setTemplateFormOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<BlockTemplate | null>(null)
  const [isPending, startTransition] = useTransition()

  function setTab(next: Tab) {
    setTabState(next)
    router.replace(next === 'drills' ? pathname : `${pathname}?tab=${next}`, { scroll: false })
  }

  function handleSaveDrill(data: Parameters<typeof createDrill>[0]) {
    startTransition(async () => {
      try {
        if (editingDrill) {
          await updateDrill(editingDrill.id, data)
          setDrills((prev) => prev.map((d) => (d.id === editingDrill.id ? { ...d, ...data } : d)))
          toast.success('Drill saved')
        } else {
          await createDrill(data)
          toast.success('Drill added')
          router.refresh()
        }
        setDrillFormOpen(false)
        setEditingDrill(null)
      } catch {
        toast.error("Couldn't save the drill. Check your connection and try again.")
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
          toast.success('Block saved')
        } else {
          await createTemplate(data)
          toast.success('Block added')
        }
        router.refresh()
        setTemplateFormOpen(false)
        setEditingTemplate(null)
      } catch {
        toast.error("Couldn't save the block. Check your connection and try again.")
      }
    })
  }

  function handleDeleteTemplate(id: string) {
    startTransition(async () => {
      try {
        await deleteTemplate(id)
        setTemplates((prev) => prev.filter((t) => t.id !== id))
        toast.success('Block deleted')
      } catch {
        toast.error("Couldn't delete the block. Check your connection and try again.")
      }
    })
  }

  const newAction =
    tab === 'drills' ? (
      <Button size="sm" variant="secondary" onClick={() => { setEditingDrill(null); setDrillFormOpen(true) }}>
        <Plus /> New drill
      </Button>
    ) : tab === 'blocks' ? (
      <Button size="sm" variant="secondary" onClick={() => { setEditingTemplate(null); setTemplateFormOpen(true) }}>
        <Plus /> New block
      </Button>
    ) : null

  return (
    <div>
      <PageHeader title="Library" action={newAction} className="items-center" />
      <div className="px-4">
        <Segmented value={tab} options={TABS} onChange={setTab} className="mb-5" />

        {tab === 'drills' && (
          drills.length === 0 ? (
            <Empty text="No drills yet. Add the drills you practise so blocks can use them." />
          ) : (
            <div className="divide-y overflow-hidden rounded-lg border bg-card">
              {drills.map((d) => (
                <DrillRow
                  key={d.id}
                  drill={d}
                  onEdit={() => { setEditingDrill(d); setDrillFormOpen(true) }}
                  onDelete={() => handleDeleteDrill(d.id)}
                />
              ))}
            </div>
          )
        )}

        {tab === 'blocks' && (
          templates.length === 0 ? (
            <Empty text="No blocks yet. A block is a set of drills you repeat for a number of sessions." />
          ) : (
            <div className="divide-y overflow-hidden rounded-lg border bg-card">
              {templates.map((t) => (
                <TemplateRow
                  key={t.id}
                  template={t}
                  activeBlockName={activeBlockName}
                  running={activeBlock?.template_id === t.id}
                  onEdit={() => { setEditingTemplate(t); setTemplateFormOpen(true) }}
                  onDelete={() => handleDeleteTemplate(t.id)}
                />
              ))}
            </div>
          )
        )}

        {tab === 'guides' && <Guides />}
      </div>

      {drillFormOpen && (
        <DrillForm
          drill={editingDrill}
          onSave={handleSaveDrill}
          onClose={() => { setDrillFormOpen(false); setEditingDrill(null) }}
          isPending={isPending}
        />
      )}
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

function Empty({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">{text}</p>
}

function DirectionLabel({ direction }: { direction: Drill['scoring_direction'] }) {
  return <>{direction === 'higher_better' ? '↑ Higher is better' : '↓ Lower is better'}</>
}

function DrillRow({ drill, onEdit, onDelete }: { drill: Drill; onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const [score, setScore] = useState('')
  const [date, setDate] = useState(today)
  const [notes, setNotes] = useState('')
  const [logging, setLogging] = useState(false)

  async function handleLog() {
    const value = parseFloat(score)
    if (isNaN(value)) {
      toast.error('Enter a score first')
      return
    }
    setLogging(true)
    try {
      await logDrillScore(drill.id, value, date || undefined, notes || undefined)
      toast.success(`Logged ${value} ${drill.unit}`)
      setScore('')
      setNotes('')
      setOpen(false)
    } catch {
      toast.error("Couldn't log the score. Check your connection and try again.")
    } finally {
      setLogging(false)
    }
  }

  return (
    <div className={cn(open && 'bg-muted/40')}>
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
        <span className="min-w-0 flex-1">
          <span className="block font-bold">{drill.name}</span>
          <span className="block text-sm text-muted-foreground">
            {drill.unit} · <DirectionLabel direction={drill.scoring_direction} />
          </span>
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="space-y-4 px-4 pb-4">
          <div className="space-y-3 rounded-lg border bg-card p-3">
            <p className="label">Log a score outside a block</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor={`score-${drill.id}`}>Score ({drill.unit})</Label>
                <Input id={`score-${drill.id}`} type="number" inputMode="decimal" value={score} onChange={(e) => setScore(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`date-${drill.id}`}>Date</Label>
                <Input id={`date-${drill.id}`} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`notes-${drill.id}`}>Notes</Label>
              <Input id={`notes-${drill.id}`} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
            </div>
            <Button onClick={handleLog} disabled={logging} className="w-full">
              {logging ? 'Logging…' : 'Log score'}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>Edit drill</Button>
            <ConfirmDelete
              title={`Delete ${drill.name}?`}
              body="It's removed from the library. Drills with recorded scores can't be deleted."
              onConfirm={onDelete}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function TemplateRow({
  template,
  activeBlockName,
  running,
  onEdit,
  onDelete,
}: {
  template: BlockTemplate
  activeBlockName: string | null
  running: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const drillCount = template.drills?.length ?? 0

  return (
    <div className={cn(open && 'bg-muted/40')}>
      <div className="flex items-center gap-3 px-4 py-3.5">
        <button onClick={() => setOpen((v) => !v)} aria-expanded={open} className="min-w-0 flex-1 text-left">
          <span className="flex items-center gap-2 font-bold">
            {template.name}
            {running && <span className="label rounded bg-flag px-1.5 py-0.5 text-[10px] text-flag-ink">Running</span>}
          </span>
          <span className="block text-sm text-muted-foreground">
            {template.target_sessions} sessions · {drillCount} drill{drillCount === 1 ? '' : 's'}
          </span>
        </button>
        {!running && (
          <StartBlockButton templateId={template.id} templateName={template.name} activeBlockName={activeBlockName} />
        )}
      </div>
      {open && (
        <div className="space-y-3 px-4 pb-4">
          {template.description && <p className="text-sm text-muted-foreground">{template.description}</p>}
          {drillCount > 0 && (
            <ol className="space-y-1 text-sm">
              {template.drills!.map((td, i) => (
                <li key={td.id} className="flex gap-3">
                  <span className="numeral w-4 shrink-0 text-muted-foreground">{i + 1}</span>
                  {td.drill.name}
                </li>
              ))}
            </ol>
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>Edit block</Button>
            <ConfirmDelete
              title={`Delete ${template.name}?`}
              body="Blocks you've already run from it stay in Progress."
              onConfirm={onDelete}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function ConfirmDelete({ title, body, onConfirm }: { title: string; body: string; onConfirm: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex-1 border-stripe/40 text-stripe hover:bg-stripe/10 hover:text-stripe">
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{body}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
