# Today Tab (`/`)

> **For Claude:** Read this file before making any changes to the Today screen. Every feature listed here must still work after your edits.

Today is the running block's drill list. Open the app → one tap to the next drill. `/blocks/[blockId]/drills` redirects here.

---

## Block running (`components/today/today-client.tsx`)

### Header
- Date label ("MON, NOV 9"), block name (template's current name), "Session X of Y · N of M done today"
  - Session X = the session the least-played drill is on
- **⋯** button opens a bottom sheet: **Mark complete**, **End early**, **Delete block** — each asks to confirm
  - Mark complete → status `completed`, goes to the block's page in Progress
  - End early → status `ended_early`, scores kept
  - Delete → removes the block and all its drill logs

### Up next
- Drills not scored today, in template order. Each row: name, unit + direction arrow, **scorecard strip** of this block's scores (see `features/shared.md`)
- First row is the next drill: flag-yellow left bar and its next scorecard box highlighted
- "Target met" tag once a drill reaches `target_sessions` (still tappable; extra scores don't count toward the block)
- Rows open the drill scorer

### All done
- When every drill has a score today: "All N drills scored today" note; drills stay tappable

### Done today
- Muted rows with a check and today's score + unit; tap to score again

### Start button
- Sticky above the bottom nav: **Start: [next drill] →** opens the next drill's scorer. Hidden when everything is done

### Home routine (`components/today/home-routine.tsx`)
- Collapsible checklist (from the old Plan tab, content in `lib/plan-content.ts`): label, duration, detail per item; "N/3" count
- Ticks are stored per day in localStorage (`plan-checklist-YYYY-MM-DD`)

## No block running
- "No block running" header, template rows with **Start** (and drill/session counts), "Manage blocks" → Library → Blocks
- Empty state links to Library when there are no templates
- Home routine checklist

## Notes
- One block runs at a time (`features/shared.md` → Training Blocks)
- `getActiveBlock()` + `getBlockDrills()` feed this page
