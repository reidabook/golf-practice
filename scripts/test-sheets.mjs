/**
 * test-sheets.mjs
 *
 * Compares data between your Supabase database and Google Sheet.
 * Checks row counts, IDs, and key field values for every table.
 *
 * Run with:
 *   node --env-file=.env.local scripts/test-sheets.mjs
 */

import postgres from 'postgres'
import { GoogleSpreadsheet } from 'google-spreadsheet'
import { JWT } from 'google-auth-library'

// ─── Setup ─────────────────────────────────────────────────────────────────────

const sql = postgres(process.env.DATABASE_URL, { prepare: false, ssl: 'require' })

const auth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})
const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID, auth)
await doc.loadInfo()

function toObj(row) {
  const obj = {}
  for (const key of row._worksheet.headerValues) {
    obj[key] = row.get(key) ?? ''
  }
  return obj
}

// Tab name map: internal name → actual Google Sheet tab name
const TAB_NAMES = {
  drills:                  'drills',
  block_templates:         'block-templates',
  block_template_drills:   'block-template-drills',
  training_blocks:         'training-blocks',
  drill_logs:              'drill-logs',
  handicap_snapshots:      'handicap-snapshots',
}

async function sheetRows(name) {
  const tabName = TAB_NAMES[name] ?? name
  const sheet = doc.sheetsByTitle[tabName]
  if (!sheet) throw new Error(`Sheet tab "${tabName}" not found — check your Google Sheet has this tab`)
  return (await sheet.getRows()).map(toObj)
}

// ─── Test runner ───────────────────────────────────────────────────────────────

let passed = 0
let failed = 0

function check(label, actual, expected, hint = '') {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (ok) {
    console.log(`  ✅  ${label}`)
    passed++
  } else {
    console.log(`  ❌  ${label}`)
    console.log(`      Expected: ${JSON.stringify(expected)}`)
    console.log(`      Actual:   ${JSON.stringify(actual)}`)
    if (hint) console.log(`      Hint: ${hint}`)
    failed++
  }
}

function checkCount(table, sheetCount, dbCount) {
  check(
    `${table}: row count (sheet=${sheetCount}, db=${dbCount})`,
    sheetCount,
    dbCount,
    `Sheet has ${sheetCount} rows, Supabase has ${dbCount}. Missing or extra rows.`
  )
}

