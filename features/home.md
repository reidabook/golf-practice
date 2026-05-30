# Home Tab (`/`)

> **For Claude:** Read this file before making any changes to the Home screen. Every feature listed here must still work after your edits.

---

## Layout (always rendered together)

### Active Blocks section
- Shown only when one or more blocks have `status = 'active'`
- Each active block renders as a card: name, "Started [date]", drill progress bar ("X of Y drills / Z remaining"), today's drill count, "Open Training" button → `/blocks/[blockId]/drills`
- Multiple active blocks stack vertically

### Start a Training Block section
- Always visible regardless of whether blocks are active
- Lists all templates (name, description, target days, Default badge)
- One-click start for any template — creates a new active block and navigates to its drill scoring page
- Empty state with link to `/drills` if no templates exist

## Notes
- Multiple blocks can be active simultaneously; there is no single-active constraint
- `getActiveBlocks()` (plural) is used on this page — not `getActiveBlock()`
