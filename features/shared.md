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
- **Start block** from a template — sets start date to today
- **Block status**: active or completed
- **Block deletion**: removes block + all associated drill logs permanently (requires confirmation)
- **Block completion**: manually marked done; triggers completion summary calculation

### Drill Scoring
- **Save score**: records score for a drill on today's date within the active block
- **Skip drill**: marks drill as skipped (no score) for today
- **Ad-hoc logging**: log a score for any drill outside a block — appears in Progress charts only
- **Score bounds**: enforced by +/− buttons and numpad clamp; buttons disabled at limits
- **Daily session model**: all drills scored on the same calendar day are grouped as one session

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
- Status badges: Default, Done, Active, Skipped, trend indicators (↑ ↓ → ★)
- Colored trend badges: green (improved), red (declined), yellow (same), blue (first entry)
- Progress bar with percentage text
- Toast notifications for success and error states
- Loading states on buttons ("Saving...", "Deleting...")
- Haptic feedback (vibrate API) on score bounds

### Layout
- Bottom-sheet style modals for forms (drill form, template form)
- Inline expansion for log score form (expands below selected drill row)
- Confirmation dialogs for all destructive actions (delete block, delete template, delete drill)
- Empty states with helpful messaging on every screen
- Safe area padding for notched devices

### Accessibility
- ARIA labels on all icon-only buttons
- Form labels with unique IDs
- Semantic HTML (buttons, inputs, links)
