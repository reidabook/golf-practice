import { notFound } from 'next/navigation'
import { getSessionWithDrills } from '@/lib/queries/sessions'
import { DrillEntryClient } from '@/components/drill-entry-client'

export default async function DrillEntryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; drillId: string }>
  searchParams: Promise<{ order?: string; pos?: string; total?: string }>
}) {
  const { id, drillId } = await params
  const sp = await searchParams
  const session = await getSessionWithDrills(id)
  if (!session) notFound()

  // Parse order from query param (comma-separated drill IDs)
  const orderParam = sp.order ?? ''
  const orderedIds = orderParam ? orderParam.split(',') : session.drills.map((d) => d.drill_id)

  // Build ordered drill list
  const drillMap = new Map(session.drills.map((d) => [d.drill_id, d]))
  const orderedDrills = orderedIds
    .map((did) => drillMap.get(did))
    .filter(Boolean) as typeof session.drills

  const currentIndex = orderedDrills.findIndex((d) => d.drill_id === drillId)
  if (currentIndex === -1) notFound()

  const currentSessionDrill = orderedDrills[currentIndex]
  const pos = Number(sp.pos ?? currentIndex + 1)
  const total = Number(sp.total ?? orderedDrills.length)

  return (
    <DrillEntryClient
      session={session}
      sessionDrill={currentSessionDrill}
      orderedDrills={orderedDrills}
      currentIndex={currentIndex}
      pos={pos}
      total={total}
      orderParam={orderedIds.join(',')}
    />
  )
}
