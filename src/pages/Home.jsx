import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getActiveBlock, getTemplates, startBlock, startNextSession, completeBlock, getSessionWithDrills, getBlockDrillProgress } from '../lib/db'

export default function Home() {
  const [block, setBlock] = useState(undefined) // undefined = loading
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [drillProgress, setDrillProgress] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    getActiveBlock().then(b => {
      setBlock(b)
      if (b) getBlockDrillProgress(b.id).then(setDrillProgress).catch(() => {})
    }).catch(e => { setBlock(null); setError(e.message) })
    getTemplates().then(setTemplates).catch(() => {})
  }, [])

  async function handleStartBlock(templateId) {
    setLoading(true)
    try {
      const sessionId = await startBlock(templateId)
      navigate(`/sessions/${sessionId}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleStartSession() {
    if (!block) return
    setLoading(true)
    try {
      const sessionId = await startNextSession(block.id)
      navigate(`/sessions/${sessionId}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCompleteBlock() {
    if (!block) return
    setLoading(true)
    try {
      await completeBlock(block.id)
      navigate(`/history/${block.id}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (block === undefined) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
        <span style={{ color: '#6b7280' }}>Loading…</span>
      </div>
    )
  }

  const completedSessions = block?.sessions?.filter(s => s.status === 'completed') ?? []
  const inProgressSession = block?.sessions?.find(s => s.status === 'in_progress')
  const allDone = completedSessions.length >= (block?.session_count ?? Infinity) && !inProgressSession

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Golf Practice</h1>
        <p style={{ fontSize: 14, color: '#6b7280' }}>Track your training blocks and drill scores</p>
      </div>

      {error && (
        <div style={{ padding: 12, backgroundColor: '#450a0a', borderRadius: 10, color: '#fca5a5', fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* Active block */}
      {block ? (
        <div style={{ backgroundColor: '#1a1a1a', borderRadius: 14, padding: 20, border: '1px solid #2a2a2a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: '#4ade80', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                Active Block
              </div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{block.name}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#4ade80' }}>
                {drillProgress?.drillsDone ?? '…'}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                of {drillProgress?.totalDrills ?? '…'} drills
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height: 6, backgroundColor: '#2a2a2a', borderRadius: 3, marginBottom: 16 }}>
            <div style={{
              height: '100%', borderRadius: 3,
              backgroundColor: '#4ade80',
              width: drillProgress ? `${(drillProgress.drillsDone / drillProgress.totalDrills) * 100}%` : '0%',
              transition: 'width 0.3s ease',
            }} />
          </div>

          {inProgressSession ? (
            <button
              onClick={() => navigate(`/sessions/${inProgressSession.id}`)}
              disabled={loading}
              style={primaryBtn}
            >
              Resume Session {inProgressSession.session_number}
            </button>
          ) : allDone ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 14, color: '#4ade80', textAlign: 'center', marginBottom: 4 }}>
                All {block.session_count} sessions complete! 🎉
              </p>
              <button onClick={handleCompleteBlock} disabled={loading} style={primaryBtn}>
                Complete Block & See Summary
              </button>
            </div>
          ) : (
            <button onClick={handleStartSession} disabled={loading} style={primaryBtn}>
              {loading ? 'Starting…' : 'Start Next Session'}
            </button>
          )}
        </div>
      ) : (
        /* No active block — template picker */
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#9ca3af' }}>
            Start a Training Block
          </h2>
          {templates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#6b7280' }}>
              <p>No templates yet.</p>
              <button onClick={() => navigate('/drills')} style={{ ...secondaryBtn, marginTop: 12 }}>
                Create a Template
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleStartBlock(t.id)}
                  disabled={loading}
                  style={{
                    padding: '16px 20px',
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #2a2a2a',
                    borderRadius: 12,
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: '#f8fafc',
                  }}
                >
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{t.name}</div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                    {t.session_count} sessions · {t.drills?.length ?? 0} drills
                  </div>
                  {t.description && (
                    <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>{t.description}</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Last session scores as targets */}
      {block && completedSessions.length > 0 && (
        <LastScores sessions={block.sessions} />
      )}
    </div>
  )
}

function LastScores({ sessions }) {
  const [data, setData] = useState(null)
  const lastCompleted = [...(sessions ?? [])]
    .filter(s => s.status === 'completed')
    .sort((a, b) => b.session_number - a.session_number)[0]

  useEffect(() => {
    if (!lastCompleted) return
    getSessionWithDrills(lastCompleted.id).then(setData).catch(console.error)
  }, [lastCompleted?.id])

  if (!data) return null

  return (
    <div>
      <h2 style={{ fontSize: 14, fontWeight: 600, color: '#6b7280', marginBottom: 10 }}>
        Session {lastCompleted.session_number} targets
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {data.drills.map(d => (
          <div key={d.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 14px', backgroundColor: '#1a1a1a', borderRadius: 10,
          }}>
            <span style={{ fontSize: 14 }}>{d.drills.name}</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#4ade80' }}>
              {d.score ?? '—'} <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 400 }}>{d.drills.unit}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const primaryBtn = {
  width: '100%', padding: '16px', borderRadius: 12, border: 'none',
  backgroundColor: '#4ade80', color: '#000', fontSize: 16, fontWeight: 700,
  cursor: 'pointer',
}

const secondaryBtn = {
  padding: '12px 20px', borderRadius: 10, border: '1px solid #2a2a2a',
  backgroundColor: 'transparent', color: '#f8fafc', fontSize: 14, cursor: 'pointer',
}
