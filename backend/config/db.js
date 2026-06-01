// PostgreSQL Connection Configuration
// Supports both local PostgreSQL and Neon PostgreSQL

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

console.log('[DB Config] Checking database configuration...');

// If DATABASE_URL exists, use it for connection(for Neon/Render deployments)
const usingDatabaseUrl = !!process.env.DATABASE_URL;

// Log whether required database environment variables are loaded (No passwords or full connection strings logged)
console.log('✓ DATABASE_URL loaded:', usingDatabaseUrl);
console.log('✓ DB_HOST loaded:', !!process.env.DB_HOST);
console.log('✓ DB_PORT loaded:', !!process.env.DB_PORT);
console.log('✓ DB_USER loaded:', !!process.env.DB_USER);
console.log('✓ DB_NAME loaded:', !!process.env.DB_NAME);

const pool = new Pool(
  usingDatabaseUrl
    ? {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    }
    : {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    }
);

pool.on('connect', () => {
  console.log('✓ Database connection pool created');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client:', err.message);
});

pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('\n [DB Connection] FAILED');
    console.error('Error:', err.message);
  } else {
    console.log('\n [DB Connection] SUCCESS');
    console.log(
      usingDatabaseUrl
        ? 'Connected using DATABASE_URL'
        : `Connected to local database: ${process.env.DB_NAME}`
    );
  }
});

module.exports = pool;