function checkIds(table, sheetIds, dbIds) {
  const missingFromSheet = dbIds.filter(id => !sheetIds.includes(id))
  const extraInSheet = sheetIds.filter(id => !dbIds.includes(id))
  if (missingFromSheet.length === 0 && extraInSheet.length === 0) {
    console.log(`  ✅  ${table}: all IDs match`)
    passed++
  } else {
    console.log(`  ❌  ${table}: ID mismatch`)
    if (missingFromSheet.length) console.log(`      In Supabase but NOT in sheet: ${missingFromSheet.slice(0, 5).join(', ')}`)
    if (extraInSheet.length) console.log(`      In sheet but NOT in Supabase: ${extraInSheet.slice(0, 5).join(', ')}`)
    failed++
  }
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

console.log('\n🏌️  Golf Practice — Supabase vs Google Sheets comparison\n')

// Print available sheet tab names
console.log('📄 Sheet tabs found:', Object.keys(doc.sheetsByTitle).join(', '))
console.log()

// ── drills ──────────────────────────────────────────────────────────────────

console.log('📋 drills')
const dbDrills = await sql`SELECT * FROM drills ORDER BY name`
const sheetDrills = await sheetRows('drills')

checkCount('drills', sheetDrills.length, dbDrills.length)
checkIds('drills',
  sheetDrills.map(r => r.id),
  dbDrills.map(r => r.id)
)

// Spot-check a few fields on each drill
for (const dbRow of dbDrills) {
  const sheetRow = sheetDrills.find(r => r.id === dbRow.id)
  if (!sheetRow) continue // already caught by ID check
  check(
    `drills[${dbRow.name}] name`,
    sheetRow.name,
    dbRow.name
  )
  check(
    `drills[${dbRow.name}] scoring_direction`,
    sheetRow.scoring_direction,
    dbRow.scoring_direction
  )
  check(
    `drills[${dbRow.name}] unit`,
    sheetRow.unit,
    dbRow.unit
  )
  check(
    `drills[${dbRow.name}] is_default`,
    sheetRow.is_default,
    String(dbRow.is_default)
  )
  check(
    `drills[${dbRow.name}] min_score`,
    sheetRow.min_score,
    String(dbRow.min_score)
  )
  check(
    `drills[${dbRow.name}] max_score`,
    sheetRow.max_score,
    dbRow.max_score === null ? '' : String(dbRow.max_score)
  )
}

// ── block_templates ──────────────────────────────────────────────────────────

console.log('\n📋 block_templates')
const dbTemplates = await sql`SELECT * FROM block_templates ORDER BY name`
const sheetTemplates = await sheetRows('block_templates')

checkCount('block_templates', sheetTemplates.length, dbTemplates.length)
checkIds('block_templates',
  sheetTemplates.map(r => r.id),
  dbTemplates.map(r => r.id)
)

for (const dbRow of dbTemplates) {
  const sheetRow = sheetTemplates.find(r => r.id === dbRow.id)
  if (!sheetRow) continue
  check(`block_templates[${dbRow.name}] name`, sheetRow.name, dbRow.name)
  check(`block_templates[${dbRow.name}] target_sessions`, sheetRow.target_sessions, String(dbRow.target_sessions))
  check(`block_templates[${dbRow.name}] is_default`, sheetRow.is_default, String(dbRow.is_default))
  check(
    `block_templates[${dbRow.name}] description`,
    sheetRow.description,
    dbRow.description === null ? '' : dbRow.description
  )
}

// ── block_template_drills ────────────────────────────────────────────────────

console.log('\n📋 block_template_drills')
const dbBtd = await sql`SELECT * FROM block_template_drills ORDER BY template_id, sort_order`
const sheetBtd = await sheetRows('block_template_drills')

checkCount('block_template_drills', sheetBtd.length, dbBtd.length)
checkIds('block_template_drills',
  sheetBtd.map(r => r.id),
  dbBtd.map(r => r.id)
)

for (const dbRow of dbBtd) {
  const sheetRow = sheetBtd.find(r => r.id === dbRow.id)
  if (!sheetRow) continue
  check(`block_template_drills[${dbRow.id.slice(0,8)}] template_id`, sheetRow.template_id, dbRow.template_id)
  check(`block_template_drills[${dbRow.id.slice(0,8)}] drill_id`, sheetRow.drill_id, dbRow.drill_id)
  check(`block_template_drills[${dbRow.id.slice(0,8)}] sort_order`, sheetRow.sort_order, String(dbRow.sort_order))
}

// ── training_blocks ──────────────────────────────────────────────────────────

console.log('\n📋 training_blocks')
const dbBlocks = await sql`SELECT * FROM training_blocks ORDER BY started_at`
const sheetBlocks = await sheetRows('training_blocks')

checkCount('training_blocks', sheetBlocks.length, dbBlocks.length)
checkIds('training_blocks',
  sheetBlocks.map(r => r.id),
  dbBlocks.map(r => r.id)
)

for (const dbRow of dbBlocks) {
  const sheetRow = sheetBlocks.find(r => r.id === dbRow.id)
  if (!sheetRow) continue
  check(`training_blocks[${dbRow.name}] name`, sheetRow.name, dbRow.name)
  check(`training_blocks[${dbRow.name}] status`, sheetRow.status, dbRow.status)
  check(`training_blocks[${dbRow.name}] target_sessions`, sheetRow.target_sessions, String(dbRow.target_sessions))
  check(
    `training_blocks[${dbRow.name}] template_id`,
    sheetRow.template_id,
    dbRow.template_id === null ? '' : dbRow.template_id
  )
  check(
    `training_blocks[${dbRow.name}] completed_at`,
    sheetRow.completed_at,
    dbRow.completed_at === null ? '' : dbRow.completed_at
  )
}

// ── drill_logs ───────────────────────────────────────────────────────────────

console.log('\n📋 drill_logs')
const dbLogs = await sql`SELECT * FROM drill_logs ORDER BY created_at`
const sheetLogs = await sheetRows('drill_logs')

checkCount('drill_logs', sheetLogs.length, dbLogs.length)
checkIds('drill_logs',
  sheetLogs.map(r => r.id),
  dbLogs.map(r => r.id)
)

// Spot-check first 10 logs
for (const dbRow of dbLogs.slice(0, 10)) {
  const sheetRow = sheetLogs.find(r => r.id === dbRow.id)
  if (!sheetRow) continue
  check(`drill_logs[${dbRow.id.slice(0,8)}] block_id`, sheetRow.block_id, dbRow.block_id)
  check(`drill_logs[${dbRow.id.slice(0,8)}] drill_id`, sheetRow.drill_id, dbRow.drill_id)
  check(`drill_logs[${dbRow.id.slice(0,8)}] skipped`, sheetRow.skipped, String(dbRow.skipped))
  check(
    `drill_logs[${dbRow.id.slice(0,8)}] score`,
    sheetRow.score,
    dbRow.score === null ? '' : String(dbRow.score)
  )
  check(
    `drill_logs[${dbRow.id.slice(0,8)}] log_date`,
    sheetRow.log_date,
    String(dbRow.log_date).split('T')[0]  // normalize to YYYY-MM-DD
  )
}

// ── handicap_snapshots ───────────────────────────────────────────────────────

console.log('\n📋 handicap_snapshots')
try {
  const dbHandicap = await sql`SELECT * FROM handicap_snapshots ORDER BY snapshot_date`
  const sheetHandicap = await sheetRows('handicap_snapshots')

  checkCount('handicap_snapshots', sheetHandicap.length, dbHandicap.length)
  checkIds('handicap_snapshots',
    sheetHandicap.map(r => r.id),
    dbHandicap.map(r => String(r.id))
  )

  for (const dbRow of dbHandicap.slice(0, 5)) {
    const sheetRow = sheetHandicap.find(r => r.id === String(dbRow.id))
    if (!sheetRow) continue
    check(
      `handicap_snapshots[${dbRow.snapshot_date}] handicap_index`,
      sheetRow.handicap_index,
      String(dbRow.handicap_index)
    )
  }
} catch {
  console.log('  ⚠️   handicap_snapshots: table or sheet tab not found — skipping')
}

// ─── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`)
console.log(`Results: ${passed} passed, ${failed} failed`)
if (failed === 0) {
  console.log('🎉 All checks passed — Google Sheet matches Supabase!')
} else {
  console.log('⚠️  Some checks failed — review the output above before cutting over.')
}
console.log()

await sql.end()
