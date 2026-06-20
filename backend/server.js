// ParanoidPlanner Backend Server
// Main Express application entry point

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// DEBUGGING: Log that dotenv is loaded
console.log('\n🔍 [SERVER] Starting ParanoidPlanner backend...');
console.log('📁 .env file location:', path.resolve(__dirname, '.env'));
console.log('✓ NODE_ENV loaded:', !!process.env.NODE_ENV);
console.log('✓ PORT loaded:', !!process.env.PORT);

const express = require('express');
const cors = require('cors');

const app = express();

// Configuring middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// CSV imports arrive as raw text; JSON imports continue through express.json().
app.use('/api/modules/import', express.text({ type: ['text/csv', 'application/csv'] }));

// Importing database module
const pool = require('./config/db');
const runMigrations = require('./config/runMigrations');

// Import routes
const authRoutes = require('./routes/authRoutes');
const moduleRoutes = require('./routes/moduleRoutes');
const taskRoutes = require('./routes/taskRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');

// Register routes with base paths
app.use('/api/auth', authRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/schedule', scheduleRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);

  // Default to 500 server error
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    error: message,
    status,
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const startServer = async () => {
  try {
    // Ensure all tables and import columns exist before accepting API traffic.
    await runMigrations(pool);
    app.listen(PORT, () => {
      console.log(`\n ParanoidPlanner backend server started`);
      console.log(` Environment: ${NODE_ENV}`);
      console.log(` Listening on http://localhost:${PORT}`);
      console.log(`\nAvailable endpoints:`);
      console.log(`  POST   /api/auth/register`);
      console.log(`  POST   /api/auth/login`);
      console.log(`  GET    /api/auth/me`);
      console.log(`  GET    /api/health\n`);
    });
  } catch (err) {
    console.error('Failed to apply database migrations:', err.message);
    process.exitCode = 1;
  }
};

startServer();

module.exports = app;
