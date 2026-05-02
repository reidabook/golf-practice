# Progress Tab (`/progress`)

> **For Claude:** Read this file before making any changes to the Progress screen. Every feature listed here must still work after your edits.

---

## Handicap Index Section (top of page)

- Shown only when at least one snapshot exists in `handicap_snapshots`
- Displays the most recent handicap index as a large number next to the section heading
- "↓ lower is better" label beneath heading
- Line chart of handicap history over time (same chart style as drill charts)
- Trend line: **green** if slope ≤ 0 (improving / declining), **red** if slope > 0 (worsening / rising)
- Auto-synced: on each page load, if no snapshot exists for today and GHIN credentials are configured, a fresh handicap is fetched from the GHIN API and stored

### GHIN sync (server-side, `lib/utils/ghin-sync.ts`)
- Requires Vercel env vars: `GHIN_USERNAME`, `GHIN_PASSWORD`, `GHIN_NUMBER`
- Auth flow: Firebase session token → GHIN `/golfer_login.json` → Bearer token → `/search_golfer.json`
- One snapshot per calendar day (UTC); subsequent loads are no-ops
- Errors are swallowed — page renders without handicap data if sync fails

---

## Drill Charts

- One line chart per drill showing score history over time
- X-axis: dates (M/D format)
- Y-axis: auto-scaled to data range
- Interactive tooltips: full date (YYYY-MM-DD), block name, score value
- Green data points for each log entry

## Trend Line

- Linear regression line overlaid on each chart
- Calculated from all historical scores for that drill
- Shows overall direction regardless of recency

## Labels

- Scoring direction label per chart: "↑ higher is better" or "↓ lower is better"
- Unit displayed below drill name

## Empty State

- Full empty state shown only when there is no handicap data AND no drill data
- If handicap data exists but no drill data, drill section shows inline "Log drills" message
