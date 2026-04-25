export type ScoringDirection = 'higher_better' | 'lower_better'
export type BlockStatus = 'active' | 'completed'
export type SessionStatus = 'in_progress' | 'completed'

export interface Drill {
  id: string
  name: string
  description: string
  instructions: string
  scoring_direction: ScoringDirection
  max_score: number | null
  min_score: number
  unit: string
  is_default: boolean
  created_at: string
}

export interface BlockTemplate {
  id: string
  name: string
  description: string | null
  session_count: number
  is_default: boolean
  created_at: string
  drills?: TemplateDrill[]
}

export interface TemplateDrill {
  id: string
  template_id: string
  drill_id: string
  sort_order: number
  drill: Drill
}

export interface TrainingBlock {
  id: string
  template_id: string | null
  name: string
  session_count: number
  status: BlockStatus
  started_at: string
  completed_at: string | null
}

export interface Session {
  id: string
  block_id: string
  session_number: number
  session_date: string
  status: SessionStatus
  notes: string | null
  created_at: string
}

export interface SessionDrill {
  id: string
  session_id: string
  drill_id: string
  score: number | null
  sort_order: number
  skipped: boolean
  drill: Drill
}

// Composite types for UI

export interface ActiveBlockInfo {
  block: TrainingBlock
  nextSession: Session | null
  inProgressSession: Session | null
  completedCount: number
  lastSessionDrills: SessionDrill[]
}

export interface SessionWithDrills extends Session {
  drills: SessionDrill[]
  block: TrainingBlock
}

export interface BlockWithSessions extends TrainingBlock {
  sessions: SessionWithHistory[]
  template: BlockTemplate | null
}

export interface SessionWithHistory extends Session {
  drills: SessionDrill[]
}

export interface DrillProgress {
  drill: Drill
  dataPoints: ProgressDataPoint[]
  personalBest: number | null
  blockBoundaries: BlockBoundary[]
}

export interface ProgressDataPoint {
  date: string
  score: number
  blockName: string
  sessionNumber: number
  blockId: string
  source: 'session' | 'standalone'
}

export interface BlockBoundary {
  date: string
  blockName: string
  blockId: string
}

export interface DrillLog {
  id: string
  drill_id: string
  score: number
  logged_at: string
  notes: string | null
  created_at: string
}
