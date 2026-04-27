import { supabase } from './supabase'

// ─── Drills ──────────────────────────────────────────────────────────────────

export async function getDrills() {
  const { data, error } = await supabase
    .from('drills')
    .select('*')
    .order('name')
  if (error) throw error
  return data
}

export async function getDrill(id) {
  const { data, error } = await supabase
    .from('drills')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createDrill(drill) {
  const { data, error } = await supabase
    .from('drills')
    .insert(drill)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateDrill(id, drill) {
  const { data, error } = await supabase
    .from('drills')
    .update(drill)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteDrill(id) {
  const { error } = await supabase
    .from('drills')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ─── Templates ───────────────────────────────────────────────────────────────

export async function getTemplates() {
  const { data: templates, error } = await supabase
    .from('block_templates')
    .select('*, block_template_drills(drill_id, sort_order, drills(*))')
    .order('created_at', { ascending: false })
  if (error) throw error
  return templates.map(t => ({
    ...t,
    drills: (t.block_template_drills || [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(d => ({ ...d.drills, drill_id: d.drill_id, sort_order: d.sort_order })),
  }))
}

export async function getTemplate(id) {
  const { data, error } = await supabase
    .from('block_templates')
    .select('*, block_template_drills(drill_id, sort_order, drills(*))')
    .eq('id', id)
    .single()
  if (error) throw error
  return {
    ...data,
    drills: (data.block_template_drills || [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(d => ({ ...d.drills, drill_id: d.drill_id, sort_order: d.sort_order })),
  }
}

export async function createTemplate({ name, description, session_count, drillIds }) {
  const { data: template, error } = await supabase
    .from('block_templates')
    .insert({ name, description, session_count })
    .select()
    .single()
  if (error) throw error

  if (drillIds && drillIds.length > 0) {
    const rows = drillIds.map((drill_id, i) => ({
      template_id: template.id,
      drill_id,
      sort_order: i,
    }))
    const { error: e2 } = await supabase.from('block_template_drills').insert(rows)
    if (e2) throw e2
  }
  return template
}

export async function updateTemplate(id, { name, description, session_count, drillIds }) {
  const { error } = await supabase
    .from('block_templates')
    .update({ name, description, session_count })
    .eq('id', id)
  if (error) throw error

  if (drillIds !== undefined) {
    const { error: e2 } = await supabase
      .from('block_template_drills')
      .delete()
      .eq('template_id', id)
    if (e2) throw e2

    if (drillIds.length > 0) {
      const rows = drillIds.map((drill_id, i) => ({
        template_id: id,
        drill_id,
        sort_order: i,
      }))
      const { error: e3 } = await supabase.from('block_template_drills').insert(rows)
      if (e3) throw e3
    }
  }
}

export async function deleteTemplate(id) {
  const { error } = await supabase
    .from('block_templates')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ─── Blocks ───────────────────────────────────────────────────────────────────

export async function getActiveBlock() {
  const { data, error } = await supabase
    .from('training_blocks')
    .select('*, sessions(*)')
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  return {
    ...data,
    sessions: (data.sessions || []).sort((a, b) => a.session_number - b.session_number),
  }
}

export async function getBlocks() {
  const { data, error } = await supabase
    .from('training_blocks')
    .select('*, sessions(id, session_number, status, session_date)')
    .order('started_at', { ascending: false })
  if (error) throw error
  return data.map(b => ({
    ...b,
    sessions: (b.sessions || []).sort((a, b) => a.session_number - b.session_number),
  }))
}

export async function getBlock(id) {
  const { data, error } = await supabase
    .from('training_blocks')
    .select('*, sessions(id, session_number, status, session_date, notes)')
    .eq('id', id)
    .single()
  if (error) throw error
  return {
    ...data,
    sessions: (data.sessions || []).sort((a, b) => a.session_number - b.session_number),
  }
}

// Start a new block from a template; creates block + first session + session_drills
export async function startBlock(templateId) {
  const template = await getTemplate(templateId)

  const { data: block, error: bErr } = await supabase
    .from('training_blocks')
    .insert({
      template_id: templateId,
      name: template.name,
      session_count: template.session_count,
    })
    .select()
    .single()
  if (bErr) throw bErr

  return startNextSession(block.id, template)
}

export async function completeBlock(id) {
  const { error } = await supabase
    .from('training_blocks')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

// ─── Sessions ────────────────────────────────────────────────────────────────

export async function getSessionWithDrills(id) {
  const { data: session, error } = await supabase
    .from('sessions')
    .select('*, training_blocks(name, session_count, template_id)')
    .eq('id', id)
    .single()
  if (error) throw error

  const { data: drills, error: dErr } = await supabase
    .from('session_drills')
    .select('*, drills(*), skipped')
    .eq('session_id', id)
    .order('sort_order')
  if (dErr) throw dErr

  return { ...session, drills: drills || [] }
}

// Create the next session for an active block
export async function startNextSession(blockId, template) {
  // template is optional; if not passed, we look it up
  let tpl = template
  if (!tpl) {
    const { data: block, error: bErr } = await supabase
      .from('training_blocks')
      .select('template_id')
      .eq('id', blockId)
      .single()
    if (bErr) throw bErr
    tpl = await getTemplate(block.template_id)
  }

  const { data: lastSession } = await supabase
    .from('sessions')
    .select('session_number')
    .eq('block_id', blockId)
    .order('session_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextNumber = (lastSession?.session_number ?? 0) + 1

  // Every session gets all template drills in template order
  const drillIds = tpl.drills.map((d, i) => ({ drill_id: d.drill_id || d.id, sort_order: d.sort_order ?? i }))

  const { data: session, error: sErr } = await supabase
    .from('sessions')
    .insert({ block_id: blockId, session_number: nextNumber })
    .select()
    .single()
  if (sErr) throw sErr

  if (drillIds.length > 0) {
    const drillRows = drillIds.map(d => ({
      session_id: session.id,
      drill_id: d.drill_id,
      sort_order: d.sort_order,
    }))
    const { error: dErr } = await supabase.from('session_drills').insert(drillRows)
    if (dErr) throw dErr
  }

  return session.id
}

export async function reorderDrills(sessionId, orderedIds) {
  // orderedIds: array of session_drill IDs in desired order
  await Promise.all(
    orderedIds.map((id, i) =>
      supabase
        .from('session_drills')
        .update({ sort_order: i })
        .eq('id', id)
    )
  )
}

export async function completeSession(id, notes) {
  const { error } = await supabase
    .from('sessions')
    .update({ status: 'completed', notes: notes || null })
    .eq('id', id)
  if (error) throw error
}

export async function deleteSession(id) {
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ─── Session Drills ───────────────────────────────────────────────────────────

export async function saveScore(sessionDrillId, score) {
  const { error } = await supabase
    .from('session_drills')
    .update({ score, skipped: false })
    .eq('id', sessionDrillId)
  if (error) throw error
}

export async function skipDrill(sessionDrillId) {
  const { error } = await supabase
    .from('session_drills')
    .update({ skipped: true, score: null })
    .eq('id', sessionDrillId)
  if (error) throw error
}

export async function removeSessionDrill(sessionDrillId) {
  const { error } = await supabase
    .from('session_drills')
    .delete()
    .eq('id', sessionDrillId)
  if (error) throw error
}

// Returns drill_ids not yet scored (not skipped) in the block
export async function getOutstandingDrills(blockId) {
  const { data: block } = await supabase
    .from('training_blocks')
    .select('template_id')
    .eq('id', blockId)
    .single()

  const tpl = await getTemplate(block.template_id)
  const allDrillIds = tpl.drills.map(d => d.drill_id || d.id)

  // Fetch completed session IDs for this block first — filtering on related
  // table columns via .eq('sessions.block_id', ...) is unreliable in Supabase
  // and can silently return rows from other blocks.
  const { data: completedSessions } = await supabase
    .from('sessions')
    .select('id')
    .eq('block_id', blockId)
    .eq('status', 'completed')

  const sessionIds = (completedSessions || []).map(s => s.id)
  if (sessionIds.length === 0) return allDrillIds

  const { data: scored } = await supabase
    .from('session_drills')
    .select('drill_id')
    .in('session_id', sessionIds)
    .eq('skipped', false)
    .not('score', 'is', null)

  const doneDrillIds = new Set((scored || []).map(r => r.drill_id))
  return allDrillIds.filter(id => !doneDrillIds.has(id))
}

export async function getBlockDrillProgress(blockId) {
  const { data: block, error } = await supabase
    .from('training_blocks')
    .select('template_id, session_count')
    .eq('id', blockId)
    .single()
  if (error) throw error

  const tpl = await getTemplate(block.template_id)
  const totalDrills = block.session_count * tpl.drills.length

  const { data: completedSessions } = await supabase
    .from('sessions')
    .select('id')
    .eq('block_id', blockId)
    .eq('status', 'completed')

  const sessionIds = (completedSessions || []).map(s => s.id)

  let drillsDone = 0
  if (sessionIds.length > 0) {
    const { count } = await supabase
      .from('session_drills')
      .select('id', { count: 'exact', head: true })
      .in('session_id', sessionIds)
      .not('score', 'is', null)
      .eq('skipped', false)
    drillsDone = count ?? 0
  }

  return { drillsDone, totalDrills }
}

// ─── Progress ────────────────────────────────────────────────────────────────

// Returns { drillId: { drill, entries: [{ date, score, blockName, sessionNumber }] } }
export async function getProgressForAllDrills() {
  const { data, error } = await supabase
    .from('session_drills')
    .select(`
      score,
      skipped,
      sort_order,
      drills(*),
      sessions!inner(
        session_number,
        session_date,
        status,
        training_blocks!inner(name, status)
      )
    `)
    .eq('sessions.status', 'completed')
    .not('score', 'is', null)
    .eq('skipped', false)
  if (error) throw error

  const map = {}
  for (const row of data) {
    const drill = row.drills
    if (!map[drill.id]) map[drill.id] = { drill, entries: [] }
    map[drill.id].entries.push({
      date: row.sessions.session_date,
      score: Number(row.score),
      blockName: row.sessions.training_blocks.name,
      sessionNumber: row.sessions.session_number,
    })
  }

  // Sort entries chronologically by session number
  for (const id of Object.keys(map)) {
    map[id].entries.sort((a, b) => a.sessionNumber - b.sessionNumber)
  }

  return map
}

// Get first + last scores per drill for a completed block
export async function getBlockCompletionSummary(blockId) {
  const { data, error } = await supabase
    .from('session_drills')
    .select(`
      score,
      drills(*),
      sessions!inner(session_number, status, block_id)
    `)
    .eq('sessions.block_id', blockId)
    .eq('sessions.status', 'completed')
    .not('score', 'is', null)
    .order('sessions.session_number', { ascending: true })
  if (error) throw error

  const map = {}
  for (const row of data) {
    const drill = row.drills
    if (!map[drill.id]) map[drill.id] = { drill, scores: [] }
    map[drill.id].scores.push(Number(row.score))
  }
  return Object.values(map).map(({ drill, scores }) => ({
    drill,
    first: scores[0],
    last: scores[scores.length - 1],
    best: drill.scoring_direction === 'higher_better'
      ? Math.max(...scores)
      : Math.min(...scores),
  }))
}
