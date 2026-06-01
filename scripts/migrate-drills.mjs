/**
 * migrate-drills.mjs
 *
 * Exports the drills table from Supabase and imports it into a new
 * "drills" tab in your Google Sheet.
 *
 * Run with:
 *   node --env-file=.env.local scripts/migrate-drills.mjs
 */

import postgres from 'postgres'
import { GoogleSpreadsheet } from 'google-spreadsheet'
import { JWT } from 'google-auth-library'

// ─── Connect ───────────────────────────────────────────────────────────────────

const sql = postgres(process.env.DATABASE_URL, { prepare: false, ssl: 'require' })

const auth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})
const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID, auth)
await doc.loadInfo()

// ─── Fetch drills from Supabase ────────────────────────────────────────────────

console.log('Fetching drills from Supabase...')
const drills = await sql`SELECT * FROM drills ORDER BY name`
console.log(`Found ${drills.length} drills`)

// ─── Create or clear the drills tab ───────────────────────────────────────────

const HEADERS = ['id', 'name', 'description', 'instructions', 'scoring_direction',
                 'max_score', 'min_score', 'unit', 'is_default', 'category', 'source', 'created_at']

let sheet = doc.sheetsByTitle['drills']
if (sheet) {
  console.log('drills tab already exists — clearing it first...')
  await sheet.clear()
  await sheet.setHeaderRow(HEADERS)
} else {
  console.log('Creating drills tab...')
  sheet = await doc.addSheet({ title: 'drills', headerValues: HEADERS })
}

// ─── Write rows ────────────────────────────────────────────────────────────────

console.log('Writing rows to sheet...')
const rows = drills.map(d => ({
  id:                String(d.id),
  name:              String(d.name),
  description:       String(d.description),
  instructions:      String(d.instructions),
  scoring_direction: String(d.scoring_direction),
  max_score:         d.max_score === null ? '' : String(d.max_score),
  min_score:         String(d.min_score),
  unit:              String(d.unit),
  is_default:        String(d.is_default),
  category:          d.category === null ? '' : String(d.category),
  source:            d.source === null ? '' : String(d.source),
  created_at:        String(d.created_at),
}))

await sheet.addRows(rows)
console.log(`✅ Done — ${rows.length} drills written to the "drills" tab`)

await sql.end()
