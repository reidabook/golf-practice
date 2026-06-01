import { NextResponse } from 'next/server'
import { GoogleSpreadsheet } from 'google-spreadsheet'
import { JWT } from 'google-auth-library'

export async function GET() {
  const results: Record<string, unknown> = {}

  results.env = {
    GOOGLE_SERVICE_ACCOUNT_EMAIL: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY,
    GOOGLE_SPREADSHEET_ID: !!process.env.GOOGLE_SPREADSHEET_ID,
  }

  try {
    const auth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
      key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID!, auth)
    await doc.loadInfo()

    results.connection = 'ok'
    results.spreadsheet_title = doc.title
    results.tabs = Object.keys(doc.sheetsByTitle)

    // Check drills tab row count using the same connection
    const drillsSheet = doc.sheetsByTitle['drills']
    if (!drillsSheet) {
      results.drills_tab = 'not found'
    } else {
      const rows = await drillsSheet.getRows()
      results.drills_tab = `ok — ${rows.length} rows`
    }
  } catch (err) {
    results.connection = 'failed'
    results.error = err instanceof Error ? err.message : String(err)
  }

  return NextResponse.json(results)
}
