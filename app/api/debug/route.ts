import { NextResponse } from 'next/server'
import { GoogleSpreadsheet } from 'google-spreadsheet'
import { JWT } from 'google-auth-library'

export const dynamic = 'force-dynamic'

async function getDoc() {
  const auth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
    key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID!, auth)
  await doc.loadInfo()
  return doc
}

function toObj(row: any) {
  const obj: Record<string, string> = {}
  for (const key of row._worksheet.headerValues) obj[key] = row.get(key) ?? ''
  return obj
}

export async function GET() {
  const results: Record<string, unknown> = {}
  try {
    const doc = await getDoc()
    results.tabs = Object.keys(doc.sheetsByTitle)

    // Row counts per tab
    const counts: Record<string, number> = {}
    for (const tab of Object.values(doc.sheetsByTitle)) {
      const rows = await tab.getRows()
      counts[tab.title] = rows.length
    }
    results.row_counts = counts

    // Sample first drill_log row to check field values
    const logSheet = doc.sheetsByTitle['drill-logs']
    if (logSheet) {
      const rows = await logSheet.getRows()
      if (rows.length > 0) {
        results.sample_drill_log = toObj(rows[0])
      }
    }

    // Check how many logs pass the "scored" filter
    const logSheet2 = doc.sheetsByTitle['drill-logs']
    if (logSheet2) {
      const rows = await logSheet2.getRows()
      const objs = rows.map(toObj)
      const scored = objs.filter(r => r.skipped?.toLowerCase() === 'false' && r.score !== '')
      results.scored_logs_count = scored.length
      results.skipped_values_sample = [...new Set(objs.slice(0, 20).map(r => r.skipped))]
    }

  } catch (err) {
    results.error = err instanceof Error ? err.message : String(err)
  }

  return NextResponse.json(results)
}
