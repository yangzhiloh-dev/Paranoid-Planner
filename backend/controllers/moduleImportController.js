const pool = require('../config/db');

// Parse CSV fields while preserving quoted commas and escaped quotes.
const parseCsvLine = (line) => {
  const values = [];
  let value = '';
  let quoted = false;

  for (let index = 0; index < line.length; index++) {
    const character = line[index];
    if (character === '"' && quoted && line[index + 1] === '"') {
      value += '"';
      index++;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      values.push(value.trim());
      value = '';
    } else {
      value += character;
    }
  }

  if (quoted) throw new Error('CSV contains an unterminated quoted field');
  values.push(value.trim());
  return values;
};

// CSV uses one lesson or assignment per row, grouped by module_code.
const parseCsvModules = (csv) => {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error('CSV must contain a header and at least one data row');

  const headers = parseCsvLine(lines[0]);
  const modules = new Map();
  for (const line of lines.slice(1)) {
    const values = parseCsvLine(line);
    if (values.length !== headers.length) throw new Error('Every CSV row must match the header column count');
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index]]));
    const code = row.module_code?.toUpperCase();
    if (!code || !row.module_name) throw new Error('Every CSV row requires module_code and module_name');

    if (!modules.has(code)) {
      modules.set(code, {
        module_code: code,
        module_name: row.module_name,
        color: row.color || undefined,
        lessons: [],
        assignments: [],
      });
    }

    const module = modules.get(code);
    if (row.record_type === 'lesson') {
      module.lessons.push({
        day_of_week: row.day_of_week,
        start_time: row.start_time,
        end_time: row.end_time,
        activity_type: row.activity_type,
      });
    } else if (row.record_type === 'assignment') {
      module.assignments.push({
        title: row.title,
        deadline: row.deadline,
        estimated_minutes: row.estimated_minutes || undefined,
        priority: row.priority || undefined,
      });
    } else {
      throw new Error('CSV record_type must be "lesson" or "assignment"');
    }
  }
  return [...modules.values()];
};

const validateImport = (modules) => {
  const errors = [];
  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
  const colorRegex = /^#[0-9A-Fa-f]{6}$/;
  const isoDateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

  if (!Array.isArray(modules) || modules.length === 0) {
    return ['Request body must contain a non-empty "modules" array'];
  }

  const moduleCodes = new Set();

  modules.forEach((module, moduleIndex) => {
    const path = `modules[${moduleIndex}]`;
    if (typeof module.module_code !== 'string' || !module.module_code.trim() || module.module_code.length > 50) {
      errors.push(`${path}.module_code must be a non-empty string of at most 50 characters`);
    } else if (moduleCodes.has(module.module_code.trim().toUpperCase())) {
      errors.push(`${path}.module_code is duplicated in this import`);
    } else {
      moduleCodes.add(module.module_code.trim().toUpperCase());
    }
    if (typeof module.module_name !== 'string' || !module.module_name.trim() || module.module_name.length > 255) {
      errors.push(`${path}.module_name must be a non-empty string of at most 255 characters`);
    }
    if (module.color !== undefined && !colorRegex.test(module.color)) errors.push(`${path}.color must be a hex color`);
    if (module.lessons !== undefined && !Array.isArray(module.lessons)) errors.push(`${path}.lessons must be an array`);
    if (module.assignments !== undefined && !Array.isArray(module.assignments)) errors.push(`${path}.assignments must be an array`);

    (Array.isArray(module.lessons) ? module.lessons : []).forEach((lesson, lessonIndex) => {
      const lessonPath = `${path}.lessons[${lessonIndex}]`;
      const day = Number(lesson.day_of_week);
      if (!Number.isInteger(day) || day < 0 || day > 6) errors.push(`${lessonPath}.day_of_week must be an integer from 0 to 6`);
      if (!timeRegex.test(lesson.start_time || '')) errors.push(`${lessonPath}.start_time must use HH:mm`);
      if (!timeRegex.test(lesson.end_time || '')) errors.push(`${lessonPath}.end_time must use HH:mm`);
      if (timeRegex.test(lesson.start_time || '') && timeRegex.test(lesson.end_time || '') && lesson.start_time >= lesson.end_time) {
        errors.push(`${lessonPath}.start_time must be before end_time`);
      }
      if (!['LEC', 'TUT', 'LAB'].includes(lesson.activity_type)) errors.push(`${lessonPath}.activity_type must be LEC, TUT, or LAB`);
    });

    (Array.isArray(module.assignments) ? module.assignments : []).forEach((assignment, assignmentIndex) => {
      const assignmentPath = `${path}.assignments[${assignmentIndex}]`;
      if (typeof assignment.title !== 'string' || !assignment.title.trim() || assignment.title.length > 255) {
        errors.push(`${assignmentPath}.title must be a non-empty string of at most 255 characters`);
      }
      if (typeof assignment.deadline !== 'string' || !isoDateTimeRegex.test(assignment.deadline) || Number.isNaN(Date.parse(assignment.deadline))) {
        errors.push(`${assignmentPath}.deadline must be an ISO datetime`);
      }
      if (assignment.estimated_minutes !== undefined && (!Number.isInteger(Number(assignment.estimated_minutes)) || Number(assignment.estimated_minutes) <= 0)) {
        errors.push(`${assignmentPath}.estimated_minutes must be a positive integer`);
      }
      if (assignment.priority !== undefined && (!Number.isInteger(Number(assignment.priority)) || Number(assignment.priority) < 1 || Number(assignment.priority) > 5)) {
        errors.push(`${assignmentPath}.priority must be an integer from 1 to 5`);
      }
    });
  });
  return errors;
};

