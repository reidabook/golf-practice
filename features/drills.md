# Drill Scoring (`/blocks/[blockId]/drills/...`)

> **For Claude:** Read this file before making any changes to drill scoring. Every feature listed here must still work after your edits.
> The drill library and block templates moved to `features/library.md`.

---

## Drill list

The drill list is Today (`/`) — see `features/today.md`. `/blocks/[blockId]/drills` redirects there.

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

### Resume after app is killed
- Unsaved score is kept as a draft in localStorage and restored when the drill reopens (cleared on save/skip, or if already scored today)
- If iOS kills the app on this screen or the drill list, relaunching within 3 hours reopens it (`DrillRouteWatcher`, see `features/shared.md` → App relaunch)

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
