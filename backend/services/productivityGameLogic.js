/**
 * Converts Date into "YYYY-MM-DD".
 * @param {Date|string} [value=new Date()]
 * @returns {string} date key "YYYY-MM-DD"
 */
const toDateKey = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
};

/**
 * Arithemtic ops for date keys
 * @param {string} dateKey - date key "YYYY-MM-DD"
 * @param {number} amount - number of days to add (negative to subtract)
 * @returns {string} new date key in this format "YYYY-MM-DD"
 */
const addDays = (dateKey, amount) => {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return toDateKey(date);
};

/**
 * Assign priority to in the range of [1,5].
 * Default val will be 1
 * @param {number|string} priority
 * @returns {number} integer priority between 1 and 5
 */
const clampPriority = (priority) => {
  const value = Number(priority || 1);
  if (!Number.isFinite(value)) return 1;
  return Math.min(5, Math.max(1, Math.round(value)));
};

/**
 * Ensure estimated minutes into a non-negative number eg if the user misses deadline
 * @param {number|string} estimatedMinutes
 * @returns {number} normalized estimated minutes (>= 0)
 */
const normalizeEstimatedMinutes = (estimatedMinutes) => {
  const value = Number(estimatedMinutes || 0);
  return Number.isFinite(value) && value > 0 ? value : 0;
};

const normalizeDateSet = (dates = []) =>
  new Set(
    dates
      .filter(Boolean)
      .map((date) => toDateKey(date))
  );

  /**
 * Check consecutive completion streak length
 * @param {Set<string>} dateSet - set of dateKey 
 * @param {string} dateKey - key on where we end the streak
 * @returns {number} consecutive streak length 
 */
const getConsecutiveStreakEndingOn = (dateSet, dateKey) => {
  let streak = 0;
  let cursor = dateKey;

  while (dateSet.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
};

/**
 * Here is the breakdown of points for a single task completion event.
 *
 * Inputs:
 *  - task: object should have at least:
 *      priority, estimated_minutes, deadline 
 * 
 * Returns an object w the following keys
 *  {
 *    activityDate,      // date key for the completion (YYYY-MM-DD)
 *    basePoints,        // priority * 10
 *    workloadPoints,    // ceil(estimated_minutes / 30) * 5
 *    earlyBonusPoints,  // 10 if completed on/earlier than deadline
 *    streakBonusPoints, // bonus from consecutive-day streaks (capped)
 *    streakDayCount,    // length of the consecutive streak ending on activityDate
 *    totalPoints        // sum of the above
 *  }
 *
 * Important rules:
 *  - If the task has no estimated_minutes, workloadPoints given is 0.
 *  - earlyBonusPoints applies only when a valid deadline exists and completion <= deadline.
 *  - streak calculation treats an existing completion on the same day as already-completed:
 *      - If already completed today, streakDayCount is computed including today.
 *      - Otherwise, streak is increased by 1 relative to the prior streak (if any).
 */
const getTaskPointBreakdown = (task, context = {}) => {
  const completedAt = context.completedAt || new Date();
  const completedDateKey = toDateKey(completedAt);
  const completionDates = normalizeDateSet(context.completionDates);
  const alreadyCompletedToday = completionDates.has(completedDateKey);
  const priority = clampPriority(task.priority);
  const estimatedMinutes = normalizeEstimatedMinutes(task.estimated_minutes);
  const basePoints = priority * 10;
  const workloadPoints = estimatedMinutes > 0 ? Math.ceil(estimatedMinutes / 30) * 5 : 0;
  const deadline = task.deadline ? new Date(task.deadline) : null;
  const earlyBonusPoints =
    deadline && !Number.isNaN(deadline.getTime()) && new Date(completedAt) <= deadline ? 10 : 0;
  const priorStreak = getConsecutiveStreakEndingOn(
    completionDates,
    addDays(completedDateKey, -1)
  );

  const streakDayCount = alreadyCompletedToday
    ? getConsecutiveStreakEndingOn(completionDates, completedDateKey)
    : priorStreak > 0
      ? priorStreak + 1
      : 1;
  const streakBonusPoints =
    !alreadyCompletedToday && streakDayCount > 1 ? Math.min(streakDayCount * 5, 50) : 0;

  return {
    activityDate: completedDateKey,
    basePoints,
    workloadPoints,
    earlyBonusPoints,
    streakBonusPoints,
    streakDayCount,
    totalPoints: basePoints + workloadPoints + earlyBonusPoints + streakBonusPoints,
  };
};

module.exports = {
  addDays,
  getConsecutiveStreakEndingOn,
  getTaskPointBreakdown,
  toDateKey,
};
