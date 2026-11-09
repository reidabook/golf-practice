# Library Tab (`/library`)

> **For Claude:** Read this file before making any changes to the Library screen. Every feature listed here must still work after your edits.

Segmented control **Drills · Blocks · Guides**. The tab is in the URL (`?tab=blocks`, `?tab=guides`; Drills has no param). `/drills` redirects here; `/plan` redirects to `?tab=guides`.

Header action changes with the tab: **New drill** (Drills), **New block** (Blocks), none (Guides).

---

## Drills

- One row per drill: name, unit, "↑ Higher is better" / "↓ Lower is better"
- Tap a row to expand it:
  - **Log a score outside a block** — score (required), date (defaults to today), notes (optional) → **Log score**. Toast "Logged X unit". Appears in Progress only (`block_id` empty)
  - **Edit drill** — opens the drill form (bottom sheet)
  - **Delete** — confirmation; blocked with an error toast if the drill has recorded scores
- Empty state with what to do

### Drill form (bottom sheet, `components/library/drill-form.tsx`)
- Name, description, instructions (multi-line; lines starting `- ` show as numbered steps on the scorer), scoring direction toggle, min score (default 0), max score (optional), unit
- Toast on save

## Blocks (templates)

- One row per template: name, "N sessions · M drills", **Start** button
  - The running block's template shows a **Running** tag instead of Start
  - One block runs at a time: Start while another is running asks "End *[current]* and start *[new]*?" (`components/library/start-block-button.tsx`); confirming ends the current block early and starts the new one (`startBlock` ends any active block server-side)
- Tap the name to expand: description, numbered drill list, **Edit block**, **Delete** (confirmation; past blocks stay in Progress)

### Template form (bottom sheet, `components/library/template-form.tsx`)
- Name (required), description, number of sessions (1–52)
- Drill selector: selected drills (drag to reorder, remove) + available drills (add)

## Guides

Hardcoded coaching content from `lib/plan-content.ts` (`components/library/guides.tsx`):
- **Current focus** — ranked list, top 3 with "Show all 8"
- **Sessions** — Range session (open by default, 3 phases) and Pre-round warmup (numbered steps), collapsible
- **Drill reference** — collapsible rows: what it trains, numbered steps, flag-marked checkpoint; "Home" tag for home-only drills

The daily home routine checklist lives on Today, not here.
