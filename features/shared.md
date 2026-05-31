# Shared — Navigation, Data Model & UI Patterns

> **For Claude:** Read this file when making changes that affect navigation, data behavior, or cross-cutting UI patterns. Every feature listed here must still work after your edits.

---

## Navigation

- Bottom tab bar with 4 tabs: Home, History, Progress, Drills
- Sticky, safe-area aware (notch devices)
- Breadcrumb navigation on nested screens (e.g., History > Block Name)
- Back buttons on all nested screens

---

## Data & Business Logic

### Training Blocks
- **Start block** from a template — creates a new block with a copy of the template name
- **Block name display**: uses current template name if the template still exists (via `COALESCE(bt.name, tb.name)`), so renaming a template is reflected on active blocks
- **Block status**: `active`, `completed`, `ended_early`
  - Active blocks appear on the home tab
  - Completed and ended-early blocks appear only in history with their correct status label
- **Block deletion**: removes block + all associated drill logs permanently (requires confirmation)
- **Block completion**: automatic when every drill reaches `target_sessions` → shows completion screen; or manually via "Mark Complete"
- **End early**: sets status to `ended_early` via the drill list's End Early button; block moves to history
- **Multiple active blocks**: allowed — no single-active constraint

### Sessions model
- `target_sessions` on `training_blocks` and `block_templates`: how many times each drill must be scored (non-skipped) to finish the block
- Each non-skipped scored log = one session for that drill
- Multiple sessions per calendar day are all counted
- Block is complete when every drill's session count ≥ `target_sessions`
- `isBlockComplete(blockId)` in `lib/queries/blocks.ts` is the canonical check

### Drill Scoring
- **Save score**: records score for a drill within the active block
- **Skip drill**: marks drill as skipped (no score) for today
- **Ad-hoc logging**: log a score for any drill outside a block — appears in Progress charts only
- **Score bounds**: enforced by +/− buttons and numpad clamp; buttons disabled at limits; default starting value is always `max(0, min_score)`
- **Session tracking**: `getBlockDrills()` returns `session_count` per drill (total non-skipped logs in block)

### Analytics
- **Personal best**: highest score (higher-is-better) or lowest (lower-is-better) across all logs for a drill
- **Linear regression trend line**: calculated from all historical logs per drill
- **Scoring direction**: per-drill flag (higher/lower is better) used for trend color coding, personal best logic, and UI labels

### Date Handling
- Stored as ISO format (YYYY-MM-DD) internally
- Displayed as "Mon, Jan 1" in the UI

---

## UI Patterns

### Feedback
- Status badges: Default, Done, Active, Ended Early, Skipped, trend indicators (↑ ↓ → ★)
- Colored trend badges: green (improved), red (declined), yellow (same), blue (first entry)
- Progress bar with percentage text
- Toast notifications for success and error states
- Loading states on buttons ("Saving...", "Deleting...")
- Haptic feedback (vibrate API) on score bounds

### Layout
- Bottom-sheet style modals for forms (drill form, template form) at `z-[60]`
- Block completion screen at `z-[70]` (above all other overlays)
- Inline expansion for log score form
- Confirmation dialogs for all destructive actions
- Empty states with helpful messaging on every screen
- Safe area padding for notched devices
- Bottom nav at `z-50`; overlays must be `z-[60]` or higher to appear above it

### Accessibility
- ARIA labels on all icon-only buttons
- Form labels with unique IDs
- Semantic HTML (buttons, inputs, links)
