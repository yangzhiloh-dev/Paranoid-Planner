// Module Controller
// Handles CRUD operations for modules

const pool = require('../config/db');
const { importModules: importNusModsModules } = require('./moduleImportController');

// Get all modules for the current user
const getModules = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT id, user_id, module_code, module_name, color, created_at, updated_at FROM modules WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json({
      modules: result.rows,
    });
  } catch (err) {
    console.error('Get modules error:', err);
    res.status(500).json({ error: 'Failed to retrieve modules' });
  }
};

// Create a new module
const createModule = async (req, res) => {
  try {
    const userId = req.user.id;
    const { module_code, module_name, color } = req.body;

    // Validate input
    if (!module_code || !module_name) {
      return res.status(400).json({ error: 'Module code and name are required' });
    }

    if (module_code.length > 50) {
      return res.status(400).json({ error: 'Module code must be 50 characters or less' });
    }

    if (module_name.length > 255) {
      return res.status(400).json({ error: 'Module name must be 255 characters or less' });
    }

    // Validate color format (hex color code)
    const colorRegex = /^#[0-9A-Fa-f]{6}$/;
    const finalColor = color || '#3B82F6';
    if (!colorRegex.test(finalColor)) {
      return res.status(400).json({ error: 'Color must be a valid hex code (e.g., #FF5733)' });
    }

    // Check if module code already exists for this user
    const existing = await pool.query(
      'SELECT id FROM modules WHERE user_id = $1 AND module_code = $2',
      [userId, module_code]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Module code already exists for this user' });
    }

    // Insert new module
    const result = await pool.query(
      'INSERT INTO modules (user_id, module_code, module_name, color) VALUES ($1, $2, $3, $4) RETURNING id, user_id, module_code, module_name, color, created_at, updated_at',
      [userId, module_code, module_name, finalColor]
    );

    const newModule = result.rows[0];

    res.status(201).json({
      message: 'Module created successfully',
      module: newModule,
    });
  } catch (err) {
    console.error('Create module error:', err);
    res.status(500).json({ error: 'Failed to create module' });
  }
};

