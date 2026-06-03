'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ChevronDown, ChevronRight, CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Data ────────────────────────────────────────────────────────────────────

const FOCUS_AREAS = [
  { rank: 1, area: 'Left shoulder turn on backswing', note: 'Flagged every session Feb–Nov — still needs a bit more' },
  { rank: 2, area: 'Grip', note: 'Finger placement, pressure, both hands staying on' },
  { rank: 3, area: 'Takeaway path', note: 'Across chest, thumbs up, not laid off' },
  { rank: 4, area: 'Arms + body connection', note: 'Moving as one unit, not independently' },
  { rank: 5, area: 'Release through impact', note: "Don't hang on" },
  { rank: 6, area: 'Pelvis drives the downswing', note: 'Improving — "nice bounce" noted in July' },
  { rank: 7, area: 'Driver ball position', note: 'Inside left heel — corrected November' },
  { rank: 8, area: 'Club face control', note: 'Square through the ball, most recent focus' },
]

const HOME_ITEMS = [
  { id: 'grip', label: 'Grip routine', duration: '2 min', detail: 'Set left hand (2 knuckles, V to right shoulder), right hand from the side relaxed. Waggle, hinge, figure eights — pressure 3–4/10 throughout. Reset 3×.' },
  { id: 'belly', label: 'Belly drill', duration: '3 min', detail: 'Stick butt of club in belly. Grip left arm down shaft until straight. Turn left shoulder to right big toe without head moving. Arms, club, and belly at the same rate. 8–10 slow reps.' },
  { id: 'shadow', label: 'Shadow swings + towel', duration: '5 min', detail: 'Tuck golf towel under both arms. 10 slow connected swings — arms staying against body throughout. Feels like a straight jacket. That\'s correct.' },
]

const RANGE_PHASES = [
  {
    label: 'Phase 1 — Warmup',
    balls: '~20 balls · short irons',
    items: [
      'Feet together drill — 40–50% speed, thumbs up checkpoint, rotation not sway',
      '9-to-3 with 1-2-3 tempo — left shoulder to right foot, hands in front, connected half swings',
    ],
  },
  {
    label: 'Phase 2 — Partial swings',
    balls: '~20 balls · short-to-mid irons',
    items: [
      '10-to-2 — one-piece takeaway, left shoulder turn',
      'Thumbs up checkpoint on the way back',
      'Release through impact — ball going right = hanging on',
    ],
  },
  {
    label: 'Phase 3 — Full swings',
    balls: '~20 balls · mid irons + driver',
    items: [
      'Integrate: grip → takeaway across chest → left shoulder → pelvis drives',
      'Fire around, not out to first base — finish tall on left foot',
      'Driver: ball inside left heel, not too long, hold on',
    ],
  },
]

const PREROUND_STEPS = [
  'Grip check',
  '5× feet together swings',
  '5× 9-to-3',
  '5× full swings at 70%',
  'Driver: confirm ball inside left heel before first tee shot',
]

