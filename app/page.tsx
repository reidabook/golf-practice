export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getActiveBlock } from '@/lib/queries/blocks'
import { getBlockDrills } from '@/lib/queries/drill-logs'
import { getTemplates } from '@/lib/queries/templates'
import { today } from '@/lib/sheets'
import { PageHeader, SectionLabel } from '@/components/ui/page'
import { TodayClient } from '@/components/today/today-client'
import { HomeRoutine } from '@/components/today/home-routine'
import { StartBlockButton } from '@/components/library/start-block-button'

function dateLabel(iso: string) {
  const d = new Date(`${iso}T12:00:00`)
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default async function TodayPage() {
  const active = await getActiveBlock()
  const label = dateLabel(today())

  if (active) {
    const drills = await getBlockDrills(active.block.id)
    return <TodayClient block={active.block} drills={drills} dateLabel={label} />
  }

  const templates = await getTemplates()
  return (
    <div>
      <PageHeader eyebrow={label} title="No block running" subtitle="Pick a block to start. Its drills show here each day." />
      <div className="space-y-7 px-4">
        {templates.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            You don&apos;t have any blocks yet.{' '}
            <Link href="/library?tab=blocks" className="font-bold text-fairway underline underline-offset-4">Make one in Library</Link>
          </p>
        ) : (
          <section>
            <SectionLabel>Blocks</SectionLabel>
            <div className="divide-y overflow-hidden rounded-lg border bg-card">
              {templates.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{t.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {t.target_sessions} sessions · {t.drills?.length ?? 0} drills
                    </p>
                  </div>
                  <StartBlockButton templateId={t.id} templateName={t.name} activeBlockName={null} />
                </div>
              ))}
            </div>
            <Link href="/library?tab=blocks" className="mt-2 block px-1 text-right text-sm font-bold text-fairway">
              Manage blocks
            </Link>
          </section>
        )}
        <HomeRoutine />
      </div>
    </div>
  )
}
