import { useState, useEffect } from 'react'
import { Pencil, X, ChevronUp, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react'
import { CategoryBadge, CATEGORIES } from '../lib/categories'
import {
  getDrills, createDrill, updateDrill, deleteDrill,
  getTemplates, createTemplate, updateTemplate, deleteTemplate,
} from '../lib/db'

export default function Drills() {
  const [drills, setDrills] = useState([])
  const [templates, setTemplates] = useState([])
  const [drillForm, setDrillForm] = useState(null)  // null | 'new' | drill object
  const [templateForm, setTemplateForm] = useState(null)
  const [error, setError] = useState(null)

  const reload = async () => {
    const [d, t] = await Promise.all([getDrills(), getTemplates()])
    setDrills(d)
    setTemplates(t)
  }

  useEffect(() => { reload().catch(console.error) }, [])

  // ── Drill handlers ──────────────────────────────────────────────────────
  async function saveDrill(data) {
    try {
      if (data.id) {
        await updateDrill(data.id, data)
      } else {
        await createDrill(data)
      }
      setDrillForm(null)
      await reload()
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleDeleteDrill(id) {
    if (!confirm('Delete this drill? This cannot be undone if it has no recorded scores.')) return
    try {
      await deleteDrill(id)
      await reload()
    } catch (e) {
      setError('Cannot delete — this drill has recorded scores.')
    }
  }

  // ── Template handlers ───────────────────────────────────────────────────
  async function saveTemplate(data) {
    try {
      if (data.id) {
        await updateTemplate(data.id, data)
      } else {
        await createTemplate(data)
      }
      setTemplateForm(null)
      await reload()
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleDeleteTemplate(id) {
    if (!confirm('Delete this template?')) return
    try {
      await deleteTemplate(id)
      await reload()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>Drills & Templates</h1>

      {error && (
        <div style={{ padding: 12, backgroundColor: '#450a0a', borderRadius: 10, color: '#fca5a5', fontSize: 14 }}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: 8, background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}><X size={14} /></button>
        </div>
      )}

      {/* ── Block Templates ─────────────────────────────────────────── */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Block Templates</h2>
          <button onClick={() => setTemplateForm({ name: '', description: '', session_count: 8, drillIds: [] })} style={addBtn}>
            + New
          </button>
        </div>

        {templateForm && (
          <TemplateForm
            initial={templateForm}
            drills={drills}
            onSave={saveTemplate}
            onCancel={() => setTemplateForm(null)}
          />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {templates.map(t => (
            <div key={t.id} style={card}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{t.name}</div>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                  {t.session_count} sessions · {t.drills?.length ?? 0} drills
                  {t.description ? ` · ${t.description}` : ''}
                </div>
                {t.drills?.length > 0 && (
                  <div style={{ fontSize: 12, color: '#4b5563', marginTop: 4 }}>
                    {t.drills.map(d => d.name).join(' → ')}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setTemplateForm({ ...t, drillIds: t.drills?.map(d => d.drill_id) ?? [] })}
                  style={iconBtn}
                ><Pencil size={14} /></button>
                {!t.is_default && (
                  <button onClick={() => handleDeleteTemplate(t.id)} style={{ ...iconBtn, color: '#f87171' }}><X size={14} /></button>
                )}
              </div>
            </div>
          ))}
          {templates.length === 0 && !templateForm && (
            <p style={{ color: '#6b7280', fontSize: 14 }}>No templates yet. Create one above.</p>
          )}
        </div>
      </section>

      <div style={{ height: 1, backgroundColor: '#1e1e1e' }} />

      {/* ── Drill Library ────────────────────────────────────────────── */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Drill Library</h2>
          <button onClick={() => setDrillForm({
            name: '', description: '', instructions: '',
            scoring_direction: 'lower_better', min_score: 0, max_score: null, unit: '', category: null, source: '',
          })} style={addBtn}>
            + New
          </button>
        </div>

        {drillForm && typeof drillForm === 'object' && !drillForm.drillIds && (
          <DrillForm
            initial={drillForm}
            onSave={saveDrill}
            onCancel={() => setDrillForm(null)}
          />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {drills.map(d => (
            <div key={d.id} style={card}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{d.name}</span>
                  <CategoryBadge category={d.category} />
                </div>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                    {d.scoring_direction === 'higher_better' ? <><TrendingUp size={12} /> higher better</> : <><TrendingDown size={12} /> lower better</>}
                  </span> · {d.unit}
                  {d.max_score !== null ? ` · max ${d.max_score}` : ''}
                  {d.min_score !== 0 ? ` · min ${d.min_score}` : ''}
                </div>
                {d.source && (
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3, fontStyle: 'italic' }}>{d.source}</div>
                )}
                {d.description && (
                  <div style={{ fontSize: 12, color: '#4b5563', marginTop: 4 }}>{d.description}</div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setDrillForm(d)} style={iconBtn}><Pencil size={14} /></button>
                {!d.is_default && (
                  <button onClick={() => handleDeleteDrill(d.id)} style={{ ...iconBtn, color: '#f87171' }}><X size={14} /></button>
                )}
              </div>
            </div>
          ))}
          {drills.length === 0 && (
            <p style={{ color: '#6b7280', fontSize: 14 }}>No drills yet. Create one above.</p>
          )}
        </div>
      </section>
    </div>
  )
}

// ── DrillForm ─────────────────────────────────────────────────────────────────
function DrillForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({ ...initial })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.unit.trim()) return
    await onSave({
      ...form,
      min_score: Number(form.min_score ?? 0),
      max_score: form.max_score === '' || form.max_score === null ? null : Number(form.max_score),
    })
  }

  return (
    <form onSubmit={handleSubmit} style={formBox}>
      <div style={formTitle}>{initial.id ? 'Edit Drill' : 'New Drill'}</div>

      <Field label="Name">
        <input value={form.name} onChange={e => set('name', e.target.value)} required style={inputStyle} placeholder="3-Foot Putts" />
      </Field>
      <Field label="Unit">
        <input value={form.unit} onChange={e => set('unit', e.target.value)} required style={inputStyle} placeholder="misses" />
      </Field>
      <Field label="Scoring direction">
        <select value={form.scoring_direction} onChange={e => set('scoring_direction', e.target.value)} style={inputStyle}>
          <option value="lower_better">Lower is better</option>
          <option value="higher_better">Higher is better</option>
        </select>
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Min score">
          <input type="number" value={form.min_score ?? 0} onChange={e => set('min_score', e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Max score (blank = unlimited)">
          <input type="number" value={form.max_score ?? ''} onChange={e => set('max_score', e.target.value)} placeholder="—" style={inputStyle} />
        </Field>
      </div>
      <Field label="Source (optional)">
        <input value={form.source ?? ''} onChange={e => set('source', e.target.value)} style={inputStyle} placeholder="The Scratch Plan" />
      </Field>
      <Field label="Category">
        <select value={form.category ?? ''} onChange={e => set('category', e.target.value || null)} style={inputStyle}>
          <option value="">— none —</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
      </Field>
      <Field label="Description (optional)">
        <textarea value={form.description ?? ''} onChange={e => set('description', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
      </Field>
      <Field label="Instructions (optional)">
        <textarea value={form.instructions ?? ''} onChange={e => set('instructions', e.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
      </Field>

      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button type="submit" style={saveBtn}>Save</button>
        <button type="button" onClick={onCancel} style={cancelBtn}>Cancel</button>
      </div>
    </form>
  )
}

// ── TemplateForm ──────────────────────────────────────────────────────────────
function TemplateForm({ initial, drills, onSave, onCancel }) {
  const [form, setForm] = useState({ ...initial })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function toggleDrill(drillId) {
    const ids = form.drillIds ?? []
    if (ids.includes(drillId)) {
      set('drillIds', ids.filter(id => id !== drillId))
    } else {
      set('drillIds', [...ids, drillId])
    }
  }

  function moveDrill(index, dir) {
    const ids = [...(form.drillIds ?? [])]
    const to = index + dir
    if (to < 0 || to >= ids.length) return
    ;[ids[index], ids[to]] = [ids[to], ids[index]]
    set('drillIds', ids)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    await onSave({
      ...form,
      session_count: Number(form.session_count),
    })
  }

  const selectedDrills = (form.drillIds ?? []).map(id => drills.find(d => d.id === id)).filter(Boolean)

  return (
    <form onSubmit={handleSubmit} style={formBox}>
      <div style={formTitle}>{initial.id ? 'Edit Template' : 'New Template'}</div>

      <Field label="Template name">
        <input value={form.name} onChange={e => set('name', e.target.value)} required style={inputStyle} placeholder="Break 90 Program" />
      </Field>
      <Field label="Sessions per block">
        <input type="number" min={1} max={52} value={form.session_count} onChange={e => set('session_count', e.target.value)} required style={inputStyle} />
      </Field>
      <Field label="Description (optional)">
        <input value={form.description ?? ''} onChange={e => set('description', e.target.value)} style={inputStyle} />
      </Field>

      <div style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 8 }}>
        Drills (tap to add/remove, use arrows to reorder)
      </div>

      {/* Selected drills with reorder */}
      {selectedDrills.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
          {selectedDrills.map((d, i) => (
            <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', backgroundColor: '#14532d', borderRadius: 8 }}>
              <span style={{ flex: 1, fontSize: 13, color: '#f8fafc' }}>{i + 1}. {d.name}</span>
              <button type="button" onClick={() => moveDrill(i, -1)} disabled={i === 0} style={arrowBtn(i === 0)}><ChevronUp size={12} /></button>
              <button type="button" onClick={() => moveDrill(i, 1)} disabled={i === selectedDrills.length - 1} style={arrowBtn(i === selectedDrills.length - 1)}><ChevronDown size={12} /></button>
              <button type="button" onClick={() => toggleDrill(d.id)} style={{ ...arrowBtn(false), color: '#f87171' }}><X size={12} /></button>
            </div>
          ))}
        </div>
      )}

      {/* Available drills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {drills.filter(d => !(form.drillIds ?? []).includes(d.id)).map(d => (
          <button
            key={d.id}
            type="button"
            onClick={() => toggleDrill(d.id)}
            style={{
              padding: '6px 12px', borderRadius: 20, border: '1px solid #2a2a2a',
              backgroundColor: '#1a1a1a', color: '#9ca3af', fontSize: 13, cursor: 'pointer',
            }}
          >
            + {d.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" style={saveBtn}>Save</button>
        <button type="button" onClick={onCancel} style={cancelBtn}>Cancel</button>
      </div>
    </form>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
      <label style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>{label}</label>
      {children}
    </div>
  )
}

const card = {
  display: 'flex', alignItems: 'flex-start', gap: 12,
  padding: '14px 16px', backgroundColor: '#1a1a1a', borderRadius: 12,
  border: '1px solid #2a2a2a',
}
const addBtn = {
  padding: '6px 14px', borderRadius: 8, border: '1px solid #2a2a2a',
  backgroundColor: 'transparent', color: '#4ade80', fontSize: 14, cursor: 'pointer',
}
const iconBtn = {
  padding: '4px 8px', borderRadius: 6, border: '1px solid #2a2a2a',
  backgroundColor: 'transparent', color: '#9ca3af', fontSize: 15, cursor: 'pointer',
}
const formBox = {
  backgroundColor: '#111', borderRadius: 14, padding: 18,
  border: '1px solid #2a2a2a', marginBottom: 16,
}
const formTitle = { fontSize: 14, fontWeight: 700, color: '#9ca3af', marginBottom: 14 }
const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: '1px solid #2a2a2a', backgroundColor: '#1a1a1a',
  color: '#f8fafc', fontSize: 14, outline: 'none',
}
const saveBtn = {
  flex: 1, padding: '12px', borderRadius: 10, border: 'none',
  backgroundColor: '#4ade80', color: '#000', fontSize: 15, fontWeight: 700, cursor: 'pointer',
}
const cancelBtn = {
  flex: 1, padding: '12px', borderRadius: 10,
  border: '1px solid #2a2a2a', backgroundColor: 'transparent',
  color: '#9ca3af', fontSize: 15, cursor: 'pointer',
}
const arrowBtn = (disabled) => ({
  padding: '3px 7px', borderRadius: 6, border: '1px solid #2a2a2a',
  backgroundColor: '#1a1a1a', color: disabled ? '#333' : '#9ca3af',
  fontSize: 11, cursor: disabled ? 'not-allowed' : 'pointer',
})
