'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  CHARLIE_YATES,
  calcSummary,
  getFocusAreas,
  enteredInRegulation,
  gotDown,
  type HoleEntry,
} from '@/lib/round-scoring'
import { saveRound } from '@/lib/actions/rounds'

const PARS = CHARLIE_YATES.pars
const HOLES = PARS.length

function defaultHole(): HoleEntry {
  return { shotsToSZ: 0, approachesInSZ: 0, totalPutts: 0, puttsInside4ft: 0, penalty: false }
}

function Stepper({
  value,
  onChange,
  min = 0,
  max = 10,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-xl font-light disabled:opacity-30"
      >
        −
      </button>
      <span className="w-8 text-center text-2xl font-semibold tabular-nums">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-xl font-light disabled:opacity-30"
      >
        +
      </button>
    </div>
  )
}

function HoleForm({
  holeIndex,
  entry,
  onChange,
  onNext,
  onBack,
  isLast,
}: {
  holeIndex: number
  entry: HoleEntry
  onChange: (e: HoleEntry) => void
  onNext: () => void
  onBack: (() => void) | null
  isLast: boolean
}) {
  const par = PARS[holeIndex]
  const regulation = par - 2
  const progress = (holeIndex / HOLES) * 100
  const inRegulation = enteredInRegulation(entry, par)

  function set(patch: Partial<HoleEntry>) {
    onChange({ ...entry, ...patch })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none pb-0.5"
              aria-label="Previous hole"
            >
              ←
            </button>
          )}
          <div>
            <p className="text-sm text-muted-foreground">Hole {holeIndex + 1} of {HOLES}</p>
            <p className="text-3xl font-bold">Par {par}</p>
          </div>
        </div>
      </div>

      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
      </div>

      {/* Shots to reach SZ */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Entered Scoring Zone in</p>
          <p className="text-xs text-muted-foreground">regulation = {regulation} shot{regulation !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-4">
          <Stepper value={entry.shotsToSZ} onChange={v => set({ shotsToSZ: v })} min={0} max={10} />
          {entry.shotsToSZ > 0 && (
            <span className={cn('text-sm font-medium', inRegulation ? 'text-green-500' : 'text-red-400')}>
              {inRegulation ? '✓ in regulation' : '✗ not in regulation'}
            </span>
          )}
        </div>
      </div>

      {/* Approaches in SZ */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Approaches in SZ</p>
        <Stepper value={entry.approachesInSZ} onChange={v => set({ approachesInSZ: v })} max={8} />
      </div>

      {/* Total Putts */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Putts</p>
        <Stepper value={entry.totalPutts} onChange={v => set({ totalPutts: v })} max={8} />
      </div>

      {/* Putts ≤ 4ft */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Putts ≤ 4ft</p>
        <Stepper
          value={entry.puttsInside4ft}
          onChange={v => set({ puttsInside4ft: v })}
          max={entry.totalPutts}
        />
      </div>

      {/* Penalty */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
        <p className="text-sm font-medium">Penalty / Lost Ball</p>
        <button
          onClick={() => set({ penalty: !entry.penalty })}
          className={cn('w-12 h-6 rounded-full transition-colors relative', entry.penalty ? 'bg-primary' : 'bg-muted')}
        >
          <span
            className={cn(
              'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all',
              entry.penalty ? 'left-6' : 'left-0.5'
            )}
          />
        </button>
      </div>

      <button
        onClick={onNext}
        className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm transition-opacity"
      >
        {isLast ? 'Finish Round' : 'Next Hole →'}
      </button>
    </div>
  )
}

function Summary({ holes, date, onEdit }: { holes: HoleEntry[]; date: string; onEdit: (i: number) => void }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const s = calcSummary(holes, PARS)
  const focus = getFocusAreas(s)

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      await saveRound(holes)
      clearDraft()
      router.push('/play')
    } catch (e) {
      setSaving(false)
      setSaveError(e instanceof Error ? e.message : 'Save failed — check the console')
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">Charlie Yates · {date}</p>
        <p className="text-3xl font-bold mt-1">{s.totalPutts} putts total</p>
      </div>

      <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
        <div className="px-5 py-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Successes</p>
        </div>
        {[
          { num: '1', label: 'Gave myself a chance', value: s.box1 },
          { num: '2', label: 'DSZ (down in ≤3)', value: s.box2 },
          { num: '3', label: 'Strokes gained putting', value: s.box3 },
          { num: '4', label: 'One putts', value: s.box4 },
        ].map(row => (
          <div key={row.num} className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded bg-muted flex items-center justify-center text-xs font-bold">{row.num}</span>
              <span className="text-sm">{row.label}</span>
            </div>
            <span className="text-lg font-semibold tabular-nums">{row.value}</span>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
        <div className="px-5 py-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Feedback</p>
        </div>
        {[
          { num: 'A', label: 'Out of position', value: s.a },
          { num: 'B', label: 'Not DSZ', value: s.b },
          { num: 'C', label: 'Missed short putts', value: s.c },
          { num: 'D', label: 'Three-putts', value: s.d },
        ].map(row => (
          <div key={row.num} className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded bg-muted flex items-center justify-center text-xs font-bold">{row.num}</span>
              <span className="text-sm">{row.label}</span>
            </div>
            <span className={cn(
              'text-lg font-semibold tabular-nums',
              row.value >= 3 ? 'text-red-500' : row.value >= 1 ? 'text-yellow-500' : 'text-green-500'
            )}>
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {focus.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Focus Areas</p>
          {focus.map((f, i) => (
            <div key={i} className="flex gap-2 text-sm">
              <span className="text-primary mt-0.5">▸</span>
              <span>{f}</span>
            </div>
          ))}
        </div>
      )}

      {/* Scorecard */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Scorecard</p>
          <p className="text-xs text-muted-foreground">tap hole # to edit</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-center">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 px-2 text-left text-muted-foreground font-normal"></th>
                {holes.map((_, i) => (
                  <th key={i} className="py-2 px-1 font-normal">
                    <button
                      onClick={() => onEdit(i)}
                      className="text-primary underline underline-offset-2 tabular-nums"
                    >
                      {i + 1}
                    </button>
                  </th>
                ))}
                <th className="py-2 px-2 text-muted-foreground font-normal">Tot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="py-1.5 px-2 text-left text-muted-foreground">Par</td>
                {PARS.map((p, i) => <td key={i} className="py-1.5 px-1">{p}</td>)}
                <td className="py-1.5 px-2 font-medium">{PARS.reduce((a, b) => a + b, 0)}</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2 text-left text-muted-foreground">ESZ</td>
                {holes.map((h, i) => (
                  <td key={i} className="py-1.5 px-1">{enteredInRegulation(h, PARS[i]) ? '✓' : '✗'}</td>
                ))}
                <td className="py-1.5 px-2 font-medium">{s.box1}</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2 text-left text-muted-foreground">DSZ</td>
                {holes.map((h, i) => (
                  <td key={i} className="py-1.5 px-1">{gotDown(h) ? '✓' : '✗'}</td>
                ))}
                <td className="py-1.5 px-2 font-medium">{s.box2}</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2 text-left text-muted-foreground">Putts</td>
                {holes.map((h, i) => <td key={i} className="py-1.5 px-1">{h.totalPutts}</td>)}
                <td className="py-1.5 px-2 font-medium">{s.totalPutts}</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2 text-left text-muted-foreground">≤4ft</td>
                {holes.map((h, i) => <td key={i} className="py-1.5 px-1">{h.puttsInside4ft}</td>)}
                <td className="py-1.5 px-2 font-medium">{holes.reduce((sum, h) => sum + h.puttsInside4ft, 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {saveError && (
        <p className="text-sm text-red-500 text-center">{saveError}</p>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-3.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Round'}
        </button>
        <button
          onClick={() => { clearDraft(); router.push('/play') }}
          className="flex-1 py-3.5 bg-muted text-foreground rounded-xl font-medium text-sm hover:bg-muted/80 transition-colors"
        >
          Discard
        </button>
      </div>
    </div>
  )
}

const STORAGE_KEY = 'golf-round-in-progress'

function loadDraft(): { step: number; holes: HoleEntry[] } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveDraft(step: number, holes: HoleEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, holes }))
}

function clearDraft() {
  localStorage.removeItem(STORAGE_KEY)
}

export default function RoundPage() {
  const [step, setStep] = useState(0)
  const [editingFrom, setEditingFrom] = useState<'wizard' | 'summary'>('wizard')
  const [holes, setHoles] = useState<HoleEntry[]>(() => Array.from({ length: HOLES }, defaultHole))
  const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  // Restore draft on mount
  useEffect(() => {
    const draft = loadDraft()
    if (draft) {
      setStep(draft.step)
      setHoles(draft.holes)
    }
  }, [])

  // Persist draft on every change
  useEffect(() => {
    saveDraft(step, holes)
  }, [step, holes])

  function updateHole(index: number, entry: HoleEntry) {
    setHoles(prev => prev.map((h, i) => (i === index ? entry : h)))
  }

  function handleEdit(i: number) {
    setEditingFrom('summary')
    setStep(i)
  }

  function handleNext() {
    if (editingFrom === 'summary') {
      setEditingFrom('wizard')
      setStep(HOLES)
    } else {
      setStep(s => s + 1)
    }
  }

  function handleBack() {
    if (editingFrom === 'summary') {
      setEditingFrom('wizard')
      setStep(HOLES)
    } else {
      setStep(s => s - 1)
    }
  }

  if (step === HOLES) {
    return (
      <main className="min-h-screen pb-24 pt-6 px-4 max-w-lg mx-auto">
        <Summary holes={holes} date={today} onEdit={handleEdit} />
      </main>
    )
  }

  return (
    <main className="min-h-screen pb-24 pt-6 px-4 max-w-lg mx-auto">
      <HoleForm
        holeIndex={step}
        entry={holes[step]}
        onChange={entry => updateHole(step, entry)}
        onNext={handleNext}
        onBack={editingFrom === 'summary' ? handleBack : step > 0 ? handleBack : null}
        isLast={editingFrom === 'summary' || step === HOLES - 1}
      />
    </main>
  )
}
