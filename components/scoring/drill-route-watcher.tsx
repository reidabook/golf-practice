'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

const STORAGE_KEY = 'drill-active-route'
// /blocks/<id>/drills/<id> (single drill scorer). The drill list is Today (/), which the app opens on anyway.
const DRILL_ROUTE_RE = /^\/blocks\/[^/]+\/drills\/[^/]+$/
// Only restore if the drill was open recently
const MAX_AGE_MS = 3 * 60 * 60 * 1000

interface SavedRoute {
  path: string
  savedAt: number
}

function readSaved(): SavedRoute | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SavedRoute
    return typeof parsed?.path === 'string' && typeof parsed?.savedAt === 'number' ? parsed : null
  } catch {
    return null
  }
}

/**
 * Brings the user back to the drill they were on when iOS kills the home-screen
 * app (e.g. after locking the screen mid-drill).
 *
 * - While on a drill scorer: saves { path, savedAt } to localStorage.
 * - When navigating elsewhere: clears it (deliberate exit = no restore).
 * - On app launch: if the app opens on Home and a drill was open in the last 3h,
 *   navigates straight back to it.
 */
export function DrillRouteWatcher() {
  const pathname = usePathname()
  const router = useRouter()

  // Runs once per app launch (this component lives in the root layout)
  useEffect(() => {
    if (pathname !== '/') return
    const saved = readSaved()
    if (saved && DRILL_ROUTE_RE.test(saved.path) && Date.now() - saved.savedAt < MAX_AGE_MS) {
      router.replace(saved.path)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (DRILL_ROUTE_RE.test(pathname)) {
      const save = () =>
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ path: pathname, savedAt: Date.now() }))
      save()
      // Refresh the timestamp whenever the app is hidden (screen lock, app switch)
      const onHide = () => { if (document.visibilityState === 'hidden') save() }
      document.addEventListener('visibilitychange', onHide)
      return () => document.removeEventListener('visibilitychange', onHide)
    }
    // On launch the restore effect above reads the key before this clears it
    localStorage.removeItem(STORAGE_KEY)
  }, [pathname])

  return null
}
