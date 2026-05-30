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
    return (
      <Card>
        <CardContent className="h-32 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No data yet</p>
        </CardContent>
      </Card>
    )
  }

  const regression = linearRegression(dataPoints.map((dp) => dp.score))

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
                stroke="hsl(0 0% 40%)"
                strokeDasharray="4 2"
                label={{ value: '│', fontSize: 10, fill: 'hsl(0 0% 40%)' }}
              />
            ))}

            {/* Trend line (linear regression) */}
            {regression && (
              <Line
                type="linear"
                dataKey="trend"
                stroke="hsl(142 71% 45%)"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                strokeOpacity={0.6}
                dot={false}
                activeDot={false}
                legendType="none"
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
