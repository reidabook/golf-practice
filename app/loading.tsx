import { Skeleton } from '@/components/ui/skeleton'

// Mirrors the screen header + row-list layout so tabs don't jump when data arrives
export default function Loading() {
  return (
    <div className="px-4 pt-[max(1.5rem,env(safe-area-inset-top))]" aria-busy="true" aria-label="Loading">
      <Skeleton className="mb-2 h-3 w-20" />
      <Skeleton className="mb-6 h-7 w-56" />
      <Skeleton className="mb-2 h-3 w-16" />
      <div className="divide-y overflow-hidden rounded-lg border bg-card">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2.5 px-4 py-3.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-8 w-64" />
          </div>
        ))}
      </div>
    </div>
  )
}