const DRILLS = [
  {
    id: 'belly',
    name: 'Belly Drill',
    trains: 'Left shoulder turn, connected one-piece takeaway',
    homeOnly: false,
    steps: [
      'Stick butt of club into your belly.',
      'Grip the club with your left hand — slide your hand down the shaft until your arm is straight (uncomfortably so).',
      'Turn your left shoulder to your right big toe without your head moving too much.',
      'Move your arm, the club, and your belly at the same rate — not the arms leading.',
      '5–10 slow reps.',
    ],
    checkpoint: 'Head stays still throughout. If it moves, slow down.',
  },
  {
    id: '9-3',
    name: '9-to-3 / 10-to-2 / 11-to-1',
    trains: 'Connected partial swings, left shoulder turn, release',
    homeOnly: false,
    steps: [
      '9-to-3: Club to hip height on backswing, hip height on follow-through. Turn back = left shoulder to inside of right foot. Full torso turn — hands stay in front of your body.',
      '10-to-2: Same principles, slightly longer. One-piece takeaway. Just a little wrist hinge.',
      '11-to-1 (shoulder to shoulder): "You\'re making a big L at the top and a big L on the way down."',
    ],
    checkpoint: 'Use 1-2-3 tempo throughout. Count out loud if needed.',
  },
  {
    id: 'feet',
    name: 'Feet Together',
    trains: 'Rotation vs. lateral sway, balance, grip checkpoint',
    homeOnly: false,
    steps: [
      'Check your grip before starting.',
      'Stand with feet together (touching or very close).',
      'Swing at 40–50% speed only — not about distance.',
      'Thumbs up to the sky = correct hinge. Flat thumbs = wrong.',
      'Weight: right heel on backswing, left heel on follow-through — like turning around.',
    ],
    checkpoint: 'If you sway, you\'ll fall. The drill self-corrects.',
  },
  {
    id: 'towel',
    name: 'Towel Under Arms',
    trains: 'Arms and body moving as one unit — connection',
    homeOnly: false,
    steps: [
      'Tuck a golf towel under both arms, pressed against your chest.',
      'Swing. Max 70–80 yards — not a distance drill.',
      'If the towel falls, your arms separated. Start smaller.',
      'Start with chip-length swings, work up to half swings.',
      'Let the club swing — don\'t force it.',
    ],
    checkpoint: 'Feels like a straight jacket. That\'s correct.',
  },
  {
    id: 'wall',
    name: 'Wall Drill',
    trains: 'Takeaway path — prevents club getting too flat/laid off',
    homeOnly: true,
    steps: [
      'Place your right foot against a wall.',
      'Step left foot in front and take your normal stance — about one foot from the wall.',
      'At hip height on the backswing, the club should be parallel to the wall.',
      'Swing without hitting the wall. Club falls down, swings through, goes back up.',
      'If you hit the wall, takeaway got too flat — thumbs aren\'t going up enough.',
    ],
    checkpoint: 'The feel: more upright — hands and thumbs working up, not around.',
  },
  {
    id: '123',
    name: '1-2-3 Tempo',
    trains: 'Smooth tempo, prevents rushing the transition',
    homeOnly: false,
    steps: [
      'On your takeaway, say (or think): "one."',
      'At the top of your backswing, say: "two." Creates a deliberate pause.',
      'Through the downswing to finish, say: "three."',
    ],
    checkpoint: 'Count out loud if you need to. Pair with the towel drill if arms and body can\'t stay together.',
  },
  {
    id: 'pelvis',
    name: 'Pelvis Push',
    trains: 'Downswing sequencing — lower body initiates',
    homeOnly: false,
    steps: [
      'Go to the top of your backswing (simulate without a club if at home).',
      'Sequence: shift down → push pelvis up and through to the target.',
      'Left hip goes up and around. Right hip goes through to the target.',
      'Don\'t manually rotate the hips — the push creates the rotation.',
      'Finish tall on your left foot. Butt cheeks clenched.',
    ],
    checkpoint: 'Do it earlier, not harder. If right foot twists, you\'re over-rotating.',
  },
]

// ─── Component ───────────────────────────────────────────────────────────────

function todayKey() {
  return `plan-checklist-${new Date().toISOString().slice(0, 10)}`
}

