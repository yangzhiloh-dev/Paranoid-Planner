/**
 * Points service
 *
 * This ensures that productivity point events are calculated correctly, and that productivity summaries are accurate.

 *
 * DB expectations (productivity_point_events):
 * - columns that will be used: id, user_id, task_id, event_type, points, base_points, workload_points,
 *   early_bonus_points, streak_bonus_points, streak_day_count, reason, activity_date, created_at, reverses_event_id
 * - activity_date is treated as a date-key string 'YYYY-MM-DD' in normalizeDateKey
 *
 * Timezone note: functions use UTC date helpers (getWeekStart uses UTC). Callers should take note of this specific choice made
 * this was made so that anyone can use and coordinate accordingly not just singapore users
 */
const {
  addDays,
  getConsecutiveStreakEndingOn,
  getTaskPointBreakdown,
  toDateKey,
} = require('./productivityGameLogic');

const getWeekStart = (value = new Date()) => {
  const date = new Date(value);
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - day + 1);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const normalizeDateKey = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  return toDateKey(value);
};

/**
 * Get the active completion dates for a user.
 * @param {Object} client - The database client.
 * @param {number} userId - The ID of the user.
 * @returns {Array} The active completion dates.
 */
const getActiveCompletionDates = async (client, userId) => {
  const result = await client.query(
    `SELECT activity_date, SUM(
        CASE
          WHEN event_type = 'task_completed' THEN 1
          WHEN event_type = 'task_reopened' THEN -1
          ELSE 0
        END
      ) AS active_count
      FROM productivity_point_events
      WHERE user_id = $1
      GROUP BY activity_date
      HAVING SUM(
        CASE
          WHEN event_type = 'task_completed' THEN 1
          WHEN event_type = 'task_reopened' THEN -1
          ELSE 0
        END
      ) > 0
      ORDER BY activity_date ASC`,
    [userId]
  );

  return result.rows.map((row) => normalizeDateKey(row.activity_date));
};

/**
 * Calculate the longest streak of consecutive active completion days.
 * @param {Array} dates - An array of date keys representing active completion days.
 * @returns {number} The length of the longest streak.
 */

const getBestStreak = (dates) => {
  if (!dates.length) return 0;

  let best = 1;
  let current = 1;

  for (let index = 1; index < dates.length; index += 1) {
    if (addDays(dates[index - 1], 1) === dates[index]) {
      current += 1;
    } else {
      current = 1;
    }

    best = Math.max(best, current);
  }

  return best;
};

/**
 * Get the point breakdown for a task completion, including any applicable bonuses.
 * @param {Object} client - The database client.
 * @param {number} userId - The ID of the user.
 * @param {Object} task - The task object.
 * @returns {Object} The point breakdown for the task completion.
 */
const getCompletionPointBreakdown = async (client, userId, task) => {
  const activeDates = await getActiveCompletionDates(client, userId);

  return getTaskPointBreakdown(task, {
    completedAt: new Date(),
    completionDates: activeDates,
  });
};

const getActiveTaskAwards = async (client, userId, taskId) => {
  const result = await client.query(
    `SELECT award.*
      FROM productivity_point_events award
      WHERE award.user_id = $1
        AND award.task_id = $2
        AND award.event_type = 'task_completed'
        AND NOT EXISTS (
          SELECT 1
          FROM productivity_point_events reversal
          WHERE reversal.reverses_event_id = award.id
        )
      ORDER BY award.created_at DESC`,
    [userId, taskId]
  );

  return result.rows;
};

/**
 * Award points for task completion.
 * @param {Object} client - The database client.
 * @param {number} userId - The ID of the user.
 * @param {Object} task - The task object.
 * @returns {Object|null} The awarded event or null if already awarded.
 */
