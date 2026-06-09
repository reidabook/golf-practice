import Link from 'next/link'
import { getRounds, getParsForCourse } from '@/lib/queries/rounds'
import { calcSummary, calcAggregate, CHARLIE_YATES } from '@/lib/round-scoring'

export const dynamic = 'force-dynamic'

function pct(n: number) {
  return `${Math.round(n)}%`
}

function fmt(date: string) {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function PlayPage() {
  const rounds = await getRounds()
  const summaries = rounds.map(r => calcSummary(r.holes, getParsForCourse(r.course)))
  const agg = calcAggregate(summaries)

  return (
    <main className="min-h-screen pb-24 pt-6 px-4 max-w-lg mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Play Mode</h1>
        <p className="text-muted-foreground text-sm">Track your round using The Scoring Method</p>
      </div>

      {/* Start Round */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div>
          <p className="font-semibold">{CHARLIE_YATES.name}</p>
          <p className="text-sm text-muted-foreground">
            {CHARLIE_YATES.pars.length} holes · Par {CHARLIE_YATES.pars.reduce((a, b) => a + b, 0)} · Scoring Zone: 100 yds
          </p>
        </div>
        <Link
          href="/play/round"
          className="block w-full text-center bg-primary text-primary-foreground rounded-lg py-3 font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          Start Round
        </Link>
      </div>

      {/* Aggregated stats */}
      {agg.rounds > 0 && (
        <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
          <div className="px-5 py-3 flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">All-Time Stats</p>
            <p className="text-xs text-muted-foreground">{agg.rounds} round{agg.rounds > 1 ? 's' : ''}</p>
          </div>
          <div className="grid grid-cols-2 divide-x divide-border">
            <div className="px-5 py-4 space-y-0.5">
              <p className="text-xs text-muted-foreground">ESZ in Regulation</p>
              <p className="text-2xl font-bold">{pct(agg.avgESZPct)}</p>
              <p className="text-xs text-muted-foreground">avg per round</p>
            </div>
            <div className="px-5 py-4 space-y-0.5">
              <p className="text-xs text-muted-foreground">Down from SZ</p>
              <p className="text-2xl font-bold">{pct(agg.avgSZDownPct)}</p>
              <p className="text-xs text-muted-foreground">avg per round</p>
            </div>
          </div>
          <div className="grid grid-cols-3 divide-x divide-border">
            <div className="px-4 py-3 space-y-0.5 text-center">
              <p className="text-lg font-semibold">{agg.avgPuttsPerHole.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">putts/hole</p>
            </div>
            <div className="px-4 py-3 space-y-0.5 text-center">
              <p className="text-lg font-semibold">{agg.avgThreePutts.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">3-putts</p>
            </div>
            <div className="px-4 py-3 space-y-0.5 text-center">
              <p className="text-lg font-semibold">{agg.avgMissedShortPutts.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">missed ≤4ft</p>
            </div>
          </div>
        </div>
      )}

      {/* Round history */}
      {rounds.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">Past Rounds</p>
          <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
            {rounds.map((round, i) => {
              const s = summaries[i]
              return (
                <div key={round.id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">{fmt(round.date)}</p>
                    <p className="text-xs text-muted-foreground">{s.totalPutts} putts</p>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>ESZ <strong className="text-foreground">{s.box1}/{s.holes}</strong></span>
                    <span>DSZ <strong className="text-foreground">{s.box2}/{s.holes}</strong></span>
                    <span>3-putts <strong className={s.d >= 2 ? 'text-red-400' : 'text-foreground'}>{s.d}</strong></span>
                    <span>Missed ≤4ft <strong className={s.c >= 2 ? 'text-red-400' : 'text-foreground'}>{s.c}</strong></span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {rounds.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">No rounds saved yet. Start a round above.</p>
      )}
    </main>
  )
}
