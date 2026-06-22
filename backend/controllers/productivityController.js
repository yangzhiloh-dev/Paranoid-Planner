const pool = require('../config/db');
const { getProductivitySummary } = require('../services/pointsService');

const getSummary = async (req, res) => {
  try {
    const summary = await getProductivitySummary(pool, req.user.id);

    res.json({ summary });
  } catch (err) {
    console.error('Get productivity summary error:', err);
    res.status(500).json({ error: 'Failed to retrieve productivity summary' });
  }
};

module.exports = {
  getSummary,
};
