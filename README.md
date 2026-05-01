# Golf Practice Tracker

Mobile-first PWA for tracking golf practice drill scores across training blocks.
Add to iPhone home screen via Safari → Share → Add to Home Screen.

## Stack

- **Next.js 15** (App Router, server components + server actions)
- **TypeScript**
- **Tailwind CSS v3** (PostCSS plugin)
- **shadcn/ui** (Radix-based component library)
- **Recharts** (progress charts, client-side only via dynamic import)
- **postgres.js** (direct PostgreSQL connection to Supabase)
- **Supabase** (hosted PostgreSQL — accessed via `DATABASE_URL`, not the JS SDK)

## Deployment

**Deployed on Vercel** — pushes to `main` on GitHub trigger automatic deploys.

Repository: `https://github.com/reidabook/golf-practice`

> **Important:** `npmjs.org` is blocked on UKG networks (Zscaler). Do not run `npm install`
> locally on a UKG connection. Dependencies install automatically during Vercel builds.
> For local dev, use a personal network or phone hotspot.

## Environment Variables

Set in Vercel dashboard → Settings → Environment Variables:

| Variable | Description |
|---|---|
| `DATABASE_URL` | `postgresql://postgres:<password>@db.<project>.supabase.co:5432/postgres` |

The `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` vars in `.env.local` are legacy —
the app no longer uses the Supabase JS SDK.

## Data Model (Day-Based)

Sessions are **not** a concept. Each day drills are logged counts as a day of practice.

| Table | Purpose |
|---|---|
| `drills` | Drill definitions (name, unit, scoring_direction) |
| `block_templates` + `block_template_drills` | Reusable block configs with ordered drill lists |
| `training_blocks` | Active or completed practice blocks (ref to template) |
| `drill_logs` | One row per drill scored, keyed to `block_id`, `drill_id`, `log_date` |

`sessions` and `session_drills` tables still exist in Supabase but are unused.

## File Index

### Config
| File | Purpose |
|---|---|
| `package.json` | Dependencies (Next.js, postgres, recharts, shadcn/ui, Tailwind) |
| `next.config.ts` | Next.js config |
| `tailwind.config.ts` | Tailwind theme |
| `postcss.config.js` | PostCSS (required for Tailwind v3 + Next.js) |
| `tsconfig.json` | TypeScript config |
| `vercel.json` | Declares Next.js framework for Vercel |
| `schema.sql` | Supabase Postgres DDL (may be out of date — see Applied Migrations below) |
| `.env.local` | Local env vars (DATABASE_URL) — not committed |

### App (`app/`)
| File | Route | Notes |
|---|---|---|
| `app/layout.tsx` | all routes | Root layout, bottom nav, Toaster |
| `app/page.tsx` | `/` | Home: active block, start/continue day |
| `app/loading.tsx` | all routes | Global suspense fallback |
| `app/error.tsx` | all routes | Global error boundary |
| `app/history/page.tsx` | `/history` | All blocks list |
| `app/history/[blockId]/page.tsx` | `/history/:blockId` | Block detail + drill progress |
| `app/history/[blockId]/not-found.tsx` | 404 for bad blockId | |
| `app/blocks/[blockId]/drills/page.tsx` | `/blocks/:blockId/drills` | Drill scoring wizard (today's session) |
| `app/blocks/[blockId]/drills/[drillId]/page.tsx` | `/blocks/:blockId/drills/:drillId` | Single drill scoring screen |
| `app/progress/page.tsx` | `/progress` | All-time charts per drill |
| `app/drills/page.tsx` | `/drills` | Block templates + drill library CRUD |

### Lib
| File | Purpose |
|---|---|
| `lib/db.ts` | postgres.js singleton (uses `DATABASE_URL`) |
| `lib/types.ts` | Shared TypeScript types |
| `lib/utils.ts` | `cn()` class merging utility |
| `lib/queries/blocks.ts` | Read queries: active block, block list, block detail |
| `lib/queries/drill-logs.ts` | Read queries: today's logs, drill comparison |
| `lib/queries/drills.ts` | Read queries: drill library |
| `lib/queries/progress.ts` | Read queries: all-drill progress for charts |
| `lib/queries/templates.ts` | Read queries: block templates |
| `lib/actions/blocks.ts` | Server actions: start block, complete block |
| `lib/actions/drill-logs.ts` | Server actions: saveDrillLog, skipDrillLog, logDrillScore |
| `lib/actions/drills.ts` | Server actions: createDrill, updateDrill, deleteDrill |
| `lib/actions/templates.ts` | Server actions: createTemplate, updateTemplate, deleteTemplate |

### Components
| File | Purpose |
|---|---|
| `components/nav/bottom-nav.tsx` | Fixed 4-tab bottom nav (Home/History/Progress/Drills) |
| `components/drill-scoring-client.tsx` | Client component for the drill scoring wizard |
| `components/block-drill-list-client.tsx` | Client component for block drill list |
| `components/block-completion-summary.tsx` | Summary shown on block completion |
| `components/drill-comparison-overlay.tsx` | After scoring: comparison vs previous attempts |
| `components/progress-chart.tsx` | Recharts line chart (client-only, lazy-loaded) |
| `components/progress-chart-client.tsx` | `'use client'` wrapper with dynamic import + Skeleton |
| `components/drill-form.tsx` | Create/edit drill modal |
| `components/template-form.tsx` | Create/edit block template modal |
| `components/drills-page-client.tsx` | Full client component for /drills page |
| `components/drill-instructions.tsx` | Collapsible drill instructions |
| `components/score-input.tsx` | Stepper ±1 + numpad overlay |
| `components/numpad.tsx` | Custom 0-9 numpad |
| `components/sw-register.tsx` | PWA service worker registration |
| `components/ui/` | shadcn/ui primitives (button, card, badge, etc.) |

---

## Applied Migrations (Supabase)

In order applied:

1. Initial schema — `drills`, `block_templates`, `block_template_drills`, `training_blocks`, `sessions`, `session_drills`
2. `ALTER TABLE session_drills ADD COLUMN skipped BOOLEAN NOT NULL DEFAULT FALSE;`
3. `ALTER TABLE drills ADD COLUMN source TEXT;`
4. Day-based model migration — added `drill_logs` table; renamed `session_count → target_days` on `block_templates` and `training_blocks`

---

## Pending Actions

- [ ] Replace `public/icon-192.png` and `public/icon-512.png` with real golf icons
- [ ] Reset Supabase database password (was shared in plain text during setup)
- [ ] Drop unused `sessions` and `session_drills` tables from Supabase once stable
- [ ] Update `schema.sql` to reflect current table structure
