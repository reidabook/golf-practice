import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getBlocks, getBlockDrillProgress } from '../lib/db'

export default function History() {
  const [blocks, setBlocks] = useState(null)
  const [drillProgressMap, setDrillProgressMap] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    getBlocks().then(async (bs) => {
      setBlocks(bs)
      const entries = await Promise.all(
        bs.map(b => getBlockDrillProgress(b.id).then(p => [b.id, p]).catch(() => [b.id, null]))
      )
      setDrillProgressMap(Object.fromEntries(entries))
    }).catch(console.error)
  }, [])

  if (!blocks) {
    return <div style={{ color: '#6b7280', paddingTop: 40, textAlign: 'center' }}>Loading…</div>
  }

  if (blocks.length === 0) {
    return (
      <div style={{ color: '#6b7280', paddingTop: 60, textAlign: 'center' }}>
        <p style={{ fontSize: 32, marginBottom: 8 }}>📋</p>
        <p>No blocks yet. Start practicing!</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>History</h1>
      {blocks.map(block => {
        const progress = drillProgressMap[block.id]
        const started = new Date(block.started_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        return (
          <button
            key={block.id}
            onClick={() => navigate(`/history/${block.id}`)}
            style={{
              padding: '16px 20px',
              backgroundColor: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: 14,
              textAlign: 'left',
              cursor: 'pointer',
              color: '#f8fafc',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>{block.name}</span>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
                backgroundColor: block.status === 'completed' ? '#14532d' : '#1a3a1a',
                color: block.status === 'completed' ? '#4ade80' : '#86efac',
              }}>
                {block.status === 'completed' ? 'Done' : 'Active'}
              </span>
            </div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>
              {progress ? `${progress.drillsDone} of ${progress.totalDrills} drills` : '…'} · Started {started}
            </div>
            {block.status !== 'active' && block.completed_at && (
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                Completed {new Date(block.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
