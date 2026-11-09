# Progress Tab (`/progress`)

> **For Claude:** Read this file before making any changes to the Progress screen or block detail. Every feature listed here must still work after your edits.

Handicap, every drill's scores, and past blocks (the old History tab). `/history` redirects to `/progress#blocks`.

---

## Handicap index (top)

- Shown only when at least one snapshot exists in `handicap_snapshots`
- Latest index as a 56px numeral; "Lower is better" next to the section label
- Change since the first snapshot ("↓ 0.8 since May 2"), fairway when down, stripe when up; hidden when flat or a single snapshot
- Line chart of handicap history; dashed trend line fairway if slope ≤ 0, stripe if > 0
- Auto-synced: on each page load, if no snapshot exists for today and GHIN credentials are configured, a fresh handicap is fetched from the GHIN API and stored
- Sync failure shows a flag-yellow note ("Handicap didn't update from GHIN") with the error; the page still renders

### GHIN sync (server-side, `lib/utils/ghin-sync.ts`)
- Requires Vercel env vars: `GHIN_USERNAME`, `GHIN_PASSWORD`, `GHIN_NUMBER`
- Auth flow: Firebase Installations token → GHIN `POST /golfer_login.json` → extract `golfer.display` from `golfer_user.golfers[0]`
- Handicap field: `display` (string, e.g. `"19.4"`) — not `handicap_index` or any other name
- One snapshot per calendar day (UTC); subsequent loads are no-ops

---

## Drills (`components/progress/drill-progress-list.tsx`)

- One row per drill with scores (block and ad-hoc logs): name, unit + direction, latest score, and a small **scorecard strip** of the last 8 scores (best score marked). "Last 8 of N scores" when there are more
- Legend next to the section label: circle = better, square = worse
- Tap a row to expand its chart:
  - X-axis dates (M/D), Y-axis auto-scaled, horizontal grid only
  - Score line in rough with ink dots; tooltip shows block name + date and score
  - Dashed linear-regression trend line across all scores: fairway when improving (direction-aware), stripe when getting worse
  - Block boundary markers between blocks
- No chart animation

## Past blocks (`#blocks`)

- One row per block, newest first: name, dates, session target, status tag (Running / Done / Ended early)
- Tap → block detail

## Block detail (`/history/[blockId]`)

- "← Progress" back link, status label, block name, date range, days logged, session target
- **First day vs last day** (completed or ended-early blocks with 2+ days logged): per drill first → last score (last coloured fairway/stripe by direction), best score
- **Scorecard**: one scorecard strip per drill with every score in the block
- **By day**: newest first; each drill log with score + unit, or "Skipped"

## Empty states

- No handicap and no drill data: one note linking to Today
- Handicap but no drill scores: drills section says to score a drill on Today
