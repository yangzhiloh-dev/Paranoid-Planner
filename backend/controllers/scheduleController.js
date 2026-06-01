// Schedule Controller
// Handles schedule generation and retrieval

const pool = require('../config/db');
const schedulerService = require('../services/schedulerService');

// Generating a new schedule
const generateSchedule = async (req, res) => {
  try {
    const userId = req.user.id;
   
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
