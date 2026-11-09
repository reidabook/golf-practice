'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function SwRegister() {
  const router = useRouter()

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    // Dev chunk URLs aren't content-hashed, so a cache-first service worker serves stale
    // code after changes ("Cannot read properties of undefined (reading 'call')").
    // In development, remove any registered worker and its caches instead.
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        if (regs.length === 0) return
        Promise.all([
          ...regs.map((r) => r.unregister()),
          caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))),
        ]).then(() => window.location.reload())
      })
      return
    }

    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => console.warn('SW registration failed:', err))

    // The service worker may have served a cached page on launch —
    // fetch fresh data so the screen catches up within a second.
    if (navigator.serviceWorker.controller) router.refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