const awardTaskCompletion = async (client, userId, task) => {
  const activeAwards = await getActiveTaskAwards(client, userId, task.id);
  if (activeAwards.length > 0) return null;

  const points = await getCompletionPointBreakdown(client, userId, task);

  const result = await client.query(
    `INSERT INTO productivity_point_events (
        user_id, task_id, event_type, points, base_points, workload_points,
        early_bonus_points, streak_bonus_points, streak_day_count, reason, activity_date
      )
      VALUES ($1, $2, 'task_completed', $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
    [
      userId,
      task.id,
      points.totalPoints,
      points.basePoints,
      points.workloadPoints,
      points.earlyBonusPoints,
      points.streakBonusPoints,
      points.streakDayCount,
      `Completed task: ${task.title}`,
      points.activityDate,
    ]
  );

  return result.rows[0];
};

/**
 * Reverse a task completion event.
 * @param {Object} client - The database client.
 * @param {number} userId - The ID of the user.
 * @param {number} taskId - The ID of the task.
 * @param {string} reason - The reason for the reversal.
 * @returns {Array} The reversed events.
 */
const reverseTaskCompletion = async (client, userId, taskId, reason = 'Task moved out of completed') => {
  const activeAwards = await getActiveTaskAwards(client, userId, taskId);
  const reversals = [];

  for (const award of activeAwards) {
    const result = await client.query(
      `INSERT INTO productivity_point_events (
          user_id, task_id, event_type, points, base_points, workload_points,
          early_bonus_points, streak_bonus_points, streak_day_count, reason,
          activity_date, reverses_event_id
        )
        VALUES ($1, $2, 'task_reopened', $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
      [
        userId,
        taskId,
        -Number(award.points),
        -Number(award.base_points),
        -Number(award.workload_points),
        -Number(award.early_bonus_points),
        -Number(award.streak_bonus_points),
        Number(award.streak_day_count || 0),
        reason,
        normalizeDateKey(award.activity_date),
        award.id,
      ]
    );

    reversals.push(result.rows[0]);
  }

  return reversals;
};

/**
 * Get the productivity summary for a user.
 * @param {Object} client - The database client.
 * @param {number} userId - The ID of the user.
 * @returns {Object} The productivity summary.
 */
const getProductivitySummary = async (client, userId) => {
  const weekStart = getWeekStart();
  const todayKey = toDateKey();
  const totals = await client.query(
    `SELECT
        COALESCE(SUM(points), 0)::INTEGER AS total_points,
        COALESCE(SUM(points) FILTER (WHERE created_at >= $2), 0)::INTEGER AS weekly_points,
        COALESCE(SUM(points) FILTER (WHERE created_at::date = CURRENT_DATE), 0)::INTEGER AS today_points
      FROM productivity_point_events
      WHERE user_id = $1`,
    [userId, weekStart]
  );
  const activeDates = await getActiveCompletionDates(client, userId);
  const activeDateSet = new Set(activeDates);
  const completedToday = activeDateSet.has(todayKey);
  const currentStreak = completedToday
    ? getConsecutiveStreakEndingOn(activeDateSet, todayKey)
    : getConsecutiveStreakEndingOn(activeDateSet, addDays(todayKey, -1));
  const recentEvents = await client.query(
    `SELECT
        e.id, e.task_id, e.event_type, e.points, e.reason, e.created_at,
        t.title AS task_title
      FROM productivity_point_events e
      LEFT JOIN tasks t ON e.task_id = t.id
      WHERE e.user_id = $1
      ORDER BY e.created_at DESC
      LIMIT 5`,
    [userId]
  );

  return {
    total_points: totals.rows[0].total_points,
    weekly_points: totals.rows[0].weekly_points,
    today_points: totals.rows[0].today_points,
    current_streak: currentStreak,
    best_streak: getBestStreak(activeDates),
    completed_today: completedToday,
    recent_events: recentEvents.rows,
  };
};

module.exports = {
  awardTaskCompletion,
  reverseTaskCompletion,
  getProductivitySummary,
};
