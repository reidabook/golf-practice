import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSessionWithDrills, reorderDrills, deleteSession, removeSessionDrill, skipDrill, completeSession, getOutstandingDrills } from '../lib/db'
import { ArrowLeft, ChevronUp, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react'
import { CategoryBadge } from '../lib/categories'

export default function SessionOverview() {
  const { sessionId } = useParams()
  const [session, setSession] = useState(null)
  const [drills, setDrills] = useState([])
  const [deleting, setDeleting] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    getSessionWithDrills(sessionId).then(s => {
      setSession(s)
      setDrills(s.drills)
    }).catch(console.error)
  }, [sessionId])

  async function moveUp(index) {
    if (index === 0) return
    const next = [...drills]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    setDrills(next)
    await reorderDrills(sessionId, next.map(d => d.id))
  }

  async function moveDown(index) {
    if (index === drills.length - 1) return
    const next = [...drills]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    setDrills(next)
    await reorderDrills(sessionId, next.map(d => d.id))
  }

  async function handleDelete() {
    if (!confirm('Delete this session? This cannot be undone.')) return
    setDeleting(true)
    try {
      await deleteSession(sessionId)
      navigate(`/history/${session.block_id}`, { replace: true })
    } catch (e) {
      alert(e.message)
      setDeleting(false)
    }
  }

  async function handleRemoveDrill(d) {
    await removeSessionDrill(d.id)
    setDrills(prev => prev.filter(x => x.id !== d.id))
  }

  async function handleFinishEarly() {
    if (!window.confirm('Finish session now? Unscored drills will be skipped.')) return
    setFinishing(true)
    try {
      const unscored = drills.filter(d => d.score === null && !d.skipped)
      for (const d of unscored) await skipDrill(d.id)
      await completeSession(session.id, null)
      navigate('/')
    } catch (e) {
      alert(e.message)
    } finally {
      setFinishing(false)
    }
  }

  function handleBegin() {
    if (drills.length === 0) return
    navigate(`/sessions/${sessionId}/drill/${drills[0].drill_id}?pos=1&total=${drills.length}`)
  }

  if (!session) {
    return <div style={{ color: '#6b7280', paddingTop: 40, textAlign: 'center' }}>Loading…</div>
  }

  const blockName = session.training_blocks?.name ?? 'Block'
  const isInProgress = session.status === 'in_progress'
  const anyScored = drills.some(d => d.score !== null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 14, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <ArrowLeft size={16} /> Home
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginTop: 8 }}>
          Session {session.session_number}
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginTop: 2 }}>
          {blockName} · {drills.length} drills
        </p>
      </div>

      {/* Drill list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {drills.map((d, i) => (
          <div key={d.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 14px', backgroundColor: '#1a1a1a', borderRadius: 12,
            border: '1px solid #2a2a2a',
          }}>
            {/* Reorder controls — only before session begins */}
            {isInProgress && !anyScored && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <button
                  onClick={() => moveUp(i)}
                  disabled={i === 0}
                  style={arrowBtn(i === 0)}
                ><ChevronUp size={14} /></button>
                <button
                  onClick={() => moveDown(i)}
                  disabled={i === drills.length - 1}
                  style={arrowBtn(i === drills.length - 1)}
                ><ChevronDown size={14} /></button>
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{d.drills.name}</span>
                <CategoryBadge category={d.drills.category} />
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                {d.drills.scoring_direction === 'higher_better'
                  ? <><TrendingUp size={12} /> higher better</>
                  : <><TrendingDown size={12} /> lower better</>
                }
                {' · '}{d.drills.unit}
              </div>
            </div>
            {d.score !== null && (
              <span style={{ fontSize: 20, fontWeight: 700, color: '#4ade80' }}>{d.score}</span>
            )}
            {d.skipped && (
              <span style={{ fontSize: 13, color: '#6b7280' }}>skipped</span>
            )}
            {isInProgress && !anyScored && (
              <button
                onClick={() => handleRemoveDrill(d)}
                style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px' }}
                title="Remove from this session"
              >×</button>
            )}
          </div>
        ))}
      </div>

      {isInProgress && (
        <>
          <button onClick={handleBegin} style={primaryBtn}>
            {anyScored ? 'Continue Session' : 'Begin Session'}
          </button>
          {anyScored && (
            <button onClick={handleFinishEarly} disabled={finishing} style={secondaryBtn}>
              {finishing ? 'Finishing…' : 'Finish Session Early'}
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{ ...secondaryBtn, color: '#f87171', borderColor: '#450a0a' }}
          >
            {deleting ? 'Deleting…' : 'Delete Session'}
          </button>
        </>
      )}
    </div>
  )
}

const arrowBtn = (disabled) => ({
  width: 28, height: 22, border: '1px solid #2a2a2a', borderRadius: 6,
  backgroundColor: '#111', color: disabled ? '#3a3a3a' : '#9ca3af',
  fontSize: 10, cursor: disabled ? 'not-allowed' : 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
})

const primaryBtn = {
  width: '100%', padding: '16px', borderRadius: 12, border: 'none',
  backgroundColor: '#4ade80', color: '#000', fontSize: 16, fontWeight: 700,
  cursor: 'pointer',
}

const secondaryBtn = {
  width: '100%', padding: '14px', borderRadius: 12,
  border: '1px solid #2a2a2a', backgroundColor: 'transparent',
  color: '#9ca3af', fontSize: 15, cursor: 'pointer',
}
