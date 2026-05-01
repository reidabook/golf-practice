export type ScoringDirection = 'higher_better' | 'lower_better'
export type BlockStatus = 'active' | 'completed'
export type TrendDirection = 'better' | 'worse' | 'same' | 'first'

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
  target_days: number
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
  target_days: number
  status: BlockStatus
  started_at: string
  completed_at: string | null
}

export interface DrillLog {
  id: string
  block_id: string
  drill_id: string
  score: number | null
  skipped: boolean
  log_date: string
  created_at: string
}

export interface DrillLogWithDrill extends DrillLog {
  drill: Drill
}

export interface BlockDrillItem {
  drill: Drill
  sort_order: number
  done_today: boolean       // scored (not skipped) today
  last_score: number | null // most recent scored log in this block
  last_log_date: string | null
}

export interface DrillComparison {
  current_score: number
  previous_score: number | null  // null = first entry in this block
  personal_best: number | null
  trend: TrendDirection
  drill: Drill
}

export interface DrillSaveResult {
  log: DrillLog
  comparison: DrillComparison
}

export interface ActiveBlockInfo {
  block: TrainingBlock
  completed_days: number      // distinct days with ≥1 scored log
  todays_drill_count: number  // scored drills today
}

export interface DayLog {
  log_date: string
  drills: DrillLogWithDrill[]
}

export interface BlockWithDayLogs extends TrainingBlock {
  template: BlockTemplate | null
  day_logs: DayLog[]          // ordered newest first
}

// Progress chart types

export interface DrillProgress {
  drill: Pick<Drill, 'id' | 'name' | 'unit' | 'scoring_direction'>
  dataPoints: ProgressDataPoint[]
  personalBest: number | null
  blockBoundaries: BlockBoundary[]
}

export interface ProgressDataPoint {
  date: string
  score: number
  blockName: string
  blockId: string
  source: 'drill_log'
}

export interface BlockBoundary {
  blockId: string
  blockName: string
}
