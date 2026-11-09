# Drill Scoring (`/blocks/[blockId]/drills/...`)

> **For Claude:** Read this file before making any changes to drill scoring. Every feature listed here must still work after your edits.
> The drill library and block templates moved to `features/library.md`.

---

## Drill list

The drill list is Today (`/`) — see `features/today.md`. `/blocks/[blockId]/drills` redirects there.

## Single Drill Scorer (`/blocks/[blockId]/drills/[drillId]`)

### Layout (`components/scoring/scoring-client.tsx`)
- "← Today" back link; "Drill N of M" label
- Drill name, then this drill's **scorecard strip** for the block (next box highlighted)
- **How to play** (collapsible): description, then instructions — lines starting `- ` become numbered steps (`lib/instructions.ts`, unit-tested), other lines are flag-marked notes. Open by default on a drill's first session
- Save score and Skip sit above the bottom nav

### Score Input (`components/scoring/score-input.tsx`)
- 96px wide numeral, unit underneath; number ticks up/down on +/− (no animation with reduced motion)
- Starts at `max(0, min_score)`
- 72px − / + buttons — disabled at min/max bounds; haptic buzz when pressed at a bound
- Tap the number to open the numpad (sheet above the nav): digits, backspace, minus (only when `min_score < 0`), **Done** commits and clamps to min/max
- "Last time X" under the input when the drill has a previous score in this block

### Actions
- **Save score** — logs the score, then the same screen shows the result (no overlay):
  - Score drawn in a **circle** (better than last time) or **square** (worse); plain for same/first
  - "Better than last time (X)" / "Worse than last time (X)" / "Same as last time (X)" / "First score in this block"
  - Personal best (flag pill when this score is the best)
  - The scorecard strip gains the new box with its mark drawn in
  - **Next: [drill] →** opens the next drill still to do today; "Back to Today" link. When nothing is left: "All done today — back to Today"
- **Skip drill today** — logs a skip and goes to the next drill (or Today). Skipped drills show under Done today with a "Skipped" tag

### Resume after app is killed
- Unsaved score is kept as a draft in localStorage and restored when the drill reopens (cleared on save/skip, or if already scored today)
- If iOS kills the app on this screen, relaunching within 3 hours reopens it (`DrillRouteWatcher`, see `features/shared.md` → App relaunch)

### Block Completion Screen (`components/scoring/block-completion-screen.tsx`)
- Shown after saving when every drill has reached `target_sessions`
- Suppressed for the rest of the session if user previously chose "Keep going"
- Options:
  - **Complete block** — marks status `completed`, opens the block in Progress
  - **Add sessions** — asks how many sessions to add to `target_sessions`, then continues
  - **Keep going** — dismisses, block stays active (won't re-trigger this session)