// Import is all-or-nothing so malformed input cannot leave partial timetable data.
const importModules = async (req, res) => {
  let modules;
  try {
    modules = typeof req.body === 'string' ? parseCsvModules(req.body) : req.body?.modules || req.body;
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  const validationErrors = validateImport(modules);
  if (validationErrors.length) return res.status(400).json({ error: 'Invalid import payload', details: validationErrors });

  let client;
  const summary = { modules_created: 0, modules_updated: 0, lessons_imported: 0, assignments_imported: 0 };
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    for (const module of modules) {
      const moduleCode = module.module_code.trim().toUpperCase();
      const moduleName = module.module_name.trim();
      const color = module.color || '#3B82F6';
      const existing = await client.query(
        'SELECT id FROM modules WHERE user_id = $1 AND module_code = $2',
        [req.user.id, moduleCode]
      );

      let moduleId;
      if (existing.rows.length) {
        moduleId = existing.rows[0].id;
        await client.query(
          'UPDATE modules SET module_name = $1, color = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
          [moduleName, color, moduleId]
        );
        summary.modules_updated++;
      } else {
        const result = await client.query(
          'INSERT INTO modules (user_id, module_code, module_name, color) VALUES ($1, $2, $3, $4) RETURNING id',
          [req.user.id, moduleCode, moduleName, color]
        );
        moduleId = result.rows[0].id;
        summary.modules_created++;
      }

      // Replacing imported records makes repeated share-link imports idempotent.
      await client.query('DELETE FROM lessons WHERE user_id = $1 AND module_id = $2', [req.user.id, moduleId]);
      await client.query("DELETE FROM tasks WHERE user_id = $1 AND module_id = $2 AND import_source = 'nusmods'", [req.user.id, moduleId]);

      for (const lesson of module.lessons || []) {
        await client.query(
          `INSERT INTO lessons (user_id, module_id, day_of_week, start_time, end_time, activity_type)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [req.user.id, moduleId, Number(lesson.day_of_week), lesson.start_time, lesson.end_time, lesson.activity_type]
        );
        summary.lessons_imported++;
      }

      for (const assignment of module.assignments || []) {
        await client.query(
          `INSERT INTO tasks
             (user_id, module_id, title, deadline, estimated_minutes, priority, status, import_source)
           VALUES ($1, $2, $3, $4, $5, $6, 'pending', 'nusmods')`,
          [req.user.id, moduleId, assignment.title.trim(), assignment.deadline,
            assignment.estimated_minutes === undefined ? null : Number(assignment.estimated_minutes),
            assignment.priority === undefined ? 3 : Number(assignment.priority)]
        );
        summary.assignments_imported++;
      }
    }

    await client.query('COMMIT');
    return res.status(201).json({ message: 'Modules imported successfully', summary });
  } catch (err) {
    if (client) await client.query('ROLLBACK');
    console.error('Import modules error:', err);
    const error = process.env.NODE_ENV === 'production'
      ? 'Failed to import modules'
      : `Failed to import modules: ${err.message}`;
    return res.status(500).json({ error });
  } finally {
    if (client) client.release();
  }
};

module.exports = { importModules, parseCsvModules, validateImport };
