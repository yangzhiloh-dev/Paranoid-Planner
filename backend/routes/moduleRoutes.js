// Module Routes
// GET /api/modules - Get all modules for current user
// POST /api/modules - Create new module
// PUT /api/modules/:id - Update module
// DELETE /api/modules/:id - Delete module

const express = require('express');
const router = express.Router();
const moduleController = require('../controllers/moduleController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply authMiddleware to all module routes
router.use(authMiddleware);

// Get all modules for current user
router.get('/', moduleController.getModules);

// Import must be declared before parameterized module routes.
router.post('/import', moduleController.importModules);

// Create new module
router.post('/', moduleController.createModule);

// Update a specific module
router.put('/:id', moduleController.updateModule);

// Delete a specific module
router.delete('/:id', moduleController.deleteModule);

module.exports = router;
