import { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { getSessionWithDrills, saveScore, completeSession, skipDrill } from '../lib/db'
import ScoreInput from '../components/ScoreInput'
import DrillInstructions from '../components/DrillInstructions'
import { ChevronLeft, ChevronDown, ChevronRight } from 'lucide-react'
import { CategoryBadge } from '../lib/categories'

export default function DrillEntry() {
  const { sessionId, drillId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const pos = Number(searchParams.get('pos') ?? 1)
  const total = Number(searchParams.get('total') ?? 1)

  const [session, setSession] = useState(null)
  const [currentDrill, setCurrentDrill] = useState(null)
  const [score, setScore] = useState(null)
  const [saving, setSaving] = useState(false)
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)

  const loadSession = useCallback(async () => {
    const s = await getSessionWithDrills(sessionId)
    setSession(s)
    setNotes(s.notes ?? '')
    const d = s.drills.find(d => d.drill_id === drillId)
    if (d) {
      setCurrentDrill(d)
      setScore(d.score !== null ? Number(d.score) : null)
    }
  }, [sessionId, drillId])

  useEffect(() => {
    loadSession().catch(console.error)
  }, [loadSession])

  async function handleSave(goNext) {
    if (!currentDrill) return
    setSaving(true)
    try {
      await saveScore(currentDrill.id, score ?? 0)

      if (goNext && pos < total) {
        // Navigate to next drill
        const nextDrill = session.drills[pos] // drills are sorted by sort_order, pos is 1-based
        navigate(`/sessions/${sessionId}/drill/${nextDrill.drill_id}?pos=${pos + 1}&total=${total}`)
      } else if (!goNext && pos > 1) {
        // Navigate to previous drill
        const prevDrill = session.drills[pos - 2]
        navigate(`/sessions/${sessionId}/drill/${prevDrill.drill_id}?pos=${pos - 1}&total=${total}`)
      } else if (goNext && pos === total) {
        // Last drill — complete session
        await completeSession(sessionId, notes || null)
        if (session.session_number >= session.training_blocks.session_count) {
          navigate(`/history/${session.block_id}`)
        } else {
          navigate('/')
        }
      }
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSkip() {
    if (!currentDrill) return
    setSaving(true)
    try {
      await skipDrill(currentDrill.id)
      if (pos < total) {
        const nextDrill = session.drills[pos]
        navigate(`/sessions/${sessionId}/drill/${nextDrill.drill_id}?pos=${pos + 1}&total=${total}`)
      } else {
        // Last drill — complete session
        await completeSession(sessionId, notes || null)
        if (session.session_number >= session.training_blocks.session_count) {
          navigate(`/history/${session.block_id}`)
        } else {
          navigate('/')
        }
      }
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (!session || !currentDrill) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        minHeight: '100svh', backgroundColor: '#0a0a0a', color: '#6b7280',
      }}>
        Loading…
      </div>
    )
  }

  const drill = currentDrill.drills
  const isLast = pos === total

  return (
    <div style={{
      flex: 1,
      minHeight: 0,
      backgroundColor: '#0a0a0a',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
        paddingBottom: 16, paddingLeft: 20, paddingRight: 20,
        borderBottom: '1px solid #1a1a1a',
      }}>
        <button
          onClick={() => pos > 1 ? handleSave(false) : navigate(`/sessions/${sessionId}`)}
          style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '4px 8px 4px 0', display: 'flex', alignItems: 'center' }}
        >
          <ChevronLeft size={22} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            {session.training_blocks?.name} · Session {session.session_number}
          </div>
        </div>
        <div style={{ fontSize: 13, color: '#6b7280', fontVariantNumeric: 'tabular-nums' }}>
          {pos} / {total}
        </div>
      </div>

      {/* Progress strip */}
      <div style={{ height: 3, backgroundColor: '#1a1a1a' }}>
        <div style={{
          height: '100%', backgroundColor: '#4ade80',
          width: `${(pos / total) * 100}%`,
          transition: 'width 0.3s',
        }} />
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 20px', gap: 24, maxWidth: 480, width: '100%', margin: '0 auto' }}>
        <div>
          <div style={{ marginBottom: 6 }}>
            <CategoryBadge category={drill.category} />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>{drill.name}</h1>
          {drill.description && (
            <p style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.5 }}>{drill.description}</p>
          )}
        </div>

        <DrillInstructions instructions={drill.instructions} />

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ScoreInput value={score} onChange={setScore} drill={drill} />
        </div>

        {/* Notes (last drill only) */}
        {isLast && (
          <div>
            <button
              onClick={() => setShowNotes(o => !o)}
              style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 14, cursor: 'pointer', padding: '0 0 8px' }}
            >
              {showNotes ? <ChevronDown size={14} /> : <ChevronRight size={14} />} Session notes (optional)
            </button>
            {showNotes && (
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="How did practice go today?"
                rows={3}
                style={{
                  width: '100%', padding: '12px', borderRadius: 10,
                  border: '1px solid #2a2a2a', backgroundColor: '#1a1a1a',
                  color: '#f8fafc', fontSize: 14, resize: 'none', outline: 'none',
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Bottom action */}
      <div style={{
        padding: '16px 20px',
        paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
        borderTop: '1px solid #1a1a1a',
        maxWidth: 480, width: '100%', margin: '0 auto',
      }}>
        <button
          onClick={() => handleSave(true)}
          disabled={saving || score === null}
          style={{
            width: '100%', padding: 18, borderRadius: 14, border: 'none',
            backgroundColor: score !== null ? '#4ade80' : '#1a1a1a',
            color: score !== null ? '#000' : '#444',
            fontSize: 17, fontWeight: 700, cursor: score !== null ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.2s',
          }}
        >
          {saving ? 'Saving…' : isLast ? 'Finish Session' : 'Save & Next →'}
        </button>
        <button
          onClick={handleSkip}
          disabled={saving}
          style={{
            width: '100%', marginTop: 10, padding: 14, borderRadius: 14, border: 'none',
            backgroundColor: 'transparent', color: '#6b7280',
            fontSize: 15, fontWeight: 500, cursor: 'pointer',
          }}
        >
          Skip this drill
        </button>
      </div>
    </div>
  )
}
