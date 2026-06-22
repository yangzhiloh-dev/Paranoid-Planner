const toDateKey = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
};

const addDays = (dateKey, amount) => {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return toDateKey(date);
};

const clampPriority = (priority) => {
  const value = Number(priority || 1);
  if (!Number.isFinite(value)) return 1;
  return Math.min(5, Math.max(1, Math.round(value)));
};

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

const getConsecutiveStreakEndingOn = (dateSet, dateKey) => {
  let streak = 0;
  let cursor = dateKey;

  while (dateSet.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
};

const getTaskPointBreakdown = (task, context = {}) => {
  //This is simple rules for points system, find priority, perceived workload and if task complete b4 deadline
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

  //tracking streaks: simple -> if u complete task add a point 
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
