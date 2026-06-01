// Implementing basic scheduling logic

const pool = require('../config/db');

/* Helper List */
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
    return true; // No preference, all times OK
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

    // Make sure it's in the future
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

// Main scheduling algorithm
const generateSchedule = async (userId, pool) => {
  try {
    // Fetch incomplete tasks for the user
    const tasksResult = await pool.query(
      `SELECT
        id, user_id, module_id, title, deadline, estimated_minutes,
        priority, status, preferred_start_time, preferred_end_time
      FROM tasks
      WHERE user_id = $1 AND status != 'completed'
      ORDER BY deadline ASC, priority DESC`,
      [userId]
    );

    const tasks = tasksResult.rows;

    if (tasks.length === 0) {
      return {
        message: 'No incomplete tasks to schedule',
        sessions: [],
      };
    }

    const sessions = [];
    const now = new Date();

    // Process each task
    for (const task of tasks) {
      // Skip tasks with no deadline
      if (!task.deadline) {
        continue;
      }

      const deadline = new Date(task.deadline);
      const estimatedMinutes = task.estimated_minutes || 60;
      const blockDurationMinutes = Math.min(120, estimatedMinutes); // 2 hours max per block

      // Calculate number of blocks needed
      const numBlocks = Math.ceil(estimatedMinutes / blockDurationMinutes);

      // Calculate available days (from today to deadline)
      let currentDay = new Date(now);
      let blocksAllocated = 0;

      // Try to allocate blocks before deadline
      while (blocksAllocated < numBlocks && currentDay <= deadline) {
        // Get a study block start time for this day
        const blockStart = getStudyBlockStartTime(
          currentDay,
          task.preferred_start_time,
          task.preferred_end_time
        );

        // Skip if block start is after deadline
        if (blockStart >= deadline) {
          break;
        }

        // Skip if block start is in the past
        if (blockStart < now) {
          currentDay = addDays(currentDay, 1);
          continue;
        }

        const blockEnd = addHours(blockStart, blockDurationMinutes / 60);

        // Skip if block extends past deadline
        if (blockEnd > deadline) {
          currentDay = addDays(currentDay, 1);
          continue;
        }

        // Create study session
        try {
          const sessionResult = await pool.query(
            `INSERT INTO study_sessions
              (user_id, task_id, scheduled_start, scheduled_end, status)
              VALUES ($1, $2, $3, $4, 'scheduled')
              RETURNING id, user_id, task_id, scheduled_start, scheduled_end, status`,
            [userId, task.id, blockStart.toISOString(), blockEnd.toISOString()]
          );

          sessions.push(sessionResult.rows[0]);
          blocksAllocated++;
        } catch (err) {
          console.error('Error creating session:', err);
        }

        // Move to next possible time slot (next day)
        currentDay = addDays(currentDay, 1);
      }

      // Log if we couldn't allocate all blocks(debugging info)
      if (blocksAllocated < numBlocks) {
        console.warn(
          `Could only allocate ${blocksAllocated}/${numBlocks} blocks for task "${task.title}" (deadline: ${deadline})`
        );
      }
    }

    return {
      message: `Schedule generated with ${sessions.length} study session(s)`,
      sessions,
    };
  } catch (err) {
    console.error('Schedule generation error:', err);
    throw err;
  }
};

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
  generateSchedule,
  getSchedule,
};
