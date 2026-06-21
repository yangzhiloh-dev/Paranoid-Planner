export const DAY_MS = 86400000;

export const startOfWeek = (value = new Date()) => {
  const date = new Date(value);
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const validDate = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

export const shortDate = (value) => {
  const date = validDate(value);
  return date
    ? date.toLocaleDateString([], { day: 'numeric', month: 'short' })
    : 'No date';
};

export const shortTime = (value) => {
  const date = validDate(value);
  return date
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';
};

export const getModule = (modules, moduleId) =>
  modules.find((module) => String(module.id) === String(moduleId));

export const isPendingTask = (task) =>
  task.status !== 'completed' && task.status !== 'cancelled';

export const getPendingTasks = (tasks) =>
  [...tasks]
    .filter(isPendingTask)
    .sort((a, b) => {
      const first = validDate(a.deadline)?.getTime() ?? Infinity;
      const second = validDate(b.deadline)?.getTime() ?? Infinity;
      return first - second || Number(b.priority || 0) - Number(a.priority || 0);
    });

export const getPriorityLabel = (priority) => {
  const value = Number(priority || 0);
  if (value >= 4) return 'High priority';
  if (value >= 3) return 'Medium priority';
  return 'Low priority';
};

// Pressure is based only on active work: priority 5 or a deadline within three
// days is High; a deadline within seven days is Medium; everything else is Stable.
export const getModulePressure = (modules, tasks, now = new Date()) => {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const inThreeDays = now.getTime() + 3 * DAY_MS;
  const inSevenDays = now.getTime() + 7 * DAY_MS;
  const pendingTasks = getPendingTasks(tasks);

  return modules.map((module) => {
    const moduleTasks = pendingTasks.filter(
      (task) => String(task.module_id) === String(module.id)
    );
    const deadlines = moduleTasks
      .map((task) => validDate(task.deadline))
      .filter(Boolean)
      .sort((a, b) => a - b);
    const dueThisWeek = deadlines.filter(
      (deadline) =>
        deadline.getTime() >= today.getTime() &&
        deadline.getTime() <= inSevenDays
    ).length;
    const hasHighPressure = moduleTasks.some((task) => {
      const deadline = validDate(task.deadline);
      return (
        Number(task.priority || 0) >= 5 ||
        (deadline && deadline.getTime() <= inThreeDays)
      );
    });
    const hasMediumPressure = deadlines.some(
      (deadline) => deadline.getTime() <= inSevenDays
    );

    return {
      ...module,
      pendingCount: moduleTasks.length,
      dueThisWeek,
      nearestDeadline: deadlines[0] || null,
      pressure: hasHighPressure
        ? 'High'
        : hasMediumPressure
          ? 'Medium'
          : 'Stable',
    };
  });
};

// The next move favors the earliest incomplete deadline, using priority as the
// tie-breaker. A shorter first session keeps large estimates approachable.
export const getRecommendedNextMove = (tasks, modules) => {
  const task = getPendingTasks(tasks)[0];
  if (!task) return null;

  const estimatedMinutes = Number(task.estimated_minutes || 45);
  return {
    task,
    module: getModule(modules, task.module_id),
    priorityLabel: getPriorityLabel(task.priority),
    sessionMinutes: Math.min(60, Math.max(25, estimatedMinutes)),
  };
};

export const getWeeklyProgress = (tasks, now = new Date()) => {
  const weekStart = startOfWeek(now);
  const weekEnd = new Date(weekStart.getTime() + 7 * DAY_MS);
  const weeklyTasks = tasks.filter((task) => {
    const deadline = validDate(task.deadline);
    return (
      task.status !== 'cancelled' &&
      deadline &&
      deadline >= weekStart &&
      deadline < weekEnd
    );
  });
  const completed = weeklyTasks.filter(
    (task) => task.status === 'completed'
  ).length;

  return {
    completed,
    total: weeklyTasks.length,
    rate: weeklyTasks.length
      ? Math.round((completed / weeklyTasks.length) * 100)
      : 0,
  };
};
