# History Tab (`/history`)

> **For Claude:** Read this file before making any changes to the History screen or block detail. Every feature listed here must still work after your edits.

---

## List Screen

- One card per block: name, status badge (Done / Active), start/end dates, target duration
- Empty state when no history
- Clickable to view block detail

## Block Detail (`/history/[blockId]`)

- Breadcrumb navigation back to History
- Block name and date range
- "X of Y days logged" progress

### Block Completion Summary
- Shown only for completed blocks with 2+ days logged
- Per-drill: first vs last score, trend indicator (↑ ↓ → ★), personal best
- Colored trend badge: green (improved), red (declined), yellow (same), blue (first entry)

### Drill Logs
- Grouped by day, newest first
- Per log row: drill name + score + unit, or "Skipped" badge
- Day dividers between groups
