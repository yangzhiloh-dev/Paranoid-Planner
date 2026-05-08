// PostgreSQL Connection Configuration
// Creates a connection pool for database operations

const { Pool } = require('pg');
require('dotenv').config();

// Create connection pool with credentials from environment variables
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Test the connection on startup
pool.on('connect', () => {
  console.log('✓ Database connection pool created');
});

// Handle connection errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Test the connection with a simple query
pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('✗ Error connecting to database:', err.message);
    console.error('Please ensure PostgreSQL is running and .env credentials are correct');
  } else {
    console.log('✓ Database connection successful');
  }
});

module.exports = pool;
