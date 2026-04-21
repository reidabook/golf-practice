import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

export default function DrillInstructions({ instructions }) {
  const [open, setOpen] = useState(false)
  if (!instructions) return null
  return (
    <div style={{ borderRadius: 10, border: '1px solid #2a2a2a', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '12px 16px', background: '#1a1a1a', border: 'none',
          color: '#9ca3af', fontSize: 14, textAlign: 'left', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <span>Instructions</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && (
        <div style={{ padding: '12px 16px', backgroundColor: '#111', fontSize: 14, color: '#d1d5db', lineHeight: 1.6 }}>
          {instructions}
        </div>
      )}
    </div>
  )
}
