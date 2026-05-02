# Golf Practice App — Feature Inventory

> **For Claude:** Read this file before making any changes to the app. Every feature listed here must still work after your edits. If a change will affect or remove a feature, call it out explicitly and get confirmation first.

---

## Navigation

- Bottom tab bar with 4 tabs: Home, History, Progress, Drills
- Sticky, safe-area aware (notch devices)

---

## Home (`/`)

### No active block
- List of available block templates (name, description, target days, Default badge)
- One-click start for any template
- Empty state with link to create templates if none exist

### Active block
- Block name and "Started [date]"
- Visual progress bar with "X of Y drills" and "Z remaining"
- Count of drills already scored today
- "Open Training" button linking to drill scoring wizard

---

## History (`/history`)

### List screen
- One card per block: name, status badge (Done / Active), start/end dates, target duration
- Empty state when no history
- Clickable to view block detail

### Block detail (`/history/[blockId]`)
- Breadcrumb navigation back to History
- Block name and date range
- "X of Y days logged" progress
- **Block Completion Summary** (completed blocks with 2+ days):
  - Per-drill: first vs last score, trend indicator (↑ ↓ → ★), personal best, colored trend badge
- Drill logs grouped by day, newest first
- Per log: drill name + score + unit, or "Skipped" badge
- Day dividers between groups

---

## Progress (`/progress`)

- One line chart per drill showing score history over time
- X-axis: dates (M/D format)
- Y-axis: auto-scaled
- Interactive tooltips: full date, block name, score
- Green data points
- **Linear regression trend line** overlaid on each chart
- Scoring direction label ("↑ higher is better" / "↓ lower is better") with unit
- Empty state when no data

---

## Drill Scoring Wizard (`/blocks/[blockId]/drills`)

- Block name + total drill count + count completed today
- Two sections: "Up Next" (not yet scored today) and "Done Today"
- Per-drill row: name, unit, last score, scoring direction badge, "Done" badge if complete
- Clickable row → opens single drill scorer
- **Mark Complete** button (marks block finished)
- **Delete** button with confirmation dialog (removes block + all logs)

---

## Single Drill Scorer (`/blocks/[blockId]/drills/[drillId]`)

### Scoring interface
- Back button to drill list
- Block name (small) + drill name (large)
- Description and instructions (if defined on the drill)
- Last score reference for this drill in this block
- Large score display (7xl monospaced font)
- Decrease / Increase buttons (disabled at min/max bounds)
- Tap-to-edit opens numpad:
  - Digits 0–9, backspace, minus (for negative scores)
  - "Done" button to commit
  - Input clamped to min/max
- Haptic feedback (vibrate) when hitting min/max bounds
- **"Save Score"** button → logs score and shows comparison overlay
- **"Skip Drill"** button → marks as skipped, returns to drill list

### Score comparison overlay (shown after Save)
- Trend indicator: ↑ (improved, green) / ↓ (declined, red) / → (same, yellow) / ★ (first entry, blue)
- Label: Improved / Declined / Same / First Entry
- Current score in large font + unit
- Previous score and personal best (if not first entry)
- "Nothing to compare yet — keep going!" (if first entry)
- Back to Drills button

---

## Drills & Templates (`/drills`)

### Block Templates section
- List of templates: name, description, target days, Default badge
- Edit (pencil) and Delete (with confirmation) per template
- "+ New" button opens template form
- Empty state

### Template form (modal)
- Fields: name (required), description, target days (1–52, required)
- Drill selector: available list + selected list with drag-to-reorder (grip icon)
- Toggle to add/remove drills
- Save / close (X)
- Toast on success or deletion

### Drill Library section
- List of drills: name, unit, scoring direction badge, Default badge
- Three actions per drill: Log Score (inline), Edit, Delete (with confirmation)
- **Inline log score form** (expands below selected drill):
  - Score input, date picker (defaults today), notes field
  - Save Log / close (X)
- Empty state
- "+ New" button opens drill form

### Drill form (modal)
- Fields: name, description, instructions, scoring direction (toggle: higher / lower), min score, max score (optional), unit
- All required except max score and description
- Save / close (X)
- Toast on success
- Error toast: "Drills with recorded scores cannot be deleted"

---

## Data & Business Logic

- **Start block** from template (sets start date to today)
- **Block status**: active or completed
- **Block deletion**: removes block + all associated drill logs permanently (with confirmation)
- **Block completion**: manually mark done; triggers completion summary calculation
- **Save score**: records score for drill on today's date within active block
- **Skip drill**: marks drill as skipped (no score) for today
- **Ad-hoc logging**: log score for any drill outside a block (appears in progress charts only)
- **Score bounds**: enforced by +/- buttons and numpad clamp; disables buttons at limits
- **Daily session model**: all drills scored on the same calendar day are one "session"
- **Personal best**: highest score (higher-is-better drills) or lowest (lower-is-better drills) across all logs
- **Linear regression**: calculated from all historical logs per drill for trend line
- **Scoring direction**: per-drill flag used for trend color coding and personal best logic
- **Date handling**: ISO format internally (YYYY-MM-DD); displayed as "Mon, Jan 1"

---

## UI Patterns

- Status badges: Default, Done, Active, Skipped, trend indicators
- Progress bar with percentage text
- Toast notifications (success and error)
- Empty states with helpful messaging on every screen
- Breadcrumb navigation (History > Block Name)
- Back buttons on nested screens
- Bottom-sheet style modals for forms
- Inline expansion for log score form
- Confirmation dialogs for all destructive actions
- Loading states on buttons ("Saving...", "Deleting...")
- ARIA labels on icon-only buttons
- Safe area padding for notched devices
