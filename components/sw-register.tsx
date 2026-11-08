'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function SwRegister() {
  const router = useRouter()

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
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
