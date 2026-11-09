# Shared — Navigation, Data Model & UI Patterns

> **For Claude:** Read this file when making changes that affect navigation, data behavior, or cross-cutting UI patterns. Every feature listed here must still work after your edits.

---

## Navigation

- Bottom tab bar with 4 tabs: Today (`/`), Progress, Library, Tempo. Active tab: fairway icon + label and a fairway bar on top
- Old URLs redirect (`next.config.ts`): `/drills` → `/library`, `/plan` → `/library?tab=guides`, `/history` → `/progress#blocks`
- Today is active on `/` and `/blocks/...`; Progress is active on `/progress` and `/history/...`
- Play Mode (`/play`, `/play/round`) is hidden — no nav tab, reachable by direct URL only
- Sticky, safe-area aware (notch devices)
- Breadcrumb navigation on nested screens (e.g., History > Block Name)
- Back buttons on all nested screens
- Tab switches are instant: visited tabs are kept in the client router cache for 60s and nav links prefetch every tab's data; any save clears the cache

### App relaunch (home-screen app)
- App opens instantly from the service worker's cached page, then refreshes data in the background (`router.refresh()` on launch)
- If iOS kills the app while a drill scorer is open (e.g. screen locked), relaunching within 3 hours returns to that same screen (the drill list is Today, which the app opens on anyway); the unsaved score on the drill scorer is restored from its draft
- Navigating away from a drill screen on purpose clears the saved route — no restore

---

## Data & Business Logic

### Data Layer
- Backend is Google Sheets. All reads use `getCachedRows(tabKey)` from `lib/sheets.ts`. All writes use `getRows(tabKey)` or `getSheet(tabKey)`, then call `invalidateSheetCache()` after the write.
- All values are strings in the sheet — parse on read (`Number()`, `parseBool()`, `nullStr()`, etc.).
- There are no foreign key constraints or uniqueness enforcement — these are handled in application code.

### Training Blocks
- **Start block** from a template — creates a new row in `training-blocks` tab with a copy of the template name
- **Block name display**: uses the current template name if the template still exists (loaded from `block-templates` tab and matched in JS), so renaming a template is reflected on active blocks
- **Block status**: `active`, `completed`, `ended_early`
  - The active block's drills are the Today tab
  - Completed and ended-early blocks appear only in history with their correct status label
- **Block deletion**: removes block row + all associated drill log rows (cascaded manually in `deleteBlock` action)
- **Block completion**: automatic when every drill reaches `target_sessions` → shows completion screen; or manually via Today's ⋯ menu → Mark complete
- **End early**: sets status to `ended_early` from Today's ⋯ menu; block moves to Progress → Past blocks
- **One active block at a time**: `startBlock` ends any active block early before starting the new one; the UI confirms first

### Sessions model
- `target_sessions` on `training-blocks` and `block-templates` tabs: how many times each drill must be scored (non-skipped) to finish the block
- Each non-skipped scored log = one session for that drill
- Multiple sessions per calendar day are all counted
- Block is complete when every drill's session count ≥ `target_sessions`
- `isBlockComplete(blockId)` in `lib/queries/blocks.ts` is the canonical check — uses uncached `getRows` since it runs immediately after a write

### Drill Scoring
- **Save score**: records score for a drill within the active block
- **Skip drill**: marks drill as skipped (no score) for today
- **Ad-hoc logging**: log a score for any drill outside a block — appears in Progress charts only (`block_id` stored as empty string)
- **Score bounds**: enforced by +/− buttons and numpad clamp; buttons disabled at limits; default starting value is always `max(0, min_score)`
- **Session tracking**: `getBlockDrills()` returns `session_count` per drill (total non-skipped logs in block)

### Analytics
- **Personal best**: highest score (higher-is-better) or lowest (lower-is-better) across all logs for a drill
- **Linear regression trend line**: calculated client-side from all historical logs per drill
- **Scoring direction**: per-drill flag (higher/lower is better) used for trend color coding, personal best logic, and UI labels

### Date Handling
- Stored as `YYYY-MM-DD` string in the sheet
- Displayed as "Mon, Jan 1" in the UI
- `today()` helper in `lib/sheets.ts` returns today as `YYYY-MM-DD`

---

## UI Patterns

### Visual system ("Range Card", see `features/redesign/spec.md`)
- Light by default (readable in sunlight); dark follows the phone's system setting — no in-app toggle. Tailwind `darkMode: 'media'`
- Tokens in `app/globals.css`: `chalk` (page), `ink` (text), `rough` (secondary text), `fairway` (primary / better), `flag` (accent, focus ring, personal best), `stripe` (destructive / worse). shadcn names (`primary`, `muted`…) map onto them. Never use raw Tailwind colours (`green-500` etc.)
- Type: Archivo (`font-display`, width axis) for numerals and labels; Atkinson Hyperlegible (`font-sans`) for body. Utility classes: `.label` (condensed uppercase), `.numeral` (wide tabular), `.screen-title`
- Focus ring is `flag`; `prefers-reduced-motion` disables animation globally
- Charts use `hsl(var(--token))` colours so they follow the theme

### Scorecard strip (`components/ui/scorecard-strip.tsx`)
- One joined row of boxes, one per session, holding the scores in logged order — like a golf scorecard
- **Circle** (fairway) = better than the score before; **square** (stripe) = worse; plain = same or first score. "Better" follows the drill's scoring direction (`lib/scorecard.ts → markFor`, unit-tested)
- Empty boxes = sessions still to play; `highlightNext` gives the next one a flag-yellow fill and underline
- `showBest` adds a flag-yellow corner to the best score
- `animateIndex` draws that box's mark in (300 ms) — used right after saving
- Data: `getBlockDrills()` returns `scores` (oldest first) and `today_score` per drill

### Feedback
- Status badges: Default, Done, Active, Ended Early, Skipped, trend indicators (↑ ↓ → ★)
- Trend colours: fairway (improved), stripe (declined), rough (same), flag (first entry)
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
