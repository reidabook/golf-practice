# Golf Practice App — Claude Instructions

## Stack
- **Framework:** Next.js 15 App Router — server components by default, `'use client'` only for interactivity
- **Database:** Supabase (PostgreSQL) via `postgres.js` + `DATABASE_URL`. Connection: transaction pooler, `prepare: false`
- **Deployment:** Vercel, auto-deploys `main` branch of `reidabook/golf-practice`
- See `ARCHITECTURE.md` for routes, DB tables, and component map. See `features/` for feature specs.

## MANDATORY: Before any database schema change
1. Snapshot first — run `SELECT * FROM drills; SELECT * FROM block_templates; SELECT * FROM block_template_drills; SELECT * FROM training_blocks; SELECT * FROM drill_logs;` and save output.
2. Show the exact SQL to the user before running it.
3. Get explicit confirmation ("yes, run it") before executing.
4. Never DROP or TRUNCATE without confirmation — Supabase free plan has no self-serve backups.

## MANDATORY: Before any app change
1. Read `FEATURES.md` index, then relevant `features/*.md` file(s), and `features/shared.md`.
2. After changes, verify all touched features still work as described.
3. Call out any feature removal/alteration explicitly before proceeding.
4. Update the relevant `features/*.md` as part of the same commit.
