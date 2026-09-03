const { query, pool } = require('./db');

/**
 * Initializes database schemas and creates required tables if they don't exist.
 */
async function initDb() {
  console.log('Initializing database tables on PostgreSQL (Neon)...');

  const createUsersTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  `;

  try {
    await query(createUsersTableQuery);
    console.log('✅ Database initialization completed: `users` table is ready.');
    return { success: true };
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
}

// Allow direct execution from CLI: node src/config/initDb.js
if (require.main === module) {
  initDb()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async () => {
      await pool.end();
      process.exit(1);
    });
}

module.exports = { initDb };
