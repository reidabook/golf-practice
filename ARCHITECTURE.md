# Golf Practice App — Architecture & Dependency Map

Use this file to answer "what do I need to touch if X changes?" before starting any feature or refactor.

---

## Routes

| Path | Component | Notes |
|---|---|---|
| `/` | `Home.jsx` | Active block, start/resume session, template picker |
| `/history` | `History.jsx` | All blocks list |
| `/history/:blockId` | `BlockDetail.jsx` | Block summary + session list |
| `/history/:blockId/sessions/:sessionId` | `SessionView.jsx` | Read-only completed session view with inline edit |
| `/sessions/:sessionId` | `SessionOverview.jsx` | Pre/mid-session drill list, reorder, begin/finish |
| `/sessions/:sessionId/drill/:drillId` | `DrillEntry.jsx` | Full-screen drill scoring (no Layout wrapper) |
| `/progress` | `Progress.jsx` | Recharts line chart per drill |
| `/drills` | `Drills.jsx` | Drill + template CRUD |

---

## Database Tables → Files That Touch Them

### `drills`
Columns: `id, name, unit, scoring_direction, category, description, source`

| Operation | File |
|---|---|
| Read all | `db.js → getDrills()` ← `Drills.jsx` |
| Read one | `db.js → getDrill(id)` ← `Drills.jsx` |
| Create / Update / Delete | `db.js → createDrill / updateDrill / deleteDrill` ← `Drills.jsx` |
| Read via join | `session_drills` joins → `SessionOverview`, `SessionView`, `DrillEntry`, `Progress` |

**If you add a column to `drills`:** update `Drills.jsx` (form), and any display that reads `d.drills.*` in `SessionOverview`, `SessionView`, `DrillEntry`.

---

### `block_templates` + `block_template_drills`
Columns: `id, name, description, session_count` / `template_id, drill_id, sort_order`

| Operation | File |
|---|---|
| Read all | `db.js → getTemplates()` ← `Home.jsx` |
| Read one | `db.js → getTemplate(id)` ← `db.js` internal (startBlock, startNextSession, getOutstandingDrills, getBlockDrillProgress) |
| Create / Update / Delete | `db.js → createTemplate / updateTemplate / deleteTemplate` ← `Drills.jsx` |

**If you change template structure:** `getTemplate()` in `db.js` is the single read path — update it and all callers listed above cascade automatically.

---

### `training_blocks`
Columns: `id, template_id, name, session_count, status, started_at, completed_at`

| Operation | File |
|---|---|
| Read active | `db.js → getActiveBlock()` ← `Home.jsx` |
| Read all | `db.js → getBlocks()` ← `History.jsx` |
| Read one | `db.js → getBlock(id)` ← `BlockDetail.jsx` |
| Create | `db.js → startBlock()` ← `Home.jsx` |
| Complete | `db.js → completeBlock()` ← `Home.jsx` |

**If you add a block-level field (e.g., goal score):** add to `getBlock`, `getBlocks`, `getActiveBlock` selects; display in `BlockDetail`, `History`, `Home`.

---

### `sessions`
Columns: `id, block_id, session_number, status, session_date, notes`

| Operation | File |
|---|---|
| Read with drills | `db.js → getSessionWithDrills(id)` ← `SessionOverview.jsx`, `Home.jsx (LastScores)` |
| Create | `db.js → startNextSession()` ← `Home.jsx`, `db.js (startBlock)` |
| Complete | `db.js → completeSession()` ← `DrillEntry.jsx`, `SessionOverview.jsx` |
| Delete | `db.js → deleteSession()` ← `SessionOverview.jsx` |

---

### `session_drills`
Columns: `id, session_id, drill_id, score, skipped, sort_order`

| Operation | File |
|---|---|
| Save score | `db.js → saveScore()` ← `DrillEntry.jsx`, `SessionView.jsx` |
| Skip drill | `db.js → skipDrill()` ← `DrillEntry.jsx`, `SessionOverview.jsx`, `SessionView.jsx` |
| Remove (pre-session) | `db.js → removeSessionDrill()` ← `SessionOverview.jsx` |
| Reorder | `db.js → reorderDrills()` ← `SessionOverview.jsx` |
| Read for progress | `db.js → getBlockDrillProgress()` ← `Home.jsx`, `History.jsx`, `BlockDetail.jsx` |
| Read for chart | `db.js → getProgressForAllDrills()` ← `Progress.jsx` |
| Read outstanding | `db.js → getOutstandingDrills()` ← `DrillEntry.jsx`, `db.js (startNextSession)` |
| Read for summary | `db.js → getBlockCompletionSummary()` ← `BlockDetail.jsx` |

**`skipped` column touches:** `saveScore`, `skipDrill`, `getOutstandingDrills`, `getBlockDrillProgress`, `getProgressForAllDrills`, `SessionOverview` (handleFinishEarly filter), `SessionView` (display).

**If you add a column to `session_drills`:** update relevant `db.js` selects and any component that reads `d.*` directly.

---

## DB Functions → Page Consumers

