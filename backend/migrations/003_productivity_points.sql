/* simple table to track user points tasks workload */
CREATE TABLE IF NOT EXISTS productivity_point_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('task_completed', 'task_reopened')),
  points INTEGER NOT NULL,
  base_points INTEGER NOT NULL DEFAULT 0,
  workload_points INTEGER NOT NULL DEFAULT 0,
  early_bonus_points INTEGER NOT NULL DEFAULT 0,
  streak_bonus_points INTEGER NOT NULL DEFAULT 0,
  streak_day_count INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reverses_event_id INTEGER REFERENCES productivity_point_events(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/*speed up checking for specific points (+)jump rows which speeds up search (-) insert/update operations are slower*/
CREATE INDEX IF NOT EXISTS idx_productivity_events_user_id ON productivity_point_events(user_id);
CREATE INDEX IF NOT EXISTS idx_productivity_events_task_id ON productivity_point_events(task_id);
CREATE INDEX IF NOT EXISTS idx_productivity_events_activity_date ON productivity_point_events(activity_date);
CREATE INDEX IF NOT EXISTS idx_productivity_events_reverses_event_id ON productivity_point_events(reverses_event_id);
