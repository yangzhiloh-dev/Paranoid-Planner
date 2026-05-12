// Authentication Routes
// POST /api/auth/register - Register a new user
// POST /api/auth/login - Login user
// GET /api/auth/me - Get current user info (requires auth)

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

console.log('✓ [Routes] Loading authentication routes...');

// Register new user
router.post('/register', (req, res, next) => {
  console.log('📨 [Route] POST /api/auth/register received');
  authController.register(req, res);
});

// Login user
router.post('/login', authController.login);

// Get current user info (requires authentication)
router.get('/me', authMiddleware, authController.me);

module.exports = router;