// Update a module
const updateModule = async (req, res) => {
  try {
    const userId = req.user.id;
    const moduleId = req.params.id;
    const { module_code, module_name, color } = req.body;

    // Verify module belongs to user
    const moduleExists = await pool.query(
      'SELECT id FROM modules WHERE id = $1 AND user_id = $2',
      [moduleId, userId]
    );

    if (moduleExists.rows.length === 0) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Build dynamic update query
    const updates = [];
    const params = [];
    let paramCount = 1;

    if (module_code !== undefined) {
      if (module_code.length > 50) {
        return res.status(400).json({ error: 'Module code must be 50 characters or less' });
      }
      updates.push(`module_code = $${paramCount++}`);
      params.push(module_code);
    }

    if (module_name !== undefined) {
      if (module_name.length > 255) {
        return res.status(400).json({ error: 'Module name must be 255 characters or less' });
      }
      updates.push(`module_name = $${paramCount++}`);
      params.push(module_name);
    }

    if (color !== undefined) {
      const colorRegex = /^#[0-9A-Fa-f]{6}$/;
      if (!colorRegex.test(color)) {
        return res.status(400).json({ error: 'Color must be a valid hex code (e.g., #FF5733)' });
      }
      updates.push(`color = $${paramCount++}`);
      params.push(color);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(moduleId);
    const moduleIdParam = paramCount++;

    params.push(userId);
    const userIdParam = paramCount++;

    const query = `
      UPDATE modules
      SET ${updates.join(', ')}
      WHERE id = $${moduleIdParam} AND user_id = $${userIdParam}
      RETURNING id, user_id, module_code, module_name, color, created_at, updated_at
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const updatedModule = result.rows[0];

    res.json({
      message: 'Module updated successfully',
      module: updatedModule,
    });
  } catch (err) {
    console.error('Update module error:', err);
    res.status(500).json({ error: 'Failed to update module' });
  }
};

// Delete a module
const deleteModule = async (req, res) => {
  try {
    const userId = req.user.id;
    const moduleId = req.params.id;

    // Verify module belongs to user
    const moduleExists = await pool.query(
      'SELECT id FROM modules WHERE id = $1 AND user_id = $2',
      [moduleId, userId]
    );

    if (moduleExists.rows.length === 0) {
      return res.status(404).json({ error: 'Module not found' });
    }

    // Delete module (cascading delete will handle tasks and study sessions)
    await pool.query(
      'DELETE FROM modules WHERE id = $1 AND user_id = $2',
      [moduleId, userId]
    );

    res.json({
      message: 'Module deleted successfully',
    });
  } catch (err) {
    console.error('Delete module error:', err);
    res.status(500).json({ error: 'Failed to delete module' });
  }
};

// Each module is upserted (created if missing, skipped if code already exists).
// Lessons and assignments are inserted fresh — existing ones for the module are replaced so re-importing is idempotent. 
const legacyImportModules = async (req, res) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const { modules } = req.body;
 
    if (!Array.isArray(modules) || modules.length === 0) {
      return res.status(400).json({ error: 'Request body must contain a non-empty "modules" array' });
    }
 
    const colorRegex = /^#[0-9A-Fa-f]{6}$/;
    const timeRegex  = /^([01]\d|2[0-3]):[0-5]\d$/;
 
    const summary = { modules_created: 0, modules_existing: 0, lessons_inserted: 0, assignments_inserted: 0, errors: [] };
 
    await client.query('BEGIN');
 
    for (const mod of modules) {
      const { module_code, module_name, color, lessons = [], assignments = [] } = mod;
 
      // validate module fields
      if (!module_code || !module_name) {
        summary.errors.push(`Skipped entry: missing module_code or module_name`);
        continue;
      }
 
      const finalColor = color && colorRegex.test(color) ? color : '#3B82F6';
 
      // Upsert module — create if not exists, reuse if it does.
      let moduleId;
      const existing = await client.query(
        'SELECT id FROM modules WHERE user_id = $1 AND module_code = $2',
        [userId, module_code]
      );
 
      if (existing.rows.length > 0) {
        moduleId = existing.rows[0].id;
        summary.modules_existing++;
      } else {
        const inserted = await client.query(
          `INSERT INTO modules (user_id, module_code, module_name, color)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [userId, module_code, module_name, finalColor]
        );
        moduleId = inserted.rows[0].id;
        summary.modules_created++;
      }
 
      // replace lessons for this module (idempotent re-import)
      await client.query('DELETE FROM lessons WHERE user_id = $1 AND module_id = $2', [userId, moduleId]);
 
      for (const lesson of lessons) {
        const { title, day_of_week, start_time, end_time } = lesson;
 
        if (day_of_week == null || !start_time || !end_time) {
          summary.errors.push(`${module_code}: lesson skipped — missing day_of_week, start_time, or end_time`);
          continue;
        }
        if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
          summary.errors.push(`${module_code}: lesson skipped — times must be HH:MM format`);
          continue;
        }
        if (start_time >= end_time) {
          summary.errors.push(`${module_code}: lesson skipped — start_time must be before end_time`);
          continue;
        }
 
        const lessonTitle = title || `${module_code} Class`;
        await client.query(
          `INSERT INTO lessons (user_id, module_id, title, day_of_week, start_time, end_time)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [userId, moduleId, lessonTitle, Number(day_of_week), start_time, end_time]
        );
        summary.lessons_inserted++;
      }
 
      // replace assignments for this module (idempotent re-import)
      // Only delete tasks that were previously imported (we identify them by
      // module_id; manual tasks in the same module are also deleted on re-import
      // acceptable trade-off for simplicity; a future "source" flag could refine this).
      await client.query(
        'DELETE FROM tasks WHERE user_id = $1 AND module_id = $2',
        [userId, moduleId]
      );
 
      for (const assignment of assignments) {
        const { title, deadline, estimated_minutes, priority } = assignment;
 
        if (!title) {
          summary.errors.push(`${module_code}: assignment skipped — missing title`);
          continue;
        }
 
        const safePriority = priority != null ? Math.min(5, Math.max(1, Number(priority))) : 3;
        const safeEstimate = estimated_minutes ? Number(estimated_minutes) : null;
 
        await client.query(
          `INSERT INTO tasks (user_id, module_id, title, deadline, estimated_minutes, priority, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
          [userId, moduleId, title, deadline || null, safeEstimate, safePriority]
        );
        summary.assignments_inserted++;
      }
    }
 
    await client.query('COMMIT');
    res.status(201).json({ message: 'Import complete', summary });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Import modules error:', err);
    res.status(500).json({ error: 'Failed to import modules' });
  } finally {
    client.release();
  }
};

module.exports = {
  getModules,
  createModule,
  updateModule,
  deleteModule,
  importModules: importNusModsModules,
};
