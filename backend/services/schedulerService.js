// Implementing basic scheduling logic

const pool = require('../config/db');

// startOfDay: getting start of the day for a given date 
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

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

// Helper: Check if time is within preferred window
const isTimeInPreferredWindow = (time, preferredStart, preferredEnd) => {
  if (!preferredStart && !preferredEnd) {
    return true; 
  }

  const timeStr = time.toTimeString().slice(0, 5); // HH:MM format
  
  if (preferredStart && preferredEnd) {
    return timeStr >= preferredStart && timeStr <= preferredEnd;
  }

  if (preferredStart) {
    return timeStr >= preferredStart;
  }

  if (preferredEnd) {
    return timeStr <= preferredEnd;
  }

  return true;
};

// Helper: Get a reasonable study block start time
const getStudyBlockStartTime = (date, preferredStart, preferredEnd) => {
  const defaultStart = 9; // 9 AM default

  // If there's a preferred window, use the start of that window
  if (preferredStart) {
    const [hours] = preferredStart.split(':').map(Number);
    const blockStart = new Date(date);
    blockStart.setHours(hours, 0, 0, 0);
    if (blockStart < new Date()) {
      return addDays(blockStart, 1);
    }

    return blockStart;
  }

  // Otherwise use default (9 AM)
  const blockStart = new Date(date);
  blockStart.setHours(defaultStart, 0, 0, 0);
  return blockStart;
};

// Compare two tasks to rank scheduling priority
function compareTasks(a, b) {
  if (a.status === 'completed' && b.status !== 'completed') return 1;
  if (b.status === 'completed' && a.status !== 'completed') return -1;

  if (a.deadline && b.deadline) {
    const dateA = new Date(a.deadline);
    const dateB = new Date(b.deadline);
    if (dateA.getTime() !== dateB.getTime()) return dateA - dateB;
  }

  if (a.priority !== b.priority) return b.priority - a.priority;
  return (a.estimated_minutes || 60) - (b.estimated_minutes || 60);
}

function calculateTaskScore(task) {
  const now = new Date();
  const deadline = new Date(task.deadline || now);
  const timeLeft = Math.max(deadline - now, 1); 
  return task.priority * 1000 / timeLeft;
}

// Returns an array of { start: Date, end: Date } for all lessons the user
// Used by the scheduler to avoid booking study blocks that overlap with fixed class times.
const getLessonBlocksForDay = async (userId, date, pool) => {
  /*const dayOfWeek = date.getDay(); // 0=Sun … 6=Sat
  const { rows } = await pool.query(
    `SELECT start_time, end_time FROM lessons
     WHERE user_id = $1 AND day_of_week = $2`,
    [userId, dayOfWeek]
  );
 
  return rows.map(({ start_time, end_time }) => {
    const [sh, sm] = start_time.split(':').map(Number);
    const [eh, em] = end_time.split(':').map(Number);
    const start = new Date(date);
    start.setHours(sh, sm, 0, 0);
    const end = new Date(date);
    end.setHours(eh, em, 0, 0);
    return { start, end };
  });*/
  return []; //placeholder until we implement lessons scheduling
};
 
// Returns true if [proposedStart, proposedEnd) doesn't overlap any blocked slot.
const isTimeAvailable = (proposedStart, proposedEnd, blockedTimes) => {
  for (const { start, end } of blockedTimes) {
    // Overlap condition: proposed starts before block ends AND ends after block starts
    if (proposedStart < end && proposedEnd > start) return false;
  }
  return true;
};

// Main scheduling algorithm
async function generateSchedule(userId, pool) {
  try {
    // Fetch incomplete tasks for the user
    const { rows: tasks } = await pool.query(
      `SELECT id, user_id, module_id, title, deadline, estimated_minutes,
              priority, status, preferred_start_time
       FROM tasks
       WHERE user_id = $1 AND status != 'completed'`,
      [userId]
    );

    await pool.query(
      `DELETE FROM study_sessions
       WHERE user_id = $1 AND status = 'scheduled'`,
      [userId]
    );

    if (!tasks.length) return { message: 'No incomplete tasks', sessions: [] };

    // Sort tasks using compareTasks
    const sortedTasks = tasks.sort(compareTasks);

    const sessions = [];
    const now = new Date();

    for (const task of sortedTasks) {
      if (!task.deadline) continue;

      const estimatedMinutes = task.estimated_minutes || 60;
      const blockDuration = Math.min(120, estimatedMinutes); // max 2 hours per block
      const numBlocks = Math.ceil(estimatedMinutes / blockDuration);

      const isOverdue = new Date(task.deadline) < now;
      const windowEnd = isOverdue ? addDays(now, 1) : new Date(task.deadline);
      let currentDay = new Date(now);
      let blocksAllocated = 0;

      while (blocksAllocated < numBlocks && currentDay <= windowEnd) {
        const lessonBlocks = await getLessonBlocksForDay(userId, currentDay, pool);
        
        let blockStart = isOverdue
          ? new Date(currentDay)
          : getStudyBlockStartTime(currentDay, task.preferred_start_time);

        if (!isOverdue && blockStart >= windowEnd) break;
        if (blockStart < now) {
          if (isOverdue) {
            blockStart = new Date(now);
          } else {
            currentDay = addDays(currentDay, 1);
            continue;
          }
        }

        const blockEnd = addHours(blockStart, blockDuration / 60);

        if (!isOverdue && blockEnd > windowEnd) {
          currentDay = addDays(currentDay, 1);
          continue;
        }

        if (!isTimeAvailable(blockStart, blockEnd, lessonBlocks)) {
          currentDay = addHours(blockStart, 1);
          continue;
        }

        // Insert study session into DB
        const sessionResult = await pool.query(
          `INSERT INTO study_sessions
            (user_id, task_id, scheduled_start, scheduled_end, status)
            VALUES ($1, $2, $3, $4, 'scheduled')
            RETURNING id, user_id, task_id, scheduled_start, scheduled_end, status`,
          [userId, task.id, blockStart.toISOString(), blockEnd.toISOString()]
        );

        sessions.push(sessionResult.rows[0]);
        blocksAllocated++;
        currentDay = isOverdue ? addHours(currentDay, blockDuration / 60) : addDays(currentDay, 1);
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

// Fetch and return current schedule
const getSchedule = async (userId, pool) => {
  try {
    const result = await pool.query(
      `SELECT
        ss.id, ss.user_id, ss.task_id, ss.scheduled_start, ss.scheduled_end,
        ss.actual_start, ss.actual_end, ss.status, ss.created_at,
        t.title AS task_title, t.priority AS task_priority, t.module_id, m.module_code, m.module_name, m.color AS module_color
      FROM study_sessions ss
      LEFT JOIN tasks t ON ss.task_id = t.id
      LEFT JOIN modules m ON t.module_id = m.id
      WHERE ss.user_id = $1 AND ss.status != 'cancelled'
      ORDER BY ss.scheduled_start ASC`,
      [userId]
    );

    return { sessions: result.rows };
  } catch (err) {
    console.error('Get schedule error:', err);
    throw err;
  }
};

// Update a single study session (e.g. reschedule its start/end time)
const updateSession = async (userId, sessionId, fields, pool) => {
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
 
  const result = await pool.query(
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
  calculateTaskScore,
  generateSchedule,
  getSchedule,
  updateSession
};
