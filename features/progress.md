# Progress Tab (`/progress`)

> **For Claude:** Read this file before making any changes to the Progress screen. Every feature listed here must still work after your edits.

---

## Charts

- One line chart per drill showing score history over time
- X-axis: dates (M/D format)
- Y-axis: auto-scaled to data range
- Interactive tooltips: full date (YYYY-MM-DD), block name, score value
- Green data points for each log entry

## Trend Line

- Linear regression line overlaid on each chart
- Calculated from all historical scores for that drill
- Shows overall direction regardless of recency

## Labels

- Scoring direction label per chart: "↑ higher is better" or "↓ lower is better"
- Unit displayed below drill name

## Empty State

- Shown when a drill has no logged scores yet
