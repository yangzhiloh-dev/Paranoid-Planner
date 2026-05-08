// Schedule Routes
// POST /api/schedule/generate - Generate a study schedule
// GET /api/schedule - Get current schedule

const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authMiddleware to all schedule routes
router.use(authMiddleware);

// Get current schedule
router.get('/', scheduleController.getSchedule);

// Generate new schedule
router.post('/generate', scheduleController.generateSchedule);

module.exports = router;
