// Schedule Controller
// Handles schedule generation and retrieval

const pool = require('../config/db');
const schedulerService = require('../services/schedulerService');

// Generate a new schedule
const generateSchedule = async (req, res) => {
  try {
    const userId = req.user.id;

    // First, clear any existing scheduled sessions (optional - for clean regeneration)
    // Uncomment if you want to clear old schedules on regenerate:
    // await pool.query(
    //   'DELETE FROM study_sessions WHERE user_id = $1 AND status = $\'scheduled\'',
    //   [userId]
    // );

    // Generate new schedule
    const result = await schedulerService.generateSchedule(userId, pool);

    res.json({
      message: result.message,
      sessions: result.sessions,
    });
  } catch (err) {
    console.error('Generate schedule error:', err);
    res.status(500).json({ error: 'Failed to generate schedule' });
  }
};

// Get current schedule
const getSchedule = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch current schedule
    const sessions = await schedulerService.getSchedule(userId, pool);

    res.json({
      sessions,
      count: sessions.length,
    });
  } catch (err) {
    console.error('Get schedule error:', err);
    res.status(500).json({ error: 'Failed to retrieve schedule' });
  }
};

module.exports = {
  generateSchedule,
  getSchedule,
};
