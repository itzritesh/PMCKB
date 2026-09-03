const { Pool } = require('pg');
const env = require('./env');

// Configure connection pool options based on available environment variables
const isCloudOrSslRequired =
  env.DATABASE_URL &&
  (env.DATABASE_URL.includes('neon.tech') ||
   env.DATABASE_URL.includes('sslmode=require') ||
   env.NODE_ENV === 'production');

const poolConfig = env.DATABASE_URL
  ? {
      connectionString: env.DATABASE_URL,
      ssl: isCloudOrSslRequired ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    }
  : {
      host: env.DB_HOST,
      port: env.DB_PORT,
      database: env.DB_NAME,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      // Default connection limits suitable for scaling
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

const pool = new Pool(poolConfig);

// Handle idle client errors so pool stays stable
pool.on('error', (err) => {
  console.error('[DB Error] Unexpected idle client error:', err.message);
});

/**
 * Execute a SQL query using the connection pool.
 * @param {string} text - SQL query string
 * @param {Array} [params] - Query parameters
 * @returns {Promise<import('pg').QueryResult>}
 */
const query = (text, params) => {
  return pool.query(text, params);
};

/**
 * Test the database connectivity safely without crashing the application.
 * @returns {Promise<{ connected: boolean, timestamp: string|null, message: string, details?: any }>}
 */
const testDbConnection = async () => {
  try {
    const start = Date.now();
    const res = await pool.query('SELECT NOW() as now, current_database() as db_name, version() as version');
    const latency = Date.now() - start;
    return {
      connected: true,
      latencyMs: latency,
      timestamp: res.rows[0].now,
      database: res.rows[0].db_name,
      version: res.rows[0].version.split(' on ')[0],
      message: 'PostgreSQL connection verified successfully.',
    };
  } catch (error) {
    const errorDetails = error.message || error.code || String(error);
    return {
      connected: false,
      timestamp: null,
      message: 'Unable to connect to PostgreSQL database.',
      error: errorDetails,
      code: error.code || 'UNKNOWN_ERROR',
      config: {
        host: env.DB_HOST,
        port: env.DB_PORT,
        database: env.DB_NAME,
        user: env.DB_USER,
      },
    };
  }
};

module.exports = {
  pool,
  query,
  testDbConnection,
};
