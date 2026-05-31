# Golf Practice App — Architecture & Dependency Map

Use this file to answer "what do I need to touch if X changes?" before starting any feature or refactor.

---

## Rendering Model

Next.js App Router. Default is server components (async, fetch data, no state).
Client components (`'use client'`) are used only for interactivity (forms, state, effects).

All DB writes go through **server actions** (`lib/actions/`).
All DB reads go through **query functions** (`lib/queries/`) called from server components.

### `force-dynamic` requirement

Every static-path page that queries the database **must** export:
```ts
export const dynamic = 'force-dynamic'
```

Without this, Next.js attempts to prerender the page at build time. The Vercel build
environment cannot reach Supabase, so the build fails with `ENETUNREACH`.
Dynamic route pages (`[blockId]`, `[drillId]`) are exempt — they are not prerendered
unless `generateStaticParams` is defined.

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

---

## Database Tables → Files That Touch Them

### `drills`
Columns: `id, name, unit, scoring_direction, category, description, source, is_default`

| Operation | File |
|---|---|
| Read all | `lib/queries/drills.ts → getDrills()` ← `app/drills/page.tsx` |
| Create / Update / Delete | `lib/actions/drills.ts` ← `components/library/components/library/drills-page-client.tsx` |

**If you add a column:** update `getDrills()` query, drill form in `components/library/drill-form.tsx`, and any display in `components/scoring/scoring-client.tsx`.

---

### `block_templates` + `block_template_drills`
Columns: `id, name, description, target_sessions, is_default` / `template_id, drill_id, sort_order`

| Operation | File |
|---|---|
| Read all | `lib/queries/templates.ts → getTemplates()` ← `app/page.tsx`, `app/drills/page.tsx` |
| Create / Update / Delete | `lib/actions/templates.ts` ← `components/library/components/library/drills-page-client.tsx` |

**If you change template structure:** `getTemplates()` is the single read path — update it and callers cascade.

---

### `training_blocks`
Columns: `id, template_id, name, target_sessions, status, started_at, completed_at`

| Operation | File |
|---|---|
| Read active | `lib/queries/blocks.ts → getActiveBlock()` ← `app/page.tsx` |
| Read all | `lib/queries/blocks.ts → getBlocks()` ← `app/history/page.tsx` |
| Read one | `lib/queries/blocks.ts → getBlock(id)` ← `app/history/[blockId]/page.tsx` |
| Start | `lib/actions/blocks.ts → startBlock()` ← `app/page.tsx` (server action) |
| Complete | `lib/actions/blocks.ts → completeBlock()` ← block detail page |

---

### `drill_logs`
Columns: `id, block_id (nullable), drill_id, score (nullable), skipped, log_date, created_at`

This is the core of the day-based model. One row per drill per day (or per attempt).

| Operation | File |
|---|---|
| Read today's logs | `lib/queries/drill-logs.ts → getBlockDrills(blockId)` ← drill scoring pages |
| Read for comparison | `lib/queries/drill-logs.ts → getDrillComparison(blockId, drillId, score)` |
| Read for progress charts | `lib/queries/progress.ts → getProgressForAllDrills()` ← `app/progress/page.tsx` |
| Save score (in-block) | `lib/actions/drill-logs.ts → saveDrillLog(blockId, drillId, score)` ← `components/scoring/scoring-client.tsx` |
| Skip drill (in-block) | `lib/actions/drill-logs.ts → skipDrillLog(blockId, drillId)` ← `components/scoring/scoring-client.tsx` |
| Log ad-hoc (no block) | `lib/actions/drill-logs.ts → logDrillScore(drillId, score, date?)` ← `components/library/drills-page-client.tsx` |

**If you add a column:** update INSERT statements in all three actions above and SELECT in the query files.

---

## Server Actions → Page/Component Consumers

