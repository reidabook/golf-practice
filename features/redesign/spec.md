# Redesign — "Range Card"

> **Status:** built on branch `redesign/range-card` (2026-11-09). Feature behaviour now lives in `features/today.md`, `library.md`, `progress.md`, `drills.md`, `tempo.md`, `shared.md`; this file keeps the design rationale.
>
> **For Claude:** Parent spec for the UX/visual redesign. Each sub-issue implements one slice and updates the affected `features/*.md` in the same commit. Decisions below were settled with Reid on 2026-11-09 — don't reopen them without asking.

---

## Who / where / job

- **User:** one golfer (Reid), phone in hand on the range or practice green, often in direct sun, between reps, sometimes wearing a glove.
- **The app's one job:** log this rep's score in a few taps and show whether it's getting better.
- Everything else (templates, guides, history) is secondary and moves out of the main path.

---

## Settled decisions

| # | Decision |
|---|---|
| 1 | Bottom nav cut from 6 tabs to 4: **Today · Progress · Library · Tempo** |
| 2 | Today shows the active block's drills directly — no "Open Training" hop. Template list appears on Today only when no block is active |
| 3 | **One active block at a time** (enforced in code, no sheet change). Starting a block while one is active asks "End *[current]* early and start *[new]*?" |
| 4 | Full-screen comparison overlay removed. Result shows inline on the scorer with **Next drill →** |
| 5 | Mark Complete / End Early / Delete move to a **⋯** menu in the block header. Skip becomes a text link |
| 6 | Light-first "Range Card" visual direction (tokens below). Dark follows system setting only — no in-app toggle |
| 7 | Signature element: **scorecard strip** (below) |
| 8 | Plan content stays hardcoded (`components/plan/plan-page-client.tsx` data). Moving it to Sheets is a separate future issue |
| 9 | Play Mode out of scope — inherits tokens only |
| 10 | Tempo: restyle only, no behaviour change |
| 11 | Motion budget: two moments only — scorecard mark draws on save, score number ticks on +/−. `prefers-reduced-motion` disables both |

### Routes

| Old | New |
|---|---|
| `/` | `/` — Today |
| `/history` | redirect → `/progress#blocks` |
| `/history/[blockId]` | unchanged (reached from Progress → Past blocks) |
| `/progress` | `/progress` — handicap, drills, past blocks |
| `/drills` | redirect → `/library` |
| `/plan` | redirect → `/library?tab=guides` |
| — | `/library` — Drills · Blocks · Guides |
| `/tempo` | unchanged |
| `/blocks/[blockId]/drills` | redirect → `/` (Today is the drill list) |
| `/blocks/[blockId]/drills/[drillId]` | unchanged — scorer |

Bump `CACHE_NAME` in `public/sw.js`. `DrillRouteWatcher` must still restore the scorer; restoring the old drill-list route should land on `/`.

---

## Design tokens

### Colour

| Token | Light | Dark | Use |
|---|---|---|---|
| `chalk` (background) | `#F5F7F3` | `#0B1611` | Page |
| `card` | `#FFFFFF` | `#12211A` | Rows, sheets |
| `ink` (foreground) | `#0E1F17` | `#EAF0EB` | Text |
| `rough` (muted) | `#5E6F65` | `#8FA197` | Secondary text, rules |
| `fairway` (primary) | `#1E6A44` | `#3FA172` | Primary buttons, active tab, better |
| `flag` (accent) | `#F4C430` | `#F4C430` | Current/next drill marker, focus ring, PB star. Never body text on chalk |
| `stripe` (destructive / worse) | `#D23A2F` | `#E5584D` | Declines, delete |

Light is the default (`<html>` loses `className="dark"`); dark applies under `@media (prefers-color-scheme: dark)`. Map into existing shadcn CSS vars in `app/globals.css` so components keep working. `themeColor` in `app/layout.tsx` uses both schemes. Body text contrast ≥ 7:1 in light (sunlight).

### Type

| Role | Face | Notes |
|---|---|---|
| Numerals & display | **Archivo** (variable, `wdth` 62–125) | Scores, handicap, tempo presets at `wdth 125`, weight 800, tabular. Section labels at `wdth 75`, weight 600, uppercase, +0.06em tracking — tee-sign lettering |
| Body | **Atkinson Hyperlegible** | Built for legibility; all body copy, buttons, instructions |

Load both via `next/font/google`. Remove Inter.

Scale (px): 12 label · 15 body · 17 row title · 22 screen title · 40 stat · 96 live score.

### Shape & space

- Radius 10px cards, 999px for score +/− buttons, 4px scorecard boxes.
- Rows are flat cards separated by 8px; no nested cards (Card-in-Card on current Home and Plan goes away).
- Min tap target 48px; primary actions in bottom 40% of screen.
- Icons: lucide, 1.75 stroke.
- Empty states: no emoji. One sentence saying what to do + a button that does it.

---

## Signature: scorecard strip

Component `components/ui/scorecard-strip.tsx`. A row of small square boxes, one per session in the block (or last N scores in Progress), each holding the score.

