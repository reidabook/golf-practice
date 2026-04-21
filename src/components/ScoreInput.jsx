import { useState } from 'react'
import Numpad from './Numpad'

export default function ScoreInput({ value, onChange, drill }) {
  const [padOpen, setPadOpen] = useState(false)
  const min = drill.min_score ?? 0
  const max = drill.max_score ?? null

  function clamp(n) {
    let v = n
    if (v < min) { v = min; vibrate() }
    if (max !== null && v > max) { v = max; vibrate() }
    return v
  }

  function vibrate() {
    if (navigator.vibrate) navigator.vibrate(10)
  }

  function decrement() {
    const next = clamp((value ?? 0) - 1)
    onChange(next)
  }

  function increment() {
    const next = clamp((value ?? 0) + 1)
    onChange(next)
  }

  const atMin = value !== null && value !== undefined && value <= min
  const atMax = max !== null && value !== null && value !== undefined && value >= max

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <button
          onPointerDown={e => { e.preventDefault(); decrement() }}
          disabled={atMin}
          style={{
            width: 72, height: 72, borderRadius: '50%', border: '2px solid #2a2a2a',
            backgroundColor: '#1a1a1a', color: atMin ? '#444' : '#f8fafc',
            fontSize: 32, fontWeight: 700, cursor: atMin ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            userSelect: 'none', WebkitUserSelect: 'none',
          }}
        >
          −
        </button>

        <button
          onPointerDown={e => { e.preventDefault(); setPadOpen(true) }}
          style={{
            minWidth: 120,
            padding: '8px 16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <span style={{
            display: 'block',
            fontSize: 72,
            fontWeight: 800,
            color: '#4ade80',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {value ?? 0}
          </span>
          <span style={{ display: 'block', fontSize: 13, color: '#6b7280', marginTop: 4 }}>
            {drill.unit}
          </span>
        </button>

        <button
          onPointerDown={e => { e.preventDefault(); increment() }}
          disabled={atMax}
          style={{
            width: 72, height: 72, borderRadius: '50%', border: '2px solid #2a2a2a',
            backgroundColor: '#1a1a1a', color: atMax ? '#444' : '#f8fafc',
            fontSize: 32, fontWeight: 700, cursor: atMax ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            userSelect: 'none', WebkitUserSelect: 'none',
          }}
        >
          +
        </button>
      </div>

      <div style={{ fontSize: 12, color: '#6b7280' }}>
        Range: {min} – {max ?? '∞'} · Tap score to type
      </div>

      {padOpen && (
        <Numpad
          value={value ?? 0}
          onValue={v => onChange(clamp(v))}
          onClose={() => setPadOpen(false)}
          min={min}
          max={max}
        />
      )}
    </div>
  )
}
