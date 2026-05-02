import { sql } from '@/lib/db'

const GHIN_API_BASE = 'https://api2.ghin.com/api/v1'
const FIREBASE_API_KEY = 'AIzaSyBxgTOAWxiud0HuaE5tN-5NTlzFnrtyz-I'
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36'

async function getFirebaseToken(): Promise<string> {
  const res = await fetch(
    'https://firebaseinstallations.googleapis.com/v1/projects/ghin-mobile-app/installations',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT,
        'x-goog-api-key': FIREBASE_API_KEY,
      },
      body: JSON.stringify({
        appId: '1:884417644529:web:47fb315bc6c70242f72650',
        authVersion: 'FIS_v2',
        fid: 'fg6JfS0U01YmrelthLX9Iz',
        sdkVersion: 'w:0.5.7',
      }),
    }
  )
  if (!res.ok) throw new Error(`Firebase installation failed: ${res.status}`)
  const data = await res.json()
  return data.authToken.token as string
}

async function getGhinHandicapFromLogin(firebaseToken: string): Promise<number> {
  const username = process.env.GHIN_USERNAME
  const password = process.env.GHIN_PASSWORD
  if (!username || !password) throw new Error('GHIN_USERNAME / GHIN_PASSWORD not configured')

  const res = await fetch(`${GHIN_API_BASE}/golfer_login.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': USER_AGENT },
    body: JSON.stringify({
      token: firebaseToken,
      user: { email_or_ghin: username, password },
    }),
  })
  if (!res.ok) throw new Error(`GHIN login failed: ${res.status}`)
  const data = await res.json()

  // Single log to avoid Vercel per-request log truncation
  console.log('[ghin-sync] login response:', JSON.stringify(data).slice(0, 2000))

  // The login response contains the golfer's own profile — extract handicap directly
  const golferUser = data.golfer_user
  const golfers: any[] = golferUser?.golfers ?? []
  const golfer = golfers[0] ?? golferUser

  const handicap =
    golfer?.handicap_index ??
    golfer?.hi ??
    golfer?.HandicapIndex ??
    golfer?.Handicap_Index ??
    golfer?.handicap ??
    golfer?.index_val
  if (handicap == null) throw new Error('Handicap index not found in login response')
  return Number(handicap)
}

/**
 * Fetches the current GHIN handicap index and stores it as today's snapshot.
 * Skips silently if credentials aren't configured or a snapshot already exists today.
 * Returns { ok: false, error } if credentials are configured but sync fails.
 */
export async function syncHandicapToday(): Promise<{ ok: boolean; error?: string }> {
  const ghinNumberStr = process.env.GHIN_NUMBER
  if (!ghinNumberStr || !process.env.GHIN_USERNAME || !process.env.GHIN_PASSWORD) {
    return { ok: true }
  }

  try {
    const today = new Date().toISOString().split('T')[0]

    // Skip if we already have today's snapshot
    const existing = await sql`
      SELECT 1 FROM handicap_snapshots WHERE snapshot_date = ${today} LIMIT 1
    `
    if (existing.length > 0) return { ok: true }

    const firebaseToken = await getFirebaseToken()
    const handicapIndex = await getGhinHandicapFromLogin(firebaseToken)

    await sql`
      INSERT INTO handicap_snapshots (snapshot_date, handicap_index)
      VALUES (${today}, ${handicapIndex})
      ON CONFLICT (snapshot_date) DO UPDATE SET handicap_index = EXCLUDED.handicap_index
    `
    return { ok: true }
  } catch (err) {
    console.error('[ghin-sync] Failed to sync handicap:', err)
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