```
3-Foot Putts                      misses ↓
[15][(12)][ 12 ][[14]][(9)][   ][   ][   ]
       ○ better   □ worse   plain = same/first
```

- **Circle** around the number = better than the previous score (direction-aware: lower-is-better drills circle a lower number). Golf convention: circle = birdie.
- **Square** = worse (bogey). Plain = same or first.
- Empty boxes = sessions still to do; the next one has a `flag` underline on Today.
- Personal best gets a small `flag` star corner.
- On save, the new mark draws in (stroke-dashoffset, 300ms); none under reduced motion.
- Accessible: each box has `aria-label` like "Session 2: 12 misses, better".
- Props: `scores: (number|null)[]`, `total: number`, `direction`, `highlightNext?`, `size: 'sm'|'md'`.

Needs per-drill ordered score list for the block — extend `getBlockDrills()` result with `scores: number[]` (in-memory from existing `drill-logs` rows; no sheet change).

---

## Screens

### Today (`/`)

```
┌──────────────────────────────┐
│ MON 9 NOV                    │  label
│ Shake Off the Rust        ⋯  │  block name (template name) + admin menu
│ Session 5 of 8 · 3 left today│
├──────────────────────────────┤
│ ▸ 3-Foot Putts      misses ↓ │  next unscored drill: flag bar on left
│   [15][(12)][12][□14][ ][ ]… │
├──────────────────────────────┤
│   Drawback Drill   over par ↓│
│   [..strip..]                │
├──────────────────────────────┤
│ DONE TODAY                   │
│   5-to-5 Drill ✓ 18          │  muted, today's score shown
├──────────────────────────────┤
│ HOME ROUTINE · 10 min   1/3  │  from Plan; collapsible checklist
└──────────────────────────────┘
[ Start: 3-Foot Putts → ]          sticky primary above nav
```

- Header ⋯ menu: Mark complete · End early · Delete block (confirmations unchanged).
- Primary button opens the next unscored drill. When all done today: "All drills done today" + secondary "Score another".
- No active block: heading "No block running", template rows with **Start** each, link to Library → Blocks.
- Home routine checklist keeps current behaviour (per-day localStorage) from Plan.

### Scorer (`/blocks/[blockId]/drills/[drillId]`)

```
← Today                    2 of 7
3-Foot Putts
[15][(12)][12][□14][ ][ ][ ][ ]
How to play ▾   (numbered steps)

            − [ 96px 12 ] +
              misses · last 14

[        Save score         ]
           Skip drill
```

After save, same screen swaps the input for the result:

```
            (12)  ← circled, drawn in
       Better than last (14)
       Best: 9 ★
[      Next: Drawback Drill →     ]
           Back to Today
```

- Block completion screen still appears after save when the block completes (unchanged logic, restyled).
- Draft restore, numpad, bounds, haptics unchanged.
- Instructions: lines starting with `- ` become numbered steps; other text is a paragraph. Collapsed by default, open on a drill's first session.
- Action buttons sit above the bottom nav (fixes current overlap).

### Progress (`/progress`)

```
HANDICAP INDEX
19.4            ↓ 0.8 since Apr
[ line chart ]
DRILLS
3-Foot Putts      12  [last 8 strip]  ›   tap → expands chart + trend
...
PAST BLOCKS                        (#blocks)
Shake Off the Rust   Done  Apr 21 → Jun 2  ›
```

- GHIN sync banner, chart behaviour, trend line rules unchanged.
- Expanded drill row shows the existing chart restyled (fairway line, rough grid, trend in fairway/stripe).
- Past blocks = old History list; block detail page restyled with scorecard strips per drill.

### Library (`/library`)

Segmented control **Drills · Blocks · Guides**, `?tab=` in URL.

- **Drills:** current drill library (edit, delete, inline log score, new). Row shows unit + direction.
- **Blocks:** current templates (edit, delete, new) + **Start** button per template (Q13 confirm when one is active).
- **Guides:** from Plan — Current focus list, Range session guide, Pre-round warmup, Drill reference. Same content, restyled; collapsibles keep working.

### Tempo (`/tempo`)

Restyle only: segmented controls, preset chips, dial ring (track `rough`, fill `fairway`, impact glow `flag`), golfer tinted `ink`. Preset numerals in Archivo expanded.

### Bottom nav

4 tabs, icons + labels: Today (`Flag`), Progress (`TrendingUp`), Library (`BookOpen`), Tempo (`Timer`). Active = `fairway` with 2px top bar. Keep full `prefetch` on every tab.

---

## Docs to update as slices land

- `FEATURES.md` index: replace History/Drills/Plan rows with Today/Library; remove `features/history.md` (merged into `progress.md`); add `features/library.md`; rename `home.md` → `today.md`.
- `features/shared.md`: navigation (4 tabs), single active block rule, UI patterns (tokens, scorecard strip, no overlay).
- `ARCHITECTURE.md`: routes table, redirects.
- `features/tempo.md`: colours.

## Out of scope

- Play Mode beyond tokens
- Moving Plan content to Sheets
- Any Google Sheet column/tab change
