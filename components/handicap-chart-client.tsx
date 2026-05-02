'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import type { HandicapSnapshot } from '@/lib/types'

const HandicapChart = dynamic(
  () => import('@/components/handicap-chart').then((m) => m.HandicapChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-48 w-full" />,
  }
)

export function HandicapChartClient({ snapshots }: { snapshots: HandicapSnapshot[] }) {
  return <HandicapChart snapshots={snapshots} />
}
