// Task Routes
// GET /api/tasks - Get all tasks for current user
// POST /api/tasks - Create new task
// PUT /api/tasks/:id - Update task
// DELETE /api/tasks/:id - Delete task

const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authMiddleware to all task routes
router.use(authMiddleware);

// Get all tasks for current user (optional filters: module_id, status)
router.get('/', taskController.getTasks);

// Create new task
router.post('/', taskController.createTask);

// Update a specific task
router.put('/:id', taskController.updateTask);

// Delete a specific task
router.delete('/:id', taskController.deleteTask);

module.exports = router;
