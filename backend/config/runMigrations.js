const fs = require('fs/promises');
const path = require('path');

// Apply each SQL migration once before the API accepts requests.
const runMigrations = async (pool) => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const migrationsDirectory = path.resolve(__dirname, '../migrations');
  const migrationNames = (await fs.readdir(migrationsDirectory))
    .filter((name) => name.endsWith('.sql'))
    .sort((left, right) => {
      if (left === 'init.sql') return -1;
      if (right === 'init.sql') return 1;
      return left.localeCompare(right);
    });

  for (const name of migrationNames) {
    const applied = await pool.query('SELECT 1 FROM schema_migrations WHERE name = $1', [name]);
    if (applied.rowCount > 0) continue;

    const sql = await fs.readFile(path.join(migrationsDirectory, name), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
      await client.query('COMMIT');
      console.log(`Applied database migration: ${name}`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
};

module.exports = runMigrations;
