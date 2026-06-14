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

      let currentDay = new Date(now);
      let blocksAllocated = 0;

      while (blocksAllocated < numBlocks && currentDay <= new Date(task.deadline)) {
        const blockStart = getStudyBlockStartTime(currentDay, task.preferred_start_time);

        if (blockStart >= new Date(task.deadline)) break;
        if (blockStart < now) {
          currentDay = addDays(currentDay, 1);
          continue;
        }

        const blockEnd = addHours(blockStart, blockDuration / 60);

        if (blockEnd > new Date(task.deadline)) {
          currentDay = addDays(currentDay, 1);
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

// Fetch and return current schedule
const getSchedule = async (userId, pool) => {
  try {
    const result = await pool.query(
      `SELECT
        ss.id, ss.user_id, ss.task_id, ss.scheduled_start, ss.scheduled_end,
        ss.actual_start, ss.actual_end, ss.status, ss.created_at,
        t.title, t.module_id, m.module_code, m.module_name
      FROM study_sessions ss
      LEFT JOIN tasks t ON ss.task_id = t.id
      LEFT JOIN modules m ON t.module_id = m.id
      WHERE ss.user_id = $1 AND ss.status != 'cancelled'
      ORDER BY ss.scheduled_start ASC`,
      [userId]
    );

    return result.rows;
  } catch (err) {
    console.error('Get schedule error:', err);
    throw err;
  }
};

module.exports = {
  compareTasks,
  calculateTaskScore,
  generateSchedule,
  getSchedule,
};
