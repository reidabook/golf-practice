'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col justify-center px-6">
      <p className="label mb-2 text-stripe">Couldn&apos;t load this screen</p>
      <h2 className="screen-title mb-2">The practice sheet didn&apos;t respond</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Check your connection and try again. If it keeps happening, the error was: {error.message}
      </p>
      <Button onClick={reset} size="lg">Try again</Button>
    </div>
  )
}
