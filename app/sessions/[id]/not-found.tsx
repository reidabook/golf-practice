import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
      <p className="text-4xl mb-4">⛳</p>
      <h2 className="text-xl font-semibold mb-2">Session not found</h2>
      <p className="text-muted-foreground text-sm mb-6">
        This session doesn&apos;t exist or was deleted.
      </p>
      <Button asChild>
        <Link href="/">Back to Home</Link>
      </Button>
    </div>
  )
}
