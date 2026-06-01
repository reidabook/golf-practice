# Golf Practice App — Architecture & Dependency Map

Use this file to answer "what do I need to touch if X changes?" before starting any feature or refactor.

---

## Rendering Model

Next.js App Router. Default is server components (async, fetch data, no state).
Client components (`'use client'`) are used only for interactivity (forms, state, effects).

All data writes go through **server actions** (`lib/actions/`).
All data reads go through **query functions** (`lib/queries/`) called from server components.

### `force-dynamic` requirement

Every static-path page that queries data **must** export:
```ts
export const dynamic = 'force-dynamic'
```

Without this, Next.js attempts to prerender the page at build time and the sheet connection fails.
Dynamic route pages (`[blockId]`, `[drillId]`) are exempt.

---

## Data Layer

**Backend:** Google Sheets (one spreadsheet, one tab per logical table).
**Library:** `google-spreadsheet` + `google-auth-library` (JWT service account).
**Connection module:** `lib/sheets.ts` — all queries and actions import from here (never from `lib/db.ts`, which is removed).

### Sheet tabs

| Tab name | Logical table | Notes |
|---|---|---|
| `drills` | drills | Drill library |
| `block-templates` | block_templates | Reusable block templates |
| `block-template-drills` | block_template_drills | Junction: template ↔ drills |
| `training-blocks` | training_blocks | Active/completed block instances |
| `drill-logs` | drill_logs | Individual scored drill entries |
| `handicap-snapshots` | handicap_snapshots | GHIN handicap history |

Tab names use hyphens; the `TABS` map in `lib/sheets.ts` translates to underscore-keyed identifiers used throughout the codebase.

### Key functions in `lib/sheets.ts`

| Function | Purpose |
|---|---|
| `getCachedRows(tabKey)` | Read all rows from a tab — **use in all query files**. Returns `Record<string, string>[]`. Cached via `unstable_cache` with tag `sheets-data`. |
| `getRows(tabKey)` | Read raw `GoogleSpreadsheetRow[]` — **use in action files only** (needed for `.set()` / `.save()` / `.delete()`). Not cached. |
| `getSheet(tabKey)` | Get the sheet object — used in actions to call `.addRow()` / `.addRows()`. |
| `invalidateSheetCache()` | Busts the `sheets-data` cache tag — **call in every action after writing**. |
| `toObj(row)` | Converts a raw row to a plain `Record<string, string>`. |
| `parseBool(v)` | Case-insensitive boolean parse — handles `'true'`, `'TRUE'`, `'false'`, `'FALSE'`. |
| `nullStr(v)` / `nullNum(v)` | Convert empty string to `null` / `null` as number. |

### Caching pattern
- All reads in query files go through `getCachedRows` (Next.js data cache, tag `sheets-data`)
- Every action calls `invalidateSheetCache()` before `revalidatePath()` to bust the cache on writes
- This keeps Google Sheets API calls well within the 60 reads/minute quota

### No JOINs — in-memory joins
Google Sheets has no JOIN support. All relational queries load the needed tabs in parallel via `Promise.all` then join in JS using `Map` lookups. See `lib/queries/blocks.ts` and `lib/queries/drill-logs.ts` for examples.

### No constraints — enforced in code
Foreign key constraints and uniqueness are not enforced by Sheets. The `deleteDrill` action manually checks for existing logs before deleting. The `deleteBlock` action deletes associated drill logs first.

### All values are strings
Every cell value is a string. Parse on read: `Number(r.score)`, `parseBool(r.is_default)`, etc. Write as strings: `String(score)`, `'true'`/`'false'`.

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account email from Google Cloud |
| `GOOGLE_PRIVATE_KEY` | Private key (single line, `\n` as literal backslash-n) |
| `GOOGLE_SPREADSHEET_ID` | ID from the Google Sheet URL |
| `GHIN_USERNAME` / `GHIN_PASSWORD` / `GHIN_NUMBER` | Optional — GHIN handicap sync |

---

## Routes

| Path | File | Notes |
|---|---|---|
| `/` | `app/page.tsx` | Active block card, start/continue day CTA |
| `/history` | `app/history/page.tsx` | All blocks list with drill progress |
| `/history/:blockId` | `app/history/[blockId]/page.tsx` | Block detail + per-drill progress |
| `/blocks/:blockId/drills` | `app/blocks/[blockId]/drills/page.tsx` | Drill scoring wizard for today |
| `/blocks/:blockId/drills/:drillId` | `app/blocks/[blockId]/drills/[drillId]/page.tsx` | Single drill full-screen scorer |
| `/progress` | `app/progress/page.tsx` | All-time line charts per drill |
| `/drills` | `app/drills/page.tsx` | Block templates + drill library CRUD |
| `/api/debug` | `app/api/debug/route.ts` | Connection diagnostics — remove before production |

---

## Sheet Tabs → Files That Touch Them

### `drills` tab

| Operation | File |
|---|---|
| Read all | `lib/queries/drills.ts → getDrills()` ← `app/drills/page.tsx` |
| Read one | `lib/queries/drills.ts → getDrill(id)` |
| Create / Update / Delete | `lib/actions/drills.ts` ← `components/library/drills-page-client.tsx` |

