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

## Stack

- **Framework:** Next.js 15 App Router (server components by default)
- **Database:** Supabase (hosted PostgreSQL), connected via `postgres.js` using `DATABASE_URL`
- **Deployment:** Vercel — auto-deploys on push to `main` branch of `reidabook/golf-practice`
- **DB connection:** Transaction pooler (`aws-X-us-east-1.pooler.supabase.com:6543`) with `prepare: false`

See `ARCHITECTURE.md` for full file-to-feature map.
