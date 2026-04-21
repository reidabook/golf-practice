CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Individual drill definitions (library)
CREATE TABLE IF NOT EXISTS drills (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  description       TEXT NOT NULL,
  instructions      TEXT NOT NULL,
  scoring_direction TEXT NOT NULL CHECK (scoring_direction IN ('higher_better', 'lower_better')),
  max_score         INTEGER,
  min_score         INTEGER NOT NULL DEFAULT 0,
  unit              TEXT NOT NULL,
  is_default        BOOLEAN NOT NULL DEFAULT false,
  category          TEXT CHECK (category IN ('putting', 'chipping', 'approach', 'driving')),
  source            TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT drills_name_unique UNIQUE (name)
);

-- Reusable block templates
CREATE TABLE IF NOT EXISTS block_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  description   TEXT,
  session_count INTEGER NOT NULL DEFAULT 8,
  is_default    BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ordered drills within a template
CREATE TABLE IF NOT EXISTS block_template_drills (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES block_templates(id) ON DELETE CASCADE,
  drill_id    UUID NOT NULL REFERENCES drills(id) ON DELETE RESTRICT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  UNIQUE (template_id, drill_id)
);

-- Active or completed block instances
CREATE TABLE IF NOT EXISTS training_blocks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id   UUID REFERENCES block_templates(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  session_count INTEGER NOT NULL,
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ
);

-- Sessions within a training block
CREATE TABLE IF NOT EXISTS sessions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id       UUID NOT NULL REFERENCES training_blocks(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL,
  session_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  status         TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (block_id, session_number)
);

-- Drill scores per session
CREATE TABLE IF NOT EXISTS session_drills (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  drill_id   UUID NOT NULL REFERENCES drills(id) ON DELETE RESTRICT,
  score      NUMERIC,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE (session_id, drill_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_session_drills_session  ON session_drills(session_id);
CREATE INDEX IF NOT EXISTS idx_session_drills_drill    ON session_drills(drill_id);
CREATE INDEX IF NOT EXISTS idx_sessions_block          ON sessions(block_id);
CREATE INDEX IF NOT EXISTS idx_training_blocks_status  ON training_blocks(status);
CREATE INDEX IF NOT EXISTS idx_btd_template            ON block_template_drills(template_id);

-- =====================
-- SEED DATA (idempotent)
-- =====================

INSERT INTO drills (name, description, instructions, scoring_direction, max_score, min_score, unit, is_default)
VALUES
  (
    '3-Foot Putts',
    'Make 25 putts in a row from 3 feet. Your score is the number of misses before completing the streak.',
    'Set up 5 tees, each 1 pace (3 feet) from the hole. Rotate around the tees after each putt until you make 25 putts in a row. If you miss, start over. Your score is the number of missed putts before successfully making 25 straight. A perfect score is 0.',
    'lower_better', NULL, 0, 'misses', true
  ),
  (
    'Drawback Drill',
    'Play 9 holes on the putting green, par 2 each. Every missed putt gets drawn back one putter length. Score relative to par.',
    'Play 9 holes on the putting green. Each is a par 2. Each hole should be 7–15 paces from the hole. Every time you miss a putt, you must move the ball 1 putter length away from the hole before attempting the next putt. Since each hole is par 2, par for 9 holes is 18. Your total score is your score relative to par. So if you 3-putt every hole, that''s a 27 or +9 — you''d enter 9.',
    'lower_better', NULL, 0, 'over par', true
  ),
  (
    '5-to-5 Drill',
    'Chip 25 balls from 25 yards across 5 holes. Score 1 point per ball that stops within 5 feet of the hole.',
    'Pick a spot to chip 25 yards from a hole. Hit 5 balls. You get 1 point for every ball that stops within 5 feet. Repeat for 5 holes, each 25 yards. Log your total score after 5 holes. Your score is the total number of balls out of 25 that stopped within 5 feet of the hole.',
    'higher_better', 25, 0, 'out of 25', true
  ),
  (
    '75 Yard Wedge',
    'Hit 10 range balls trying to land exactly 75 yards. Score 1 point per ball within 5 yards of the target.',
    'Hit 10 balls on the range trying to land exactly 75 yards. Your score is the total number of balls that land within 5 yards of your 75-yard target. A perfect score is 10.',
    'higher_better', 10, 0, 'out of 10', true
  ),
  (
    'Irons — Short on Purpose',
    'Hit 10 iron shots at 80% power. Score 1 point per ball that lands cleanly at least 10 yards short of your normal distance.',
    'Hit 10 balls with your favorite iron. The goal is to land the ball short of what you normally hit that club. Your score is the total number of balls that you hit cleanly AND land at least 10 yards short of what you normally hit that club. Think 80% swings. A perfect score is 10.',
    'higher_better', 10, 0, 'out of 10', true
  ),
  (
    'Safe Side Drill',
    'Create a 40-yard fairway on the range with one safe miss side. Fairway = +1, Safe miss = −1, OB miss = −3.',
    'Create a "Fairway" on your driving range about 40 yards wide. Pick one miss side to be the "safe" side and the other to be "OB". Scoring: Fairway = +1, Safe miss = −1, OB miss = −3. Your score is the sum of all points from your 10 shots. A perfect score is +10.',
    'higher_better', 10, -30, 'points', true
  )
ON CONFLICT (name) DO NOTHING;

INSERT INTO block_templates (name, description, session_count, is_default)
VALUES (
  'Break 90 Program',
  'An 8-session program designed to help you break 90 by building fundamentals across putting, short game, and course management.',
  8,
  true
)
ON CONFLICT DO NOTHING;

-- =====================
-- SUPABASE: Row Level Security
-- This app has no auth — allow all operations from the anon key.
-- Run these after the tables are created.
-- =====================
ALTER TABLE drills               ENABLE ROW LEVEL SECURITY;
ALTER TABLE block_templates      ENABLE ROW LEVEL SECURITY;
ALTER TABLE block_template_drills ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_blocks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_drills       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all" ON drills                FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON block_templates       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON block_template_drills FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON training_blocks       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON sessions              FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all" ON session_drills        FOR ALL USING (true) WITH CHECK (true);

-- Link all 6 drills to the Break 90 template (in order)
DO $$
DECLARE
  tmpl_id UUID;
  drill_ids UUID[];
  i INT;
BEGIN
  SELECT id INTO tmpl_id FROM block_templates WHERE name = 'Break 90 Program';

  SELECT ARRAY(
    SELECT id FROM drills
    WHERE name IN (
      '3-Foot Putts',
      'Drawback Drill',
      '5-to-5 Drill',
      '75 Yard Wedge',
      'Irons — Short on Purpose',
      'Safe Side Drill'
    )
    ORDER BY CASE name
      WHEN '3-Foot Putts'              THEN 1
      WHEN 'Drawback Drill'            THEN 2
      WHEN '5-to-5 Drill'             THEN 3
      WHEN '75 Yard Wedge'            THEN 4
      WHEN 'Irons — Short on Purpose' THEN 5
      WHEN 'Safe Side Drill'          THEN 6
    END
  ) INTO drill_ids;

  FOR i IN 1..array_length(drill_ids, 1) LOOP
    INSERT INTO block_template_drills (template_id, drill_id, sort_order)
    VALUES (tmpl_id, drill_ids[i], i)
    ON CONFLICT (template_id, drill_id) DO NOTHING;
  END LOOP;
END $$;
