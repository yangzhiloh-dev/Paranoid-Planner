// PostgreSQL Connection Configuration
// Creates a connection pool for database operations

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// DEBUGGING: Verify environment variables are loaded
console.log('🔍 [DB Config] Checking environment variables...');
console.log('✓ DB_HOST loaded:', !!process.env.DB_HOST);
console.log('✓ DB_PORT loaded:', !!process.env.DB_PORT);
console.log('✓ DB_USER loaded:', !!process.env.DB_USER);
console.log('✓ DB_PASSWORD loaded:', !!process.env.DB_PASSWORD);
console.log('✓ DB_NAME loaded:', !!process.env.DB_NAME);

// Show actual values (except password)
console.log('\n📋 [DB Config] Environment variables:');
console.log('  DB_HOST:', process.env.DB_HOST);
console.log('  DB_PORT:', process.env.DB_PORT);
console.log('  DB_USER:', process.env.DB_USER);
console.log('  DB_NAME:', process.env.DB_NAME);
console.log('  DB_PASSWORD: [REDACTED - length: ' + (process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0) + ' chars]');

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
  console.error('✗ Unexpected error on idle client:', err.message);
});

// Test the connection with a simple query
pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('\n❌ [DB Connection] FAILED');
    console.error('Error:', err.message);
    console.error('\n🔧 Troubleshooting steps:');
    console.error('1. Verify PostgreSQL is running: psql -U postgres');
    console.error('2. Check if user "' + process.env.DB_USER + '" exists');
    console.error('3. Verify password is correct in .env file');
    console.error('4. Ensure database "' + process.env.DB_NAME + '" exists');
    console.error('5. Test connection: psql -h ' + process.env.DB_HOST + ' -U ' + process.env.DB_USER + ' -d ' + process.env.DB_NAME);
  } else {
    console.log('\n✅ [DB Connection] SUCCESS');
    console.log('Connected to PostgreSQL database:', process.env.DB_NAME);
  }
});

module.exports = pool;
