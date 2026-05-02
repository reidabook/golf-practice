'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { HandicapSnapshot } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'

interface HandicapChartProps {
  snapshots: HandicapSnapshot[]
}

function linearRegression(values: number[]): { slope: number; intercept: number } | null {
  const n = values.length
  if (n < 2) return null
  const sumX = (n * (n - 1)) / 2
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6
  const sumY = values.reduce((a, b) => a + b, 0)
  const sumXY = values.reduce((acc, y, i) => acc + i * y, 0)
  const denom = n * sumX2 - sumX * sumX
  if (denom === 0) return null
  const slope = (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n
  return { slope, intercept }
}

export function HandicapChart({ snapshots }: HandicapChartProps) {
  if (snapshots.length < 1) return null

  const regression = linearRegression(snapshots.map((s) => s.handicap_index))
  // Handicap is lower-is-better: declining trend (slope ≤ 0) = improving = green
  const trendColor =
    regression && regression.slope <= 0
      ? 'hsl(142 71% 45%)'
      : 'hsl(0 84% 60%)'

  const chartData = snapshots.map((s, i) => {
    const [, month, day] = s.snapshot_date.split('-')
    return {
      name: `${parseInt(month)}/${parseInt(day)}`,
      handicap: s.handicap_index,
      trend: regression
        ? Math.round((regression.slope * i + regression.intercept) * 10) / 10
        : undefined,
      date: s.snapshot_date,
    }
  })

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
                return [val.toFixed(1), 'Handicap Index']
              }}
              labelFormatter={(label, payload: any[]) => {
                const item = payload?.[0]?.payload
                return item ? item.date : label
              }}
            />

            {regression && (
              <Line
                type="linear"
                dataKey="trend"
                stroke={trendColor}
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
              dataKey="handicap"
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
