'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

const STORAGE_KEY = 'drill-active-route'
const SESSION_KEY = 'drill-route-restored'
// Matches /blocks/<id>/drills/<id> — the single-drill scoring screen
const DRILL_ROUTE_RE = /^\/blocks\/[^/]+\/drills\/[^/]+$/

/**
 * Persists the active drill route to localStorage so a PWA that was force-killed
 * by the OS can restore the user to the right drill screen on relaunch.
 *
 * Behaviour:
 * - While on a drill page: saves the pathname to localStorage.
 * - When leaving a drill page: clears the saved route (deliberate exit = no restore).
 * - On first mount of a fresh OS session (sessionStorage is empty): if a saved route
 *   exists and we're not already on it, navigates there via router.replace().
 * - sessionStorage flag prevents the auto-navigate from firing on every in-session
 *   visit to the home page.
 */
export function DrillRouteWatcher() {
  const pathname = usePathname()
  const router = useRouter()

  // Restore saved drill route on fresh app launch (sessionStorage cleared by OS kill)
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return
    sessionStorage.setItem(SESSION_KEY, '1')

    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && saved !== pathname && DRILL_ROUTE_RE.test(saved)) {
      router.replace(saved)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Intentional: runs once on mount only

  // Track route: persist when on drill page, clear when elsewhere
  useEffect(() => {
    if (DRILL_ROUTE_RE.test(pathname)) {
      localStorage.setItem(STORAGE_KEY, pathname)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [pathname])

  return null
}
