const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};
const addHours = (date, hours) => {
  const d = new Date(date);
  d.setHours(d.getHours() + hours);
  return d;
};

const addMinutes = (date, minutes) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() + minutes);
  return d;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const SCHEDULE_INTERVAL_MINUTES = 15;
const FALLBACK_SCHEDULE_DAYS = 7;

const roundUpToNextInterval = (date, intervalMinutes = SCHEDULE_INTERVAL_MINUTES) => {
  const rounded = new Date(date);
  const intervalMs = intervalMinutes * 60 * 1000;
  const roundedTime = Math.ceil(rounded.getTime() / intervalMs) * intervalMs;
  rounded.setTime(roundedTime);
  rounded.setSeconds(0, 0);
  return rounded;
};

const getStudyBlockStartTime = (date, preferredStart) => {
  const defaultStart = 9; // 9 AM default

  if (preferredStart) {
    const [hours, minutes] = preferredStart.split(':').map(Number);
    const blockStart = new Date(date);
    blockStart.setHours(hours, minutes, 0, 0);
    return blockStart;
  }

  const blockStart = new Date(date);
  blockStart.setHours(defaultStart, 0, 0, 0);
  return blockStart;
};

// Rank incomplete tasks by deadline, then priority, then shorter duration.
function compareTasks(a, b) {
  if (a.status === 'completed' && b.status !== 'completed') return 1;
  if (b.status === 'completed' && a.status !== 'completed') return -1;

  const dateA = a.deadline ? new Date(a.deadline) : null;
  const dateB = b.deadline ? new Date(b.deadline) : null;
  const hasValidDeadlineA = dateA && !Number.isNaN(dateA.getTime());
  const hasValidDeadlineB = dateB && !Number.isNaN(dateB.getTime());

  if (hasValidDeadlineA && hasValidDeadlineB) {
    if (dateA.getTime() !== dateB.getTime()) return dateA - dateB;
  }
  if (hasValidDeadlineA && !hasValidDeadlineB) return -1;
  if (!hasValidDeadlineA && hasValidDeadlineB) return 1;

  if (a.priority !== b.priority) return b.priority - a.priority;
  return (a.estimated_minutes || 60) - (b.estimated_minutes || 60);
}

const blocksOverlap = (startA, endA, startB, endB) => startA < endB && endA > startB;

const isTimeAvailable = (proposedStart, proposedEnd, blockedTimes) => {
  for (const { start, end } of blockedTimes) {
    if (blocksOverlap(proposedStart, proposedEnd, start, end)) return false;
  }
  return true;
};

const getLessonBlocksForDay = async (userId, date, database) => {
  const { rows } = await database.query(
    `SELECT start_time, end_time FROM lessons
     WHERE user_id = $1 AND day_of_week = $2`,
    [userId, date.getDay()]
  );

  return rows.map(({ start_time, end_time }) => {
    const [startHour, startMinute] = String(start_time).split(':').map(Number);
    const [endHour, endMinute] = String(end_time).split(':').map(Number);
    const start = new Date(date);
    const end = new Date(date);
    start.setHours(startHour, startMinute, 0, 0);
    end.setHours(endHour, endMinute, 0, 0);
    return { start, end };
  });
};