| `db.js` function | Used by |
|---|---|
| `getDrills` | `Drills.jsx` |
| `getDrill` | `Drills.jsx` |
| `createDrill` / `updateDrill` / `deleteDrill` | `Drills.jsx` |
| `getTemplates` | `Home.jsx` |
| `getTemplate` | Internal (`startBlock`, `startNextSession`, `getOutstandingDrills`, `getBlockDrillProgress`) |
| `createTemplate` / `updateTemplate` / `deleteTemplate` | `Drills.jsx` |
| `getActiveBlock` | `Home.jsx` |
| `getBlocks` | `History.jsx` |
| `getBlock` | `BlockDetail.jsx` |
| `startBlock` | `Home.jsx` |
| `completeBlock` | `Home.jsx` |
| `getSessionWithDrills` | `SessionOverview.jsx`, `Home.jsx` (LastScores) |
| `startNextSession` | `Home.jsx`, `db.js` (startBlock) |
| `completeSession` | `DrillEntry.jsx`, `SessionOverview.jsx` |
| `deleteSession` | `SessionOverview.jsx` |
| `reorderDrills` | `SessionOverview.jsx` |
| `saveScore` | `DrillEntry.jsx`, `SessionView.jsx` |
| `skipDrill` | `DrillEntry.jsx`, `SessionOverview.jsx`, `SessionView.jsx` |
| `removeSessionDrill` | `SessionOverview.jsx` |
| `getOutstandingDrills` | `DrillEntry.jsx`, `db.js` (startNextSession) |
| `getBlockDrillProgress` | `Home.jsx`, `History.jsx`, `BlockDetail.jsx` |
| `getProgressForAllDrills` | `Progress.jsx` |
| `getBlockCompletionSummary` | `BlockDetail.jsx` |

---

## Feature Concepts → Files

### "Drill progress counter" (drillsDone / totalDrills)
Displayed identically on three pages. All three call `getBlockDrillProgress` independently.
- **Source of truth:** `db.js → getBlockDrillProgress()`
- **Displays:** `Home.jsx` (active block card + progress bar), `History.jsx` (block list subtitle), `BlockDetail.jsx` (block subtitle)
- **To change the formula or display:** update `getBlockDrillProgress` in `db.js` + the display string in all three pages.

### "Block completion flow"
A block ends when all template drills have at least one scored entry.
- **Trigger A:** Last drill in last session → `DrillEntry.jsx → getOutstandingDrills` → if 0, navigate to `/history/:blockId`
- **Trigger B:** Manual → `Home.jsx → completeBlock()` → navigate to `/history/:blockId`
- **Result displayed:** `BlockDetail.jsx` (Block Summary section, completion summary)

### "Session execution flow"
`Home` → `SessionOverview` → `DrillEntry` (×N drills) → back to `Home`
- Navigation is URL-driven: `pos` and `total` query params passed to `DrillEntry`
- `DrillEntry` owns the "advance to next drill or complete session" logic
- `SessionOverview` owns pre-session setup (reorder, remove drills) and early finish

### "Skipped drills"
`skipped = true` on a `session_drills` row means the drill was not scored.
- Set by: `skipDrill()` (per-drill in DrillEntry/SessionView) or `handleFinishEarly` (bulk in SessionOverview)
- Excluded from: progress counts (`getBlockDrillProgress`), chart data (`getProgressForAllDrills`), outstanding check (`getOutstandingDrills`)
- Displayed as: "skipped" label in `SessionView`, gap in `Progress` chart

### "Scoring direction"
Each drill has `scoring_direction: 'higher_better' | 'lower_better'`.
- Read by: `BlockDetail.jsx` (summary diff color), `Progress.jsx` (trend color), `SessionOverview.jsx` (icon)
- **To add a new direction:** update all three display sites.

---

## Shared Components

| Component | Used by |
|---|---|
| `Layout.jsx` | All pages except `DrillEntry` |
| `BottomNav.jsx` | `Layout.jsx` |
| `ScoreInput.jsx` | `DrillEntry.jsx` |
| `Numpad.jsx` | `ScoreInput.jsx` |
| `DrillInstructions.jsx` | `DrillEntry.jsx` |
| `CategoryBadge` (from `lib/categories.jsx`) | `SessionOverview.jsx`, `Drills.jsx` |

---

## Supabase / Infrastructure

- Client: `src/lib/supabase.js` — single instance, imported only by `src/lib/db.js`
- All DB access goes through `src/lib/db.js` — no page imports supabase directly
- Categories: `src/lib/categories.jsx` — pure client-side constant, no DB column

### Applied migrations (in order)
1. Initial schema — tables: `drills`, `block_templates`, `block_template_drills`, `training_blocks`, `sessions`, `session_drills`
2. `ALTER TABLE session_drills ADD COLUMN skipped BOOLEAN NOT NULL DEFAULT FALSE;`
3. `ALTER TABLE drills ADD COLUMN source TEXT;` (drill source/origin field)

---

## Pending / Known gaps

- No auth — single user assumed; all rows visible to all
- `session_date` is set manually (not auto-populated on session start)
- Progress chart X-axis uses `session_date`; sessions without a date fall back to `#N`
- Template edits do not retroactively affect active blocks (by design)
