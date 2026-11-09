export const dynamic = 'force-dynamic'

import { getDrills } from '@/lib/queries/drills'
import { getTemplates } from '@/lib/queries/templates'
import { getActiveBlock } from '@/lib/queries/blocks'
import { LibraryClient } from '@/components/library/library-client'

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams
  const [drills, templates, active] = await Promise.all([getDrills(), getTemplates(), getActiveBlock()])
  const activeBlock = active ? { name: active.block.name, template_id: active.block.template_id } : null

  return <LibraryClient drills={drills} templates={templates} activeBlock={activeBlock} initialTab={tab} />
}