async function generateSchedule(userId, database) {
  try {
    const { rows: tasks } = await database.query(
      `SELECT id, user_id, module_id, title, deadline, estimated_minutes,
              priority, status, preferred_start_time, preferred_end_time
       FROM tasks
       WHERE user_id = $1 AND status NOT IN ('completed', 'cancelled')`,
      [userId]
    );

    await database.query(
      `DELETE FROM study_sessions
       WHERE user_id = $1 AND status = 'scheduled'`,
      [userId]
    );

    const { rows: existingSessions } = await database.query(
      `SELECT scheduled_start, scheduled_end FROM study_sessions
       WHERE user_id = $1 AND status != 'cancelled'`,
      [userId]
    );

    if (!tasks.length) return { message: 'No incomplete tasks', sessions: [] };

    const sortedTasks = tasks.sort(compareTasks);

    const sessions = [];
    const generatedSessionBlocks = existingSessions.map((session) => ({
      start: new Date(session.scheduled_start),
      end: new Date(session.scheduled_end),
    }));
    const now = new Date();

    for (const task of sortedTasks) {
      const estimatedMinutes = task.estimated_minutes || 60;
      const blockDuration = Math.min(120, estimatedMinutes); // max 2 hours per block
      const numBlocks = Math.ceil(estimatedMinutes / blockDuration);

      const taskDeadline = task.deadline ? new Date(task.deadline) : null;
      const hasValidDeadline = taskDeadline && !Number.isNaN(taskDeadline.getTime());
      const isOverdue = hasValidDeadline && taskDeadline < now;
      const windowEnd = isOverdue
        ? addDays(now, 1)
        : hasValidDeadline
          ? taskDeadline
          : addDays(now, FALLBACK_SCHEDULE_DAYS);
      let currentDay = startOfDay(now);
      let blocksAllocated = 0;

      while (blocksAllocated < numBlocks && currentDay <= windowEnd) {
        // Fixed lessons/tutorials/labs block candidate study time.
        const lessonBlocks = await getLessonBlocksForDay(userId, currentDay, database);
        const blockedTimes = [...lessonBlocks, ...generatedSessionBlocks];

        // Generated sessions use rounded starts so the calendar never lands on odd minutes.
        let candidate = roundUpToNextInterval(
          getStudyBlockStartTime(currentDay, task.preferred_start_time)
        );
        if (candidate < now) candidate = roundUpToNextInterval(now);

        const dayEnd = new Date(currentDay);
        if (task.preferred_end_time) {
          const [hours, minutes] = String(task.preferred_end_time).split(':').map(Number);
          dayEnd.setHours(hours, minutes, 0, 0);
        } else {
          dayEnd.setHours(23, 59, 59, 999);
        }
        const candidateWindowEnd = dayEnd < windowEnd ? dayEnd : windowEnd;

        // Search within the day instead of retrying the same colliding start time.
        while (blocksAllocated < numBlocks) {
          const remainingMinutes = estimatedMinutes - (blocksAllocated * blockDuration);
          const currentBlockMinutes = Math.min(blockDuration, remainingMinutes);
          const blockEnd = addHours(candidate, currentBlockMinutes / 60);
          if (blockEnd > candidateWindowEnd) break;

          if (isTimeAvailable(candidate, blockEnd, blockedTimes)) {
            const sessionResult = await database.query(
              `INSERT INTO study_sessions
                (user_id, task_id, scheduled_start, scheduled_end, status)
                VALUES ($1, $2, $3, $4, 'scheduled')
                RETURNING id, user_id, task_id, scheduled_start, scheduled_end, status`,
              [userId, task.id, candidate.toISOString(), blockEnd.toISOString()]
            );

            sessions.push(sessionResult.rows[0]);
            // Block the newly generated session immediately for the rest of this run.
            const generatedBlock = { start: new Date(candidate), end: new Date(blockEnd) };
            generatedSessionBlocks.push(generatedBlock);
            blockedTimes.push(generatedBlock);
            blocksAllocated++;
            candidate = roundUpToNextInterval(blockEnd);
          } else {
            candidate = roundUpToNextInterval(addMinutes(candidate, SCHEDULE_INTERVAL_MINUTES));
          }
        }

        currentDay = addDays(currentDay, 1);
      }

      if (blocksAllocated < numBlocks) {
        console.warn(`Only allocated ${blocksAllocated}/${numBlocks} blocks for "${task.title}"`);
      }
    }

    return { message: `Schedule generated with ${sessions.length} session(s)`, sessions };
  } catch (err) {
    console.error('Schedule generation error:', err);
    throw err;
  }
}

const getSchedule = async (userId, database) => {
  try {
    const [sessionResult, lessonResult] = await Promise.all([
      database.query(
        `SELECT
          ss.id, ss.user_id, ss.task_id, ss.scheduled_start, ss.scheduled_end,
          ss.actual_start, ss.actual_end, ss.status, ss.created_at,
          t.title AS task_title, t.priority AS task_priority, t.module_id, m.module_code, m.module_name, m.color AS module_color
        FROM study_sessions ss
        LEFT JOIN tasks t ON ss.task_id = t.id
        LEFT JOIN modules m ON t.module_id = m.id
        WHERE ss.user_id = $1
          AND ss.status != 'cancelled'
          AND (t.id IS NULL OR t.status NOT IN ('completed', 'cancelled'))
        ORDER BY ss.scheduled_start ASC`,
        [userId]
      ),
      database.query(
        `SELECT
          l.id, l.day_of_week, l.start_time, l.end_time, l.activity_type,
          l.module_id, m.module_code, m.module_name, m.color AS module_color
        FROM lessons l
        LEFT JOIN modules m ON l.module_id = m.id
        WHERE l.user_id = $1
        ORDER BY l.day_of_week ASC, l.start_time ASC`,
        [userId]
      ),
    ]);

    return { sessions: sessionResult.rows, lessons: lessonResult.rows };
  } catch (err) {
    console.error('Get schedule error:', err);
    throw err;
  }
};

const updateSession = async (userId, sessionId, fields, database) => {
  const { scheduled_start, scheduled_end, status } = fields;
 
  const updates = [];
  const params = [];
  let paramCount = 1;
 
  if (scheduled_start !== undefined) {
    updates.push(`scheduled_start = $${paramCount++}`);
    params.push(scheduled_start);
  }
 
  if (scheduled_end !== undefined) {
    updates.push(`scheduled_end = $${paramCount++}`);
    params.push(scheduled_end);
  }
 
  if (status !== undefined) {
    updates.push(`status = $${paramCount++}`);
    params.push(status);
  }
 
  if (updates.length === 0) {
    return { error: 'NO_FIELDS' };
  }
 
  updates.push(`updated_at = CURRENT_TIMESTAMP`);
 
  params.push(sessionId);
  const sessionIdParam = paramCount++;
 
  params.push(userId);
  const userIdParam = paramCount++;
 
  const result = await database.query(
    `UPDATE study_sessions
     SET ${updates.join(', ')}
     WHERE id = $${sessionIdParam} AND user_id = $${userIdParam}
     RETURNING id, user_id, task_id, scheduled_start, scheduled_end, actual_start, actual_end, status, created_at, updated_at`,
    params
  );
 
  if (result.rows.length === 0) {
    return { error: 'NOT_FOUND' };
  }
 
  return { session: result.rows[0] };
};

module.exports = {
  compareTasks,
  blocksOverlap,
  generateSchedule,
  getSchedule,
  updateSession,
  getLessonBlocksForDay,
  isTimeAvailable,
  roundUpToNextInterval,
};
