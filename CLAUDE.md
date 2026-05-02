# Claude Code — Golf Practice App Instructions

## Database Safety — MANDATORY

**Before making ANY change to the database schema (DROP TABLE, ALTER TABLE, DELETE rows, etc.):**

1. **Take a snapshot first.** Run the following in the Supabase SQL editor and save the output:
   ```sql
   -- Export all data as INSERT statements (do this per table)
   SELECT * FROM drills;
   SELECT * FROM block_templates;
   SELECT * FROM block_template_drills;
   SELECT * FROM training_blocks;
   SELECT * FROM drill_logs;
   ```
2. **Show the user exactly what SQL will be run** before executing it.
3. **Get explicit confirmation** ("yes, run it") before executing any destructive operation.
4. Never DROP or TRUNCATE a table without confirmation, even if it appears unused.

This rule exists because the Supabase free plan has no self-serve backups. Data loss is permanent.

---

## Feature Preservation — MANDATORY

**Before making ANY change to the app:**

1. Read `FEATURES.md` for the index, then read the relevant file(s) in `features/` for the area being changed. Also read `features/shared.md` for any cross-cutting concerns.
2. After making changes, verify that every feature touched or nearby still works as described.
3. If a change will remove or alter an existing feature, call it out explicitly and get confirmation before proceeding.
4. When a new feature is added or an existing one changes, update the relevant `features/*.md` file as part of the same commit.

This rule exists because features have been silently lost during past edits.

---

## Stack

- **Framework:** Next.js 15 App Router (server components by default)
- **Database:** Supabase (hosted PostgreSQL), connected via `postgres.js` using `DATABASE_URL`
- **Deployment:** Vercel — auto-deploys on push to `main` branch of `reidabook/golf-practice`
- **DB connection:** Transaction pooler (`aws-X-us-east-1.pooler.supabase.com:6543`) with `prepare: false`

See `ARCHITECTURE.md` for full file-to-feature map.
