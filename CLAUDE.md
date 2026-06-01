# Golf Practice App — Claude Instructions

## Stack
- **Framework:** Next.js 15 App Router — server components by default, `'use client'` only for interactivity
- **Data layer:** Google Sheets via `google-spreadsheet` + `google-auth-library`. Connection: JWT service account auth. See `lib/sheets.ts`.
- **Deployment:** Vercel, auto-deploys `main` branch of `reidabook/golf-practice`
- See `ARCHITECTURE.md` for routes, sheet tabs, and component map. See `features/` for feature specs.

## MANDATORY: Before any data schema change
1. Note which Google Sheet tab is affected.
2. Show the user exactly what column changes are needed in the sheet and in the code before making them.
3. Get explicit confirmation before editing any data files.
4. Never delete rows or tabs without confirmation — there are no automatic backups.

## MANDATORY: Before any app change
1. Read `FEATURES.md` index, then relevant `features/*.md` file(s), and `features/shared.md`.
2. After changes, verify all touched features still work as described.
3. Call out any feature removal/alteration explicitly before proceeding.
4. Update the relevant `features/*.md` as part of the same commit.
