import { notFound } from 'next/navigation'
import { getSessionWithDrills } from '@/lib/queries/sessions'
import { SessionOverviewClient } from '@/components/session-overview-client'

export default async function SessionOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getSessionWithDrills(id)
  if (!session) notFound()

  return <SessionOverviewClient session={session} />
}
