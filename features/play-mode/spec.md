# Play Mode — Feature Spec

Tracks per-hole stats during an actual round using The Scoring Method by Will Robins. Produces a post-round summary that maps weaknesses to focus areas.

---

## Course (Phase 1 — hardcoded)

**Charlie Yates Golf Course** — 9 holes, par 30

| Hole | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|------|---|---|---|---|---|---|---|---|---|
| Par  | 3 | 3 | 4 | 3 | 3 | 4 | 3 | 3 | 4 |
| SZ shots | 1 | 1 | 2 | 1 | 1 | 2 | 1 | 1 | 2 |

Scoring Zone = 100 yards. Shots to Enter Scoring Zone in Regulation = par − 2.

---

## Scoring Method Concepts

| Symbol | Meaning |
|--------|---------|
| ✓ | Successful completion |
| ✗ | Unsuccessful completion |
| O | Lost ball or penalty |
| + | Putt made from outside 4ft |

**Per-hole rows (from scorecard):**
1. **ESZ** — Enter Scoring Zone in regulation? (✓ / ✗ / O)
2. **SZ** — Got down from scoring zone in ≤3 shots? (✓ / ✗)
3. **Short putt** — Putts inside 4ft: made (✓), missed (✗), bonus from >4ft (+), or N/A
4. **Total Putts** — number
5. **Score** — total strokes

---

## Per-Hole Data Model

```ts
type ESZ = 'in' | 'miss' | 'penalty'   // ✓ / ✗ / O
type ShortPutt = 'made' | 'missed' | 'bonus' | null

interface HoleEntry {
  hole: number           // 1–9
  par: number            // from course config
  score: number
  totalPutts: number
  esz: ESZ
  szDown: boolean | null // null when ESZ !== 'in'
  shortPutt: ShortPutt
  penalty: boolean
}
```

---

## Summary Calculations

### Successes
| Box | Label | Formula |
|-----|-------|---------|
| 1 | Gave myself a chance | `count(esz === 'in')` |
| 2 | Scored in position | `count(esz === 'in' && szDown === true)` |
| 3 | Strokes gained putting | `count(shortPutt === 'bonus')` |
| 4 | One putts | `count(totalPutts === 1)` |

### Feedback
| Box | Label | Formula |
|-----|-------|---------|
| A | Out of position | `holes − Box1` |
| B | In position, didn't score | `Box1 − Box2` |
| C | Missed short putts | `count(shortPutt === 'missed')` |
| D | Three-putts | `count(totalPutts >= 3)` |

---

## Focus Recommendations (The 10 Keys)

Map metric thresholds to actionable keys:

| Condition | Focus Area | Key |
|-----------|-----------|-----|
| B >= 3 | Short game: convert more scoring zone opportunities | #5, #6 |
| C >= 2 | Short putts: make them all inside 4ft | #1 |
| D >= 2 | Pace of putting: long putts need good pace, not great reads | #4 |
| penalty >= 1 | Penalty strokes: play away, avoid trouble at all cost | #2, #3 |
| B >= (Box1 * 0.5) | Short game priority (missed >50% of scoring zone chances) | |

Show top 2–3 focus areas ordered by severity.

---

## UI Flow

### Route: `/play`
Start page. Static server component. Links to `/play/round`.

```
┌─────────────────────────────────┐
│           PLAY MODE             │
│                                 │
│  Charlie Yates Golf Course      │
│  9 holes · Par 30               │
│  Scoring Zone: 100 yards        │
│                                 │
│  ┌─────────────────────────┐    │
│  │       Start Round       │    │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

---

### Route: `/play/round`
Full `'use client'` component. Step 0–8 = holes, step 9 = summary.

#### Hole Entry (steps 0–8)

```
┌─────────────────────────────────┐
│  Hole 3 / 9              PAR 4  │
│  ██████████░░░░░░░░░░░  33%    │
├─────────────────────────────────┤
│  SCORE               PUTTS      │
│  [ − ]   5   [ + ]  [ − ] 2 [+]│
│                                 │
│  SCORING ZONE (100 yds)?        │
│  ┌─────────────┐ ┌────────────┐ │
│  │  ✓  IN REG  │ │  ✗  MISS   │ │
│  └─────────────┘ └────────────┘ │
│  (or: ○ Penalty — toggle below) │
│                                 │
│  GOT DOWN (≤3 shots)?           │  ← only shown if ESZ = 'in'
│  ┌─────────────┐ ┌────────────┐ │
│  │   ✓  YES    │ │   ✗  NO    │ │
│  └─────────────┘ └────────────┘ │
│                                 │
│  SHORT PUTT (<4ft)?             │
│  ┌──────┐  ┌──────┐  ┌──────┐  │
│  │✓ Made│  │✗ Miss│  │  N/A │  │
│  └──────┘  └──────┘  └──────┘  │
│                                 │
│  ○ Penalty / Lost Ball  [ ]     │
│                                 │
│  ┌─────────────────────────────┐ │
│  │        Next Hole  →         │ │
│  └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Validation:** score and putts must be > 0; ESZ must be selected before advancing.

---

#### Summary (step 9)

```
┌─────────────────────────────────┐
│  Charlie Yates  ·  Jun 9        │
│  SCORE: 44      +14 vs par      │
├─────────────────────────────────┤
│  SUCCESSES                      │
│  1  Gave myself a chance     8  │
│  2  Scored in position       3  │
│  3  Strokes gained putting   1  │
│  4  One putts                2  │
│                                 │
│  FEEDBACK                       │
│  A  Out of position          1  │
│  B  In position, no score    5  │
│  C  Missed short putts       1  │
│  D  Three-putts              2  │
├─────────────────────────────────┤
│  FOCUS AREAS                    │
│  ▸ Short game — only 3 of 8     │
│    scoring zone conversions     │
│  ▸ Pace of putting — 2 three-   │
│    putts this round             │
│                                 │
│  [ Start New Round ]            │
└─────────────────────────────────┘
```

---

## Navigation

Play tab added to bottom nav (flag icon, href `/play`).

---

## Phase 2 Roadmap

After prototype review:

### Google Sheets Persistence
New sheet tabs:

**`rounds`**
| Column | Type | Notes |
|--------|------|-------|
| `id` | string | UUID |
| `course` | string | e.g. "charlie-yates" |
| `date` | string | YYYY-MM-DD |
| `total_score` | number | |
| `holes_played` | number | |
| `created_at` | string | |

**`round-holes`**
| Column | Type | Notes |
|--------|------|-------|
| `id` | string | UUID |
| `round_id` | string | FK → rounds |
| `hole_number` | number | |
| `par` | number | |
| `score` | number | |
| `total_putts` | number | |
| `esz` | string | `in` / `miss` / `penalty` |
| `sz_down` | string | `true` / `false` / `` |
| `short_putt` | string | `made` / `missed` / `bonus` / `` |
| `penalty` | string | `true` / `false` |

### Additional Routes (Phase 2)
- `/play` — lists past rounds + Start Round CTA
- `/play/[roundId]` — full scorecard + summary for a past round
- Resume in-progress round (save to Sheets hole-by-hole)

### Multi-Course Support (Phase 3)
Course definitions in a `lib/courses.ts` config file. Course selector on the start page.
