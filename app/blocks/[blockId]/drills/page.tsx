import { notFound } from 'next/navigation'
import { getBlock } from '@/lib/queries/blocks'
import { getBlockDrills } from '@/lib/queries/drill-logs'
import { BlockDrillListClient } from '@/components/block-drill-list-client'

interface Props {
  params: Promise<{ blockId: string }>
}

export default async function BlockDrillsPage({ params }: Props) {
  const { blockId } = await params
  const [block, drills] = await Promise.all([
    getBlock(blockId),
    getBlockDrills(blockId),
  ])

  if (!block) notFound()

  return <BlockDrillListClient block={block} drills={drills} />
}
