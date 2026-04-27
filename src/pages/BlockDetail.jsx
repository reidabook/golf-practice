import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getBlock, getBlockCompletionSummary, getBlockDrillProgress } from '../lib/db'

export default function BlockDetail() {
  const { blockId } = useParams()
  const [block, setBlock] = useState(null)
  const [summary, setSummary] = useState(null)
  const [drillProgress, setDrillProgress] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    getBlock(blockId).then(b => {
      setBlock(b)
      if (b.status === 'completed') {
        getBlockCompletionSummary(blockId).then(setSummary).catch(console.error)
      }
    }).catch(console.error)
    getBlockDrillProgress(blockId).then(setDrillProgress).catch(() => {})
  }, [blockId])

  if (!block) {
    return <div style={{ color: '#6b7280', paddingTop: 40, textAlign: 'center' }}>Loading…</div>
  }

  const completedSessions = block.sessions.filter(s => s.status === 'completed')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <button onClick={() => navigate('/history')} style={backBtn}>← History</button>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginTop: 8 }}>{block.name}</h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginTop: 2 }}>
          {drillProgress ? `${drillProgress.drillsDone} of ${drillProgress.totalDrills} drills` : `${completedSessions.length} of ${block.session_count} sessions`} ·{' '}
          <span style={{
            color: block.status === 'completed' ? '#4ade80' : '#86efac',
          }}>
            {block.status === 'completed' ? 'Completed' : 'Active'}
          </span>
        </p>
      </div>

      {/* Completion summary */}
      {block.status === 'completed' && summary && summary.length > 0 && (
        <div style={{ backgroundColor: '#1a1a1a', borderRadius: 14, padding: 20, border: '1px solid #2a2a2a' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14, color: '#4ade80' }}>
            Block Summary
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {summary.map(({ drill, first, last, best }) => {
              const improved = drill.scoring_direction === 'higher_better'
                ? last > first : last < first
              const diff = last - first
              const diffStr = diff > 0 ? `+${diff}` : String(diff)
              return (
                <div key={drill.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 14px', backgroundColor: '#111', borderRadius: 10,
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{drill.name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                      {first} → {last} {drill.unit}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: improved ? '#4ade80' : '#f87171' }}>
                      {diffStr}
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>best: {best}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Sessions list */}
      <div>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: '#6b7280', marginBottom: 10 }}>Sessions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {block.sessions.map(session => (
            <Link
              key={session.id}
              to={`/history/${blockId}/sessions/${session.id}`}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 16px', backgroundColor: '#1a1a1a', borderRadius: 12,
                textDecoration: 'none', color: '#f8fafc',
                border: '1px solid #2a2a2a',
              }}
            >
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>Session {session.session_number}</div>
                {session.session_date && (
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                    {new Date(session.session_date + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric',
                    })}
                  </div>
                )}
              </div>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                backgroundColor: session.status === 'completed' ? '#14532d' : '#1c1917',
                color: session.status === 'completed' ? '#4ade80' : '#a3a3a3',
              }}>
                {session.status === 'completed' ? 'Done' : 'In Progress'}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

const backBtn = {
  background: 'none', border: 'none', color: '#6b7280',
  fontSize: 14, cursor: 'pointer', padding: 0,
}
