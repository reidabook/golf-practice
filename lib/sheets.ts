import { GoogleSpreadsheet, type GoogleSpreadsheetRow } from 'google-spreadsheet'
import { JWT } from 'google-auth-library'

// ─── Tab name map (sheet uses hyphens, code uses underscores) ──────────────────
export const TABS = {
  drills:                'drills',
  block_templates:       'block-templates',
  block_template_drills: 'block-template-drills',
  training_blocks:       'training-blocks',
  drill_logs:            'drill-logs',
  handicap_snapshots:    'handicap-snapshots',
}

// ─── Connection ────────────────────────────────────────────────────────────────

const globalForSheets = globalThis as unknown as { _sheetsDoc: GoogleSpreadsheet | null }

async function getDoc(): Promise<GoogleSpreadsheet> {
  if (globalForSheets._sheetsDoc) return globalForSheets._sheetsDoc

  const auth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
    key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREADSHEET_ID!, auth)
  await doc.loadInfo()

  if (process.env.NODE_ENV !== 'production') {
    globalForSheets._sheetsDoc = doc
  }

  return doc
}

export async function getSheet(tabKey: keyof typeof TABS) {
  const doc = await getDoc()
  const name = TABS[tabKey]
  const sheet = doc.sheetsByTitle[name]
  if (!sheet) throw new Error(`Sheet tab "${name}" not found.`)
  return sheet
}

export async function getRows(tabKey: keyof typeof TABS): Promise<GoogleSpreadsheetRow[]> {
  const sheet = await getSheet(tabKey)
  return sheet.getRows()
}

// ─── Row → plain object ────────────────────────────────────────────────────────
export function toObj(row: GoogleSpreadsheetRow): Record<string, string> {
  const obj: Record<string, string> = {}
  for (const key of (row as any)._worksheet.headerValues as string[]) {
    obj[key] = row.get(key) ?? ''
  }
  return obj
}

// ─── Type helpers ──────────────────────────────────────────────────────────────
export const nullStr  = (v: string) => v === '' ? null : v
export const nullNum  = (v: string) => v === '' ? null : Number(v)
export const parseBool = (v: string) => v === 'true'
export const today    = () => new Date().toISOString().split('T')[0]
export const nowISO   = () => new Date().toISOString()
export const newId    = () => crypto.randomUUID()
