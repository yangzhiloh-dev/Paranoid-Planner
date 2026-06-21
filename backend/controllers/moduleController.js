const pool = require('../config/db');
const { importModules } = require('./moduleImportController');

const COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;
const MODULE_COLUMNS =
  'id, user_id, module_code, module_name, color, created_at, updated_at';

const validateModuleFields = ({ module_code, module_name, color }) => {
  if (module_code !== undefined) {
    if (!String(module_code).trim()) return 'Module code is required';
    if (module_code.length > 50) return 'Module code must be 50 characters or less';
  }
  if (module_name !== undefined) {
    if (!String(module_name).trim()) return 'Module name is required';
    if (module_name.length > 255) return 'Module name must be 255 characters or less';
  }
  if (color !== undefined && !COLOR_REGEX.test(color)) {
    return 'Color must be a valid hex code (e.g., #FF5733)';
  }
  return null;
};

const getModules = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ${MODULE_COLUMNS}
       FROM modules
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    return res.json({ modules: result.rows });
  } catch (err) {
    console.error('Get modules error:', err);
    return res.status(500).json({ error: 'Failed to retrieve modules' });
  }
};

const createModule = async (req, res) => {
  try {
    const userId = req.user.id;
    const { module_code, module_name, color } = req.body;
    const finalColor = color || '#3B82F6';

    if (!module_code || !module_name) {
      return res.status(400).json({ error: 'Module code and name are required' });
    }
    const validationError = validateModuleFields({
      module_code,
      module_name,
      color: finalColor,
    });
    if (validationError) return res.status(400).json({ error: validationError });

    const existing = await pool.query(
      'SELECT id FROM modules WHERE user_id = $1 AND module_code = $2',
      [userId, module_code]
    );
    if (existing.rows.length) {
      return res.status(409).json({ error: 'Module code already exists for this user' });
    }

    const result = await pool.query(
      `INSERT INTO modules (user_id, module_code, module_name, color)
       VALUES ($1, $2, $3, $4)
       RETURNING ${MODULE_COLUMNS}`,
      [userId, module_code, module_name, finalColor]
    );
    return res.status(201).json({
      message: 'Module created successfully',
      module: result.rows[0],
    });
  } catch (err) {
    console.error('Create module error:', err);
    return res.status(500).json({ error: 'Failed to create module' });
  }
};

const updateModule = async (req, res) => {
  try {
    const userId = req.user.id;
    const moduleId = req.params.id;
    const { module_code, module_name, color } = req.body;
    const validationError = validateModuleFields({ module_code, module_name, color });
    if (validationError) return res.status(400).json({ error: validationError });

    const updates = [];
    const params = [];
    const addUpdate = (column, value) => {
      params.push(value);
      updates.push(`${column} = $${params.length}`);
    };

    if (module_code !== undefined) addUpdate('module_code', module_code);
    if (module_name !== undefined) addUpdate('module_name', module_name);
    if (color !== undefined) addUpdate('color', color);
    if (!updates.length) return res.status(400).json({ error: 'No fields to update' });

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(moduleId, userId);
    const result = await pool.query(
      `UPDATE modules
       SET ${updates.join(', ')}
       WHERE id = $${params.length - 1} AND user_id = $${params.length}
       RETURNING ${MODULE_COLUMNS}`,
      params
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Module not found' });

    return res.json({
      message: 'Module updated successfully',
      module: result.rows[0],
    });
  } catch (err) {
    console.error('Update module error:', err);
    return res.status(500).json({ error: 'Failed to update module' });
  }
};

const deleteModule = async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM modules
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Module not found' });

    return res.json({ message: 'Module deleted successfully' });
  } catch (err) {
    console.error('Delete module error:', err);
    return res.status(500).json({ error: 'Failed to delete module' });
  }
};

module.exports = {
  getModules,
  createModule,
  updateModule,
  deleteModule,
  importModules,
};
