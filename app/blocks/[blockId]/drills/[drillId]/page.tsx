import { notFound } from 'next/navigation'
import { getBlock } from '@/lib/queries/blocks'
import { getBlockDrills } from '@/lib/queries/drill-logs'
import { DrillScoringClient } from '@/components/drill-scoring-client'

interface Props {
  params: Promise<{ blockId: string; drillId: string }>
}

export default async function DrillScoringPage({ params }: Props) {
  const { blockId, drillId } = await params
  const [block, drills] = await Promise.all([
    getBlock(blockId),
    getBlockDrills(blockId),
  ])

  if (!block) notFound()

  const drillItem = drills.find((d) => d.drill.id === drillId)
  if (!drillItem) notFound()

  return <DrillScoringClient block={block} drillItem={drillItem} blockId={blockId} />
}
