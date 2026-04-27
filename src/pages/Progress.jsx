import { useState, useEffect } from 'react'
import { getProgressForAllDrills } from '../lib/db'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'

export default function Progress() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    getProgressForAllDrills().then(setData).catch(setError)
  }, [])

  if (error) {
    return <div style={{ color: '#f87171', paddingTop: 40, textAlign: 'center' }}>
      Failed to load progress: {error.message}
    </div>
  }

  if (!data) {
    return <div style={{ color: '#6b7280', paddingTop: 40, textAlign: 'center' }}>Loading…</div>
  }

  const drills = Object.values(data)

  if (drills.length === 0) {
    return (
      <div style={{ color: '#6b7280', paddingTop: 60, textAlign: 'center' }}>
        <p style={{ fontSize: 32, marginBottom: 8 }}>📈</p>
        <p>Complete some sessions to see progress.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Progress</h1>
      {drills.map(({ drill, entries }) => {
        if (entries.length < 2) return null
        const higher = drill.scoring_direction === 'higher_better'
        const scores = entries.map(e => e.score)
        const best = higher ? Math.max(...scores) : Math.min(...scores)
        const first = scores[0]
        const last = scores[scores.length - 1]
        const improved = higher ? last > first : last < first

        const chartData = entries.map((e) => ({
          date: e.date
            ? new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : `#${e.sessionNumber}`,
          score: e.score,
          label: `${e.blockName} · ${e.date
            ? new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : `Session ${e.sessionNumber}`}`,
        }))

        return (
          <div key={drill.id} style={{
            backgroundColor: '#1a1a1a', borderRadius: 14, padding: 20,
            border: '1px solid #2a2a2a',
          }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{drill.name}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                {entries.length} sessions ·{' '}
                <span style={{ color: improved ? '#4ade80' : '#f87171' }}>
                  {improved ? '↑ improving' : '↓ trending down'}
                </span>
                {' · '}best: <strong style={{ color: '#f8fafc' }}>{best} {drill.unit}</strong>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  axisLine={{ stroke: '#2a2a2a' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#6b7280', fontSize: 11 }}
                  axisLine={{ stroke: '#2a2a2a' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111', border: '1px solid #2a2a2a',
                    borderRadius: 8, color: '#f8fafc', fontSize: 12,
                  }}
                  formatter={(val) => [`${val} ${drill.unit}`, drill.name]}
                  labelFormatter={(val) => chartData.find(d => d.date === val)?.label ?? val}
                />
                <ReferenceLine
                  y={best}
                  stroke="#4ade80"
                  strokeDasharray="4 4"
                  strokeOpacity={0.5}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#4ade80"
                  strokeWidth={2.5}
                  dot={{ fill: '#4ade80', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )
      })}
    </div>
  )
}
