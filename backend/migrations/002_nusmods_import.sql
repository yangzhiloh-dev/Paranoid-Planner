-- Upgrade an existing ParanoidPlanner database for NUSMods imports.
CREATE TABLE IF NOT EXISTS lessons (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  activity_type VARCHAR(10) NOT NULL CHECK (activity_type IN ('LEC', 'TUT', 'LAB')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CHECK (start_time < end_time)
);

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS activity_type VARCHAR(10);
UPDATE lessons SET activity_type = 'LEC' WHERE activity_type IS NULL;
ALTER TABLE lessons ALTER COLUMN activity_type SET NOT NULL;

-- Early development versions used a required title column; it is not part of lesson identity.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lessons' AND column_name = 'title'
  ) THEN
    ALTER TABLE lessons ALTER COLUMN title DROP NOT NULL;
  END IF;
END $$;

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS import_source VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_lessons_user_day ON lessons(user_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON lessons(module_id);