**If you add a column:** update `rowToDrill()` in `lib/queries/drills.ts`, the `addRow` call in `lib/actions/drills.ts`, and the drill form in `components/library/drill-form.tsx`.

---

### `block-templates` + `block-template-drills` tabs

| Operation | File |
|---|---|
| Read all | `lib/queries/templates.ts → getTemplates()` ← `app/page.tsx`, `app/drills/page.tsx` |
| Create / Update / Delete | `lib/actions/templates.ts` ← `components/library/drills-page-client.tsx` |

`updateTemplate` deletes all junction rows for the template then re-inserts them — no partial update.

---

### `training-blocks` tab

| Operation | File |
|---|---|
| Read active | `lib/queries/blocks.ts → getActiveBlock()` ← `app/page.tsx` |
| Read all | `lib/queries/blocks.ts → getBlocks()` ← `app/history/page.tsx` |
| Read one | `lib/queries/blocks.ts → getBlock(id)` ← `app/history/[blockId]/page.tsx` |
| Start / Complete / End Early / Extend / Delete | `lib/actions/blocks.ts` |

`deleteBlock` deletes all associated `drill-logs` rows first (no cascade in Sheets).

---

### `drill-logs` tab

| Operation | File |
|---|---|
| Read today's logs | `lib/queries/drill-logs.ts → getBlockDrills(blockId)` ← drill scoring pages |
| Read for comparison | `lib/queries/drill-logs.ts → getDrillComparison(blockId, drillId, score)` |
| Read for progress charts | `lib/queries/progress.ts → getProgressForAllDrills()` ← `app/progress/page.tsx` |
| Save score | `lib/actions/drill-logs.ts → saveDrillLog()` ← `components/scoring/scoring-client.tsx` |
| Skip drill | `lib/actions/drill-logs.ts → skipDrillLog()` ← `components/scoring/scoring-client.tsx` |
| Log ad-hoc | `lib/actions/drill-logs.ts → logDrillScore()` ← `components/library/drills-page-client.tsx` |

---

## Server Actions → Page/Component Consumers

| Action | Exported functions | Used by |
|---|---|---|
| `lib/actions/blocks.ts` | `startBlock`, `completeBlock`, `endBlockEarly`, `extendBlock`, `deleteBlock` | `app/page.tsx`, block detail pages |
| `lib/actions/drill-logs.ts` | `saveDrillLog`, `skipDrillLog`, `logDrillScore` | `components/scoring/scoring-client.tsx`, `components/library/drills-page-client.tsx` |
| `lib/actions/drills.ts` | `createDrill`, `updateDrill`, `deleteDrill` | `components/library/drills-page-client.tsx` |
| `lib/actions/templates.ts` | `createTemplate`, `updateTemplate`, `deleteTemplate` | `components/library/drills-page-client.tsx` |

All actions call `invalidateSheetCache()` then `revalidatePath()` after mutations.

---

## Query Functions → Page Consumers

| Query file | Functions | Used by |
|---|---|---|
| `lib/queries/blocks.ts` | `getActiveBlock`, `getActiveBlocks`, `getBlocks`, `getBlock`, `isBlockComplete` | home, history, block detail, drill scoring pages |
| `lib/queries/drill-logs.ts` | `getBlockDrills`, `getDrillComparison` | drill scoring pages |
| `lib/queries/drills.ts` | `getDrills`, `getDrill` | drills page |
| `lib/queries/progress.ts` | `getProgressForAllDrills` | progress page |
| `lib/queries/templates.ts` | `getTemplates`, `getTemplate` | home page, drills page |
| `lib/queries/handicap.ts` | `getHandicapHistory` | progress page |

---

## Feature Concepts → Files

### "Day as session"
No `sessions` table. A "day of practice" = all `drill-logs` rows with the same `log_date` for a block.
- `getBlockDrills(blockId)` returns today's already-scored drills
- Progress page groups by `log_date` for per-day chart points

### "Block completion flow"
Complete when all template drills have ≥ `target_sessions` non-skipped logs.
- `isBlockComplete(blockId)` in `lib/queries/blocks.ts` — uses raw `getRows` (not cached) since it's called immediately after a write

### "Progress charts"
Recharts is client-side only. Pattern:
- `app/progress/page.tsx` (server) fetches data → passes to `ProgressChartClient`
- `components/progress/progress-chart-client.tsx` (`'use client'`) uses `dynamic()` with `ssr: false`
- `components/progress/progress-chart.tsx` is the actual Recharts component

### "Scoring direction"
Per-drill flag (`higher_better` / `lower_better`). Used for trend color, personal best logic, and UI labels.

---

## Shared Components

| Component | Used by |
|---|---|
| `components/nav/bottom-nav.tsx` | `app/layout.tsx` |
| `components/scoring/score-input.tsx` | `components/scoring/scoring-client.tsx` |
| `components/scoring/numpad.tsx` | `components/scoring/score-input.tsx` |
| `components/scoring/comparison-overlay.tsx` | `components/scoring/scoring-client.tsx` |
| `components/ui/*` | everywhere |

---

## Known Gaps / Pending

- `/api/debug` route should be removed or protected before treating as fully production
- No auth — single user assumed
- No automatic backups — take a manual export of the Google Sheet periodically
