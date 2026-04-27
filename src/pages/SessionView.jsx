import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSessionWithDrills, saveScore, skipDrill } from '../lib/db'

export default function SessionView() {
  const { blockId, sessionId } = useParams()
  const [session, setSession] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editScore, setEditScore] = useState('')
  const navigate = useNavigate()

  async function handleEditSave(d) {
    const val = parseFloat(editScore)
    if (isNaN(val)) return
    await saveScore(d.id, val)
    setEditingId(null)
    getSessionWithDrills(sessionId).then(setSession).catch(console.error)
  }

  async function handleSkipDrill(d) {
    await skipDrill(d.id)
    setEditingId(null)
    getSessionWithDrills(sessionId).then(setSession).catch(console.error)
  }

  useEffect(() => {
    getSessionWithDrills(sessionId).then(setSession).catch(console.error)
  }, [sessionId])

  if (!session) {
    return <div style={{ color: '#6b7280', paddingTop: 40, textAlign: 'center' }}>Loading…</div>
  }

  const dateStr = session.session_date
    ? new Date(session.session_date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
      })
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <button
          onClick={() => navigate(`/history/${blockId}`)}
          style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 14, cursor: 'pointer', padding: 0 }}
        >
          ← {session.training_blocks?.name ?? 'Block'}
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginTop: 8 }}>
          Session {session.session_number}
        </h1>
        {dateStr && <p style={{ fontSize: 14, color: '#6b7280', marginTop: 2 }}>{dateStr}</p>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {session.drills.map(d => (
          <div key={d.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 16px', backgroundColor: '#1a1a1a', borderRadius: 12,
            border: '1px solid #2a2a2a',
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{d.drills.name}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                {d.drills.scoring_direction === 'higher_better' ? '↑ higher better' : '↓ lower better'}
              </div>
            </div>
            {d.id === editingId ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="number"
                  value={editScore}
                  onChange={e => setEditScore(e.target.value)}
                  style={{
                    width: 70, padding: '6px 10px', borderRadius: 8,
                    border: '1px solid #374151', backgroundColor: '#111',
                    color: '#f8fafc', fontSize: 16, textAlign: 'center',
                  }}
                />
                <button onClick={() => handleEditSave(d)} style={{ color: '#4ade80', background: 'none', border: 'none', fontSize: 14, cursor: 'pointer' }}>Save</button>
                <button onClick={() => handleSkipDrill(d)} style={{ color: '#6b7280', background: 'none', border: 'none', fontSize: 13, cursor: 'pointer' }}>Skip</button>
                <button onClick={() => setEditingId(null)} style={{ color: '#6b7280', background: 'none', border: 'none', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: d.skipped ? '#6b7280' : '#4ade80' }}>
                  {d.skipped ? 'skipped' : (d.score ?? '—')}
                </span>
                {!d.skipped && <span style={{ fontSize: 12, color: '#6b7280' }}>{d.drills.unit}</span>}
                <button
                  onClick={() => { setEditingId(d.id); setEditScore(d.score ?? '') }}
                  style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 13 }}
                >✎</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {session.notes && (
        <div style={{ padding: '14px 16px', backgroundColor: '#1a1a1a', borderRadius: 12, border: '1px solid #2a2a2a' }}>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Notes</div>
          <div style={{ fontSize: 14, color: '#d1d5db', lineHeight: 1.6 }}>{session.notes}</div>
        </div>
      )}
    </div>
  )
}
