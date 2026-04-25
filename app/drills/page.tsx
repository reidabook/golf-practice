import { getDrills } from '@/lib/queries/drills'
import { getTemplates } from '@/lib/queries/templates'
import { DrillsPageClient } from '@/components/drills-page-client'

export default async function DrillsPage() {
  const [drills, templates] = await Promise.all([getDrills(), getTemplates()])

  return <DrillsPageClient drills={drills} templates={templates} />
}
