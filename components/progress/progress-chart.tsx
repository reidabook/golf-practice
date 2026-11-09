'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import type { DrillProgress } from '@/lib/types'

interface ProgressChartProps {
  progress: DrillProgress
}

function linearRegression(scores: number[]): { slope: number; intercept: number } | null {
  const n = scores.length
  if (n < 2) return null
  const sumX = (n * (n - 1)) / 2
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6
  const sumY = scores.reduce((a, b) => a + b, 0)
  const sumXY = scores.reduce((acc, y, i) => acc + i * y, 0)
  const denom = n * sumX2 - sumX * sumX
  if (denom === 0) return null
  const slope = (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n
  return { slope, intercept }
}

export function ProgressChart({ progress }: ProgressChartProps) {
  const { drill, dataPoints, blockBoundaries } = progress

  if (dataPoints.length < 1) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No scores yet</p>
  }

  const regression = linearRegression(dataPoints.map((dp) => dp.score))
  // Trend line is fairway when the drill is improving, stripe when it's getting worse
  const improving = regression
    ? drill.scoring_direction === 'higher_better' ? regression.slope >= 0 : regression.slope <= 0
    : true
  const trendColor = improving ? 'hsl(var(--fairway))' : 'hsl(var(--stripe))'

  const chartData = dataPoints.map((dp, i) => {
    const [, month, day] = dp.date.split('-')
    return {
      name: `${parseInt(month)}/${parseInt(day)}`,
      score: dp.score,
      trend: regression ? Math.round((regression.slope * i + regression.intercept) * 10) / 10 : undefined,
      date: dp.date,
      blockName: dp.blockName,
      source: dp.source,
      fullLabel: `${dp.blockName} — ${dp.date}`,
    }
  })

  const boundaryIndices = new Set(
    blockBoundaries
      .slice(1) // first block has no boundary marker needed
      .map((bb) => {
        const idx = dataPoints.findIndex((dp) => dp.blockId === bb.blockId)
        return idx >= 0 ? chartData[idx]?.name : null
      })
      .filter(Boolean)
  )

  const renderDot = (props: any) => {
    const { cx, cy } = props
    return (
      <circle
        key={`dot-${cx}-${cy}`}
        cx={cx}
        cy={cy}
        r={3}
        fill="hsl(var(--ink))"
        stroke="hsl(var(--card))"
        strokeWidth={1.5}
      />
    )
  }

  return (
    <div className="pt-2">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: 'hsl(var(--rough))', fontFamily: 'var(--font-display)' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'hsl(var(--rough))', fontFamily: 'var(--font-display)' }}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--ink))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
                fontFamily: 'var(--font-body)',
                fontSize: 12,
              }}
              formatter={(val: number, key: string) => {
                if (key === 'trend') return []
                return [`${val} ${drill.unit}`, 'Score' as string]
              }}
              labelFormatter={(label, payload) => {
                const item = payload?.[0]?.payload
                return item ? item.fullLabel : label
              }}
            />

            {/* Block boundary lines */}
            {Array.from(boundaryIndices).map((name) => (
              <ReferenceLine
                key={name as string}
                x={name as string}
                stroke="hsl(var(--rough))"
                strokeDasharray="4 2"
                label={{ value: '│', fontSize: 10, fill: 'hsl(var(--rough))' }}
              />
            ))}

            {/* Trend line (linear regression) */}
            {regression && (
              <Line isAnimationActive={false}
                type="linear"
                dataKey="trend"
                stroke={trendColor}
                strokeWidth={2.5}
                strokeDasharray="6 4"
                dot={false}
                activeDot={false}
                legendType="none"
              />
            )}

            <Line isAnimationActive={false}
              type="linear"
              dataKey="score"
              stroke="hsl(var(--rough))"
              strokeWidth={1.5}
              dot={renderDot}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
    </div>
  )
}
