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
import { Card, CardContent } from '@/components/ui/card'

interface ProgressChartProps {
  progress: DrillProgress
}

export function ProgressChart({ progress }: ProgressChartProps) {
  const { drill, dataPoints, personalBest, blockBoundaries } = progress

  if (dataPoints.length < 1) {
    return (
      <Card>
        <CardContent className="h-32 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No data yet</p>
        </CardContent>
      </Card>
    )
  }

  const chartData = dataPoints.map((dp, i) => ({
    name: dp.source === 'standalone'
      ? `L${i + 1}`
      : `S${dp.sessionNumber}`,
    score: dp.score,
    date: dp.date,
    blockName: dp.blockName,
    source: dp.source,
    fullLabel: dp.source === 'standalone'
      ? `Standalone — ${dp.date}`
      : `${dp.blockName} — Session ${dp.sessionNumber}`,
    index: i,
  }))

  const boundaryIndices = new Set(
    blockBoundaries
      .slice(1) // first block has no boundary marker needed
      .map((bb) => {
        const idx = dataPoints.findIndex((dp) => dp.blockId === bb.blockId)
        return idx >= 0 ? chartData[idx]?.name : null
      })
      .filter(Boolean)
  )

  // Custom dot renderer to differentiate session vs standalone points
  const renderDot = (props: any) => {
    const { cx, cy, payload } = props
    if (payload.source === 'standalone') {
      // Hollow circle for standalone logs
      return (
        <circle
          key={`dot-${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r={4}
          fill="hsl(0 0% 7%)"
          stroke="hsl(142 71% 45%)"
          strokeWidth={2}
        />
      )
    }
    // Filled circle for session scores
    return (
      <circle
        key={`dot-${cx}-${cy}`}
        cx={cx}
        cy={cy}
        r={3}
        fill="hsl(142 71% 45%)"
        stroke="none"
      />
    )
  }

  return (
    <Card>
      <CardContent className="pt-4 pb-2">
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 18%)" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: 'hsl(0 0% 64%)' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'hsl(0 0% 64%)' }}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(0 0% 7%)',
                border: '1px solid hsl(0 0% 18%)',
                borderRadius: '0.5rem',
                fontSize: 12,
              }}
              formatter={(val: number) => [`${val} ${drill.unit}`, 'Score']}
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
                stroke="hsl(0 0% 40%)"
                strokeDasharray="4 2"
                label={{ value: '│', fontSize: 10, fill: 'hsl(0 0% 40%)' }}
              />
            ))}

            {/* Personal best line */}
            {personalBest !== null && (
              <ReferenceLine
                y={personalBest}
                stroke="hsl(142 71% 45%)"
                strokeDasharray="6 3"
                strokeOpacity={0.6}
              />
            )}

            <Line
              type="monotone"
              dataKey="score"
              stroke="hsl(142 71% 45%)"
              strokeWidth={2}
              dot={renderDot}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
