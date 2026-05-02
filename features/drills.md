# Drills Tab (`/drills`)

> **For Claude:** Read this file before making any changes to the Drills screen. Every feature listed here must still work after your edits.

---

## Block Templates Section

- List of templates: name, description, target days, Default badge
- Edit (pencil icon) and Delete (with confirmation dialog) per template
- "+ New" button opens template form
- Empty state when no templates

### Template Form (modal)
- Fields: name (required), description, target days (1–52, required)
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

- Block name + total drill count + count completed today in header
- Two sections: "Up Next" (not yet scored today) and "Done Today"
- Per-drill row: name, unit, last score, scoring direction badge, "Done" badge if complete
- Clicking a row opens the single drill scorer
- **Mark Complete** button — marks block as finished
- **Delete** button — confirmation dialog; removes block and all associated drill logs permanently

## Single Drill Scorer (`/blocks/[blockId]/drills/[drillId]`)

### Layout
- Back button to drill list
- Block name (small) above drill name (large)
- Description and instructions displayed if defined on the drill
- Last score reference for this drill in this block (if exists)

### Score Input
- Large score display (7xl monospaced font)
- Decrease / Increase buttons — disabled at min/max bounds
- Tap display to open numpad:
  - Digits 0–9, backspace, minus (for negative scores)
  - "Done" button to commit entry
  - Value clamped to min/max on commit
- Haptic feedback (vibrate API) when hitting min or max bounds

### Actions
- **"Save Score"** — logs the score, then shows comparison overlay
- **"Skip Drill"** — marks drill as skipped for today, returns to drill list

### Score Comparison Overlay (shown after Save)
- Trend indicator with label:
  - ↑ Improved (green)
  - ↓ Declined (red)
  - → Same (yellow)
  - ★ First Entry (blue)
- Current score in large font + unit
- Previous score and personal best shown (if not first entry)
- "Nothing to compare yet — keep going!" message (if first entry)
- Back to Drills button
