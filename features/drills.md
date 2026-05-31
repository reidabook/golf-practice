# Drills Tab (`/drills`)

> **For Claude:** Read this file before making any changes to the Drills screen. Every feature listed here must still work after your edits.

---

## Block Templates Section

- List of templates: name, description, target sessions, Default badge
- Edit (pencil icon) and Delete (with confirmation dialog) per template
- "+ New" button opens template form
- Empty state when no templates

### Template Form (modal)
- Fields: name (required), description, number of sessions (1–52, required)
- Drill selector: available drills list + selected drills list
- Selected drills are drag-to-reorderable (grip icon)
- Toggle to add/remove drills between lists
- Save / close (X)
- Toast notification on create, update, or delete

## Drill Library Section

- List of drills: name, unit, scoring direction badge (↑/↓), Default badge
- Three actions per drill:
  - **Log Score** — expands inline log form below the drill row
  - **Edit** — opens drill form modal
  - **Delete** — confirmation dialog; blocked with error toast if drill has recorded scores
- Empty state when no drills
- "+ New" button opens drill form

### Inline Log Score Form
- Expands below the selected drill row
- Fields: score (number, required), date (date picker, defaults to today), notes (optional)
- Save Log / close (X)

### Drill Form (modal)
- Fields:
  - Name (required)
  - Description (required)
  - Instructions (multi-line, required)
  - Scoring direction toggle: "↑ Higher is better" / "↓ Lower is better"
  - Minimum score (number, default 0)
  - Maximum score (number, optional — null if left empty)
  - Unit (required — e.g., "strokes", "feet")
- Save / close (X)
- Toast on create or update
- Error toast: "Drills with recorded scores cannot be deleted"

---

## Drill Scoring Wizard (`/blocks/[blockId]/drills`)

- Block name header
- Two sections: "Up Next" (not yet scored today) and "Done Today"
- Per-drill row: name, unit, last score, session progress (`X/Y sessions`), and badges:
  - If drill has reached target_sessions: green ✓ Complete badge (row slightly muted)
  - Otherwise: scoring direction badge + "Today" badge if done_today
- Drills that reached target_sessions are still tappable — extra completions don't count toward block target
- Bottom action bar: **Mark Complete**, **End Early** (with confirmation), **Delete** (with confirmation)
  - **End Early** sets status to `ended_early`, removes block from active list, keeps drill logs

## Single Drill Scorer (`/blocks/[blockId]/drills/[drillId]`)

### Layout
- Back button to drill list
- Block name (small) above drill name (large)
- Description and instructions displayed if defined on the drill
- Last score reference for this drill in this block (if exists)

### Score Input
- Large score display (7xl monospaced font), defaults to 0 (not min_score)
- Decrease / Increase buttons — disabled at min/max bounds
- Tap display to open numpad:
  - Digits 0–9, backspace, minus (for negative scores)
  - "Done" button to commit entry
  - Value clamped to min/max on commit
- Haptic feedback (vibrate API) when hitting min or max bounds

### Actions
- **"Save Score"** — logs the score, then shows comparison overlay; if block becomes complete, shows block completion screen after overlay is dismissed
- **"Skip Drill"** — marks drill as skipped for today, returns to drill list

### Score Comparison Overlay (shown after Save)
- Trend indicator with label: ↑ Improved / ↓ Declined / → Same / ★ First Entry
- Current score in large font + unit
- Previous score and personal best shown (if not first entry)
- Back to Drills button (or block completion screen if block just finished)

### Block Completion Screen (shown when block is complete)
- Shown after the comparison overlay is dismissed if all drills have reached target_sessions
- Suppressed for the rest of the session if user previously clicked "Keep Going"
- Three options:
  - **Complete Block** — marks status `completed`, redirects to history
  - **Extend Block** — prompts for additional sessions to add to target_sessions, then continues
  - **Keep Going** — dismisses, block stays active (won't re-trigger this session)