export function PlanPageClient() {
  const [showAllFocus, setShowAllFocus] = useState(false)
  const [rangeOpen, setRangeOpen] = useState(true)
  const [preRoundOpen, setPreRoundOpen] = useState(false)
  const [expandedDrills, setExpandedDrills] = useState<Set<string>>(new Set())
  const [checked, setChecked] = useState<string[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(todayKey())
      setChecked(stored ? JSON.parse(stored) : [])
    } catch {
      setChecked([])
    }
  }, [])

  function toggleCheck(id: string) {
    setChecked(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      try { localStorage.setItem(todayKey(), JSON.stringify(next)) } catch {}
      return next
    })
  }

  function toggleDrill(id: string) {
    setExpandedDrills(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const visibleFocus = showAllFocus ? FOCUS_AREAS : FOCUS_AREAS.slice(0, 3)
  const checkedCount = HOME_ITEMS.filter(i => checked.includes(i.id)).length
  const progressPct = Math.round((checkedCount / HOME_ITEMS.length) * 100)

  return (
    <div className="p-4 space-y-6 pb-[calc(5rem+env(safe-area-inset-bottom,0px))]">
      <h1 className="text-2xl font-bold">Training Plan</h1>

      {/* Current Focus */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Current Focus</CardTitle>
          <CardDescription>Ranked by persistence across sessions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {visibleFocus.map(({ rank, area, note }) => (
            <div key={rank} className="flex gap-3">
              <span className="text-muted-foreground text-sm font-mono w-4 shrink-0 mt-0.5">{rank}</span>
              <div>
                <p className="text-sm font-medium leading-snug">{area}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{note}</p>
              </div>
            </div>
          ))}
          <button
            onClick={() => setShowAllFocus(v => !v)}
            className="text-sm text-primary font-medium w-full text-right pt-1"
          >
            {showAllFocus ? 'Hide ▲' : `See all ${FOCUS_AREAS.length} ›`}
          </button>
        </CardContent>
      </Card>

      {/* Daily home routine checklist */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Today&apos;s Home Routine</CardTitle>
          <CardDescription>~10 min · no ball needed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {HOME_ITEMS.map(item => {
              const done = checked.includes(item.id)
              return (
                <button
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className="w-full flex items-start gap-3 text-left"
                >
                  {done
                    ? <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    : <Circle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  }
                  <div className="flex-1">
                    <p className={cn('text-sm font-medium', done && 'line-through text-muted-foreground')}>
                      {item.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 mt-0.5">{item.duration}</span>
                </button>
              )
            })}
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{checkedCount} of {HOME_ITEMS.length} done today</span>
              {checkedCount === HOME_ITEMS.length && <span className="text-primary font-medium">All done ✓</span>}
            </div>
            <Progress value={progressPct} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Range Session Guide */}
      <Card>
        <button
          className="w-full text-left"
          onClick={() => setRangeOpen(v => !v)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Range Session Guide</CardTitle>
              {rangeOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </div>
            <CardDescription>1–2× per week · ~60 balls total</CardDescription>
          </CardHeader>
        </button>
        {rangeOpen && (
          <CardContent className="space-y-5 pt-0">
            {RANGE_PHASES.map(phase => (
              <div key={phase.label} className="space-y-1.5">
                <div>
                  <p className="text-sm font-semibold">{phase.label}</p>
                  <p className="text-xs text-muted-foreground">{phase.balls}</p>
                </div>
                <ul className="space-y-1">
                  {phase.items.map(item => (
                    <li key={item} className="text-sm flex gap-2">
                      <span className="text-muted-foreground shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Pre-Round Warmup */}
      <Card>
        <button
          className="w-full text-left"
          onClick={() => setPreRoundOpen(v => !v)}
        >
          <CardHeader className={cn('pb-3', preRoundOpen && 'pb-3')}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Pre-Round Warmup</CardTitle>
              {preRoundOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </div>
            <CardDescription>10 minutes</CardDescription>
          </CardHeader>
        </button>
        {preRoundOpen && (
          <CardContent className="pt-0 space-y-2">
            {PREROUND_STEPS.map((step, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <span className="text-muted-foreground font-mono shrink-0">{i + 1}.</span>
                <span>{step}</span>
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {/* Drill Reference */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Drill Reference</h2>
        {DRILLS.map(drill => {
          const open = expandedDrills.has(drill.id)
          return (
            <Card key={drill.id}>
              <button
                className="w-full text-left"
                onClick={() => toggleDrill(drill.id)}
              >
                <CardHeader className={cn('pb-3', !open && 'pb-4')}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <CardTitle className="text-sm">{drill.name}</CardTitle>
                      {drill.homeOnly && <Badge variant="secondary" className="text-xs shrink-0">Home only</Badge>}
                    </div>
                    {open ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                  </div>
                  {!open && <CardDescription className="text-xs">{drill.trains}</CardDescription>}
                </CardHeader>
              </button>
              {open && (
                <CardContent className="pt-0 space-y-4">
                  <p className="text-xs text-muted-foreground">{drill.trains}</p>
                  <ol className="space-y-2">
                    {drill.steps.map((step, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <span className="text-muted-foreground font-mono shrink-0 mt-0.5">{i + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                  <div className="rounded-md bg-muted px-3 py-2">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Checkpoint: </span>
                      {drill.checkpoint}
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </section>
    </div>
  )
}