| Action | Exported functions | Used by |
|---|---|---|
| `lib/actions/blocks.ts` | `startBlock`, `completeBlock` | `app/page.tsx`, block detail pages |
| `lib/actions/drill-logs.ts` | `saveDrillLog`, `skipDrillLog`, `logDrillScore` | `components/scoring/scoring-client.tsx`, `components/library/drills-page-client.tsx` |
| `lib/actions/drills.ts` | `createDrill`, `updateDrill`, `deleteDrill` | `components/library/drills-page-client.tsx` |
| `lib/actions/templates.ts` | `createTemplate`, `updateTemplate`, `deleteTemplate` | `components/library/drills-page-client.tsx` |

All actions call `revalidatePath()` to invalidate the relevant server component cache after mutations.

---

## Query Functions → Page Consumers

| Query file | Functions | Used by |
|---|---|---|
| `lib/queries/blocks.ts` | `getActiveBlock`, `getBlocks`, `getBlock` | home, history, block detail pages |
| `lib/queries/drill-logs.ts` | `getBlockDrills`, `getDrillComparison` | drill scoring pages |
| `lib/queries/drills.ts` | `getDrills` | drills page |
| `lib/queries/progress.ts` | `getProgressForAllDrills` | progress page |
| `lib/queries/templates.ts` | `getTemplates` | home page (template picker), drills page |

---

## Feature Concepts → Files

### "Day as session"
There are no `sessions`. A "day of practice" = all `drill_logs` rows with the same `log_date` for a block.
- `lib/queries/drill-logs.ts → getBlockDrills(blockId)` returns today's already-scored drills
- `app/blocks/[blockId]/drills/page.tsx` uses this to show which drills still need scoring today
- Progress page groups by `log_date` to show per-day chart points

### "Block completion flow"
A block ends when all template drills have at least one non-skipped log entry.
- Manual trigger: `completeBlock()` server action
- Display: `app/history/[blockId]/page.tsx` + `components/history/block-completion-summary.tsx`

### "Drill scoring flow"
`/` → `/blocks/:blockId/drills` → `/blocks/:blockId/drills/:drillId` (×N) → back to `/`
- `components/scoring/scoring-client.tsx` owns scoring UI state and calls `saveDrillLog` / `skipDrillLog`
- After save, shows `drill-comparison-overlay.tsx` with performance vs history
- `revalidatePath` in action refreshes server component cache when returning to home

### "Scoring direction"
Each drill has `scoring_direction: 'higher_better' | 'lower_better'`.
- Read by: `app/progress/page.tsx` (chart label), `components/scoring/comparison-overlay.tsx` (trend color)
- **To add a new direction:** update both display sites.

### "Progress charts"
Recharts is client-side only (SSR-incompatible). Pattern used:
- `app/progress/page.tsx` is a server component — fetches data, passes to `ProgressChartClient`
- `components/progress/progress-chart-client.tsx` is `'use client'` — uses `dynamic()` with `ssr: false`
- `components/progress/progress-chart.tsx` is the actual Recharts component

### "Ad-hoc score logging"
The `/drills` page allows logging a score for any drill without being in a training block.
- `logDrillScore(drillId, score, date?)` inserts a `drill_log` with `block_id = null`
- These logs appear in the progress charts but not in block-specific drill progress

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

## Infrastructure

- **Database:** Supabase (hosted PostgreSQL)
- **Connection:** `postgres.js` via `DATABASE_URL` environment variable — direct TCP, not Supabase JS SDK
- **DB singleton:** `lib/db.ts` — all queries and actions import `sql` from here
- **Deployment:** Vercel, auto-deploy on push to `main` branch of `reidabook/golf-practice`
- **Env vars:** `DATABASE_URL` set in Vercel dashboard (not committed to repo)

### Why postgres.js instead of Supabase JS SDK?
Next.js server components run in Node.js on Vercel — `postgres.js` works cleanly.
The Supabase JS SDK uses the Supabase REST/Realtime API, which is unnecessary overhead
for a single-user server-rendered app with direct DB access.

---

## Known Gaps / Pending

- No auth — single user assumed; all rows visible to all
- `sessions` and `session_drills` tables still exist in Supabase DB but are unused
- `schema.sql` in repo reflects old schema; needs update after day-based migration
- Supabase DB password was shared in plain text during setup — should be rotated
