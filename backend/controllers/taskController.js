// Task Controller
// Handles CRUD operations for tasks

const pool = require('../config/db');

// Get all tasks for the current user
const getTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { module_id, status } = req.query;

    let query = `
      SELECT
        t.id, t.user_id, t.module_id, t.title, t.description,
        t.deadline, t.estimated_minutes, t.priority, t.status,
        t.preferred_start_time, t.preferred_end_time, t.created_at, t.updated_at,
        m.module_code, m.module_name, m.color
      FROM tasks t
      LEFT JOIN modules m ON t.module_id = m.id
      WHERE t.user_id = $1
    `;
    const params = [userId];
    let paramCount = 2;

    if (module_id) {
      query += ` AND t.module_id = $${paramCount++}`;
      params.push(module_id);
    }

    if (status) {
      query += ` AND t.status = $${paramCount++}`;
      params.push(status);
    }

    query += ` ORDER BY t.deadline ASC, t.priority DESC`;

    const result = await pool.query(query, params);

    res.json({
      tasks: result.rows,
    });
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ error: 'Failed to retrieve tasks' });
  }
};

// Create a new task
const createTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      title,
      description,
      module_id,
      deadline,
      estimated_minutes,
      priority,
      preferred_start_time,
      preferred_end_time
    } = req.body;

    // Validate required inputs
    if (!title || !module_id) {
      return res.status(400).json({ error: 'Title and module_id are required' });
    }

    if (title.length > 255) {
      return res.status(400).json({ error: 'Title must be 255 characters or less' });
    }

    if (description && description.length > 1000) {
      return res.status(400).json({ error: 'Description must be 1000 characters or less' });
    }

    // Validate estimated_minutes
    if (estimated_minutes !== undefined) {
      if (typeof estimated_minutes !== 'number' || estimated_minutes < 0) {
        return res.status(400).json({ error: 'Estimated minutes must be a positive number' });
      }
    }

    // Validate priority
    if (priority !== undefined) {
      if (typeof priority !== 'number' || priority < 1 || priority > 5) {
        return res.status(400).json({ error: 'Priority must be between 1 and 5' });
      }
    }

    // Verify module belongs to user
    const moduleCheck = await pool.query(
      'SELECT id FROM modules WHERE id = $1 AND user_id = $2',
      [module_id, userId]
    );

    if (moduleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Validate time format if provided (HH:MM:SS)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    if (preferred_start_time && !timeRegex.test(preferred_start_time)) {
      return res.status(400).json({ error: 'Preferred start time must be in HH:MM or HH:MM:SS format' });
    }
    if (preferred_end_time && !timeRegex.test(preferred_end_time)) {
      return res.status(400).json({ error: 'Preferred end time must be in HH:MM or HH:MM:SS format' });
    }

    // Insert new task
    const result = await pool.query(
      `INSERT INTO tasks
        (user_id, module_id, title, description, deadline, estimated_minutes, priority, preferred_start_time, preferred_end_time)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, user_id, module_id, title, description, deadline, estimated_minutes, priority, status, preferred_start_time, preferred_end_time, created_at, updated_at`,
      [userId, module_id, title, description || null, deadline || null, estimated_minutes || null, priority || 1, preferred_start_time || null, preferred_end_time || null]
    );

    const newTask = result.rows[0];

    res.status(201).json({
      message: 'Task created successfully',
      task: newTask,
    });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

// Update a task
const updateTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;
    const { title, description, deadline, estimated_minutes, priority, status, preferred_start_time, preferred_end_time } = req.body;

    // Verify task belongs to user
    const taskExists = await pool.query(
      'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
      [taskId, userId]
    );

    if (taskExists.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Build dynamic update query
    const updates = [];
    const params = [];
    let paramCount = 1;

    if (title !== undefined) {
      if (title.length > 255) {
        return res.status(400).json({ error: 'Title must be 255 characters or less' });
      }
      updates.push(`title = $${paramCount++}`);
      params.push(title);
    }

    if (description !== undefined) {
      if (description.length > 1000) {
        return res.status(400).json({ error: 'Description must be 1000 characters or less' });
      }
      updates.push(`description = $${paramCount++}`);
      params.push(description || null);
    }

    if (deadline !== undefined) {
      updates.push(`deadline = $${paramCount++}`);
      params.push(deadline || null);
    }

    if (estimated_minutes !== undefined) {
      if (typeof estimated_minutes !== 'number' || estimated_minutes < 0) {
        return res.status(400).json({ error: 'Estimated minutes must be a positive number' });
      }
      updates.push(`estimated_minutes = $${paramCount++}`);
      params.push(estimated_minutes);
    }

    if (priority !== undefined) {
      if (typeof priority !== 'number' || priority < 1 || priority > 5) {
        return res.status(400).json({ error: 'Priority must be between 1 and 5' });
      }
      updates.push(`priority = $${paramCount++}`);
      params.push(priority);
    }

    if (status !== undefined) {
      const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Status must be one of: pending, in_progress, completed, cancelled' });
      }
      updates.push(`status = $${paramCount++}`);
      params.push(status);
    }

    if (preferred_start_time !== undefined) {
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
      if (preferred_start_time && !timeRegex.test(preferred_start_time)) {
        return res.status(400).json({ error: 'Preferred start time must be in HH:MM or HH:MM:SS format' });
      }
      updates.push(`preferred_start_time = $${paramCount++}`);
      params.push(preferred_start_time || null);
    }

    if (preferred_end_time !== undefined) {
      const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
      if (preferred_end_time && !timeRegex.test(preferred_end_time)) {
        return res.status(400).json({ error: 'Preferred end time must be in HH:MM or HH:MM:SS format' });
      }
      updates.push(`preferred_end_time = $${paramCount++}`);
      params.push(preferred_end_time || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(taskId);
    const taskIdParam = paramCount++;

    params.push(userId);
    const userIdParam = paramCount++;

    const query = `
      UPDATE tasks
      SET ${updates.join(', ')}
      WHERE id = $${taskIdParam} AND user_id = $${userIdParam}
      RETURNING id, user_id, module_id, title, description, deadline, estimated_minutes, priority, status, preferred_start_time, preferred_end_time, created_at, updated_at
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updatedTask = result.rows[0];

    res.json({
      message: 'Task updated successfully',
      task: updatedTask,
    });
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ error: 'Failed to update task' });
  }
};

// Delete a task
const deleteTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const taskId = req.params.id;

    // Verify task belongs to user
    const taskExists = await pool.query(
      'SELECT id FROM tasks WHERE id = $1 AND user_id = $2',
      [taskId, userId]
    );

    if (taskExists.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Delete task (cascading delete will handle study sessions)
    await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2',
      [taskId, userId]
    );

    res.json({
      message: 'Task deleted successfully',
    });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Failed to delete task' });
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
};
