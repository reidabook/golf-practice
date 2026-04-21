export default function Numpad({ value, onValue, onClose, min, max }) {
  function handleDigit(d) {
    const s = String(value ?? '')
    const next = s === '0' ? String(d) : s + String(d)
    const num = Number(next)
    if (max !== null && max !== undefined && num > max) return
    onValue(num)
  }

  function handleBackspace() {
    const s = String(value ?? '')
    if (s.length <= 1) { onValue(0); return }
    onValue(Number(s.slice(0, -1)))
  }

  function handleNeg() {
    const num = Number(value ?? 0)
    const next = num > 0 ? -num : 0
    if (min !== null && min !== undefined && next < min) return
    onValue(next)
  }

  const btn = (label, action, accent) => (
    <button
      key={label}
      onPointerDown={e => { e.preventDefault(); action() }}
      style={{
        flex: 1,
        height: 64,
        fontSize: 22,
        fontWeight: 600,
        borderRadius: 12,
        border: 'none',
        cursor: 'pointer',
        backgroundColor: accent ? '#16a34a' : '#1e1e1e',
        color: accent ? '#fff' : '#f8fafc',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {label}
    </button>
  )

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'flex-end',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          backgroundColor: '#111',
          borderTop: '1px solid #2a2a2a',
          padding: 12,
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {[[1,2,3],[4,5,6],[7,8,9]].map(row => (
          <div key={row.join()} style={{ display: 'flex', gap: 8 }}>
            {row.map(d => btn(d, () => handleDigit(d)))}
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8 }}>
          {(min !== undefined && min < 0) ? btn('±', handleNeg) : <div style={{ flex: 1 }} />}
          {btn(0, () => handleDigit(0))}
          {btn('⌫', handleBackspace)}
        </div>
        <button
          onPointerDown={e => { e.preventDefault(); onClose() }}
          style={{
            width: '100%', height: 52, fontSize: 17, fontWeight: 700,
            borderRadius: 12, border: 'none', cursor: 'pointer',
            backgroundColor: '#4ade80', color: '#000',
          }}
        >
          Done
        </button>
      </div>
    </div>
  )
}
