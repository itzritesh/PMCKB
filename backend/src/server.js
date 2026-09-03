const app = require('./app');
const env = require('./config/env');
const { testDbConnection, pool } = require('./config/db');
const { initDb } = require('./config/initDb');

const PORT = env.PORT || 5000;

const server = app.listen(PORT, async () => {
  console.log('====================================================');
  console.log(`🚀 PMCKB Backend API Server`);
  console.log(`📡 Listening on: http://localhost:${PORT}`);
  console.log(`🌍 Environment:  ${env.NODE_ENV}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  console.log('====================================================');

  // Verify DB connectivity on startup
  console.log('Verifying PostgreSQL connection...');
  const dbStatus = await testDbConnection();
  if (dbStatus.connected) {
    console.log(`✅ PostgreSQL connected successfully (latency: ${dbStatus.latencyMs}ms)`);
    try {
      await initDb();
    } catch (err) {
      console.warn('⚠️  Could not run automatic schema initialization:', err.message);
    }
  } else {
    console.log(`⚠️  PostgreSQL warning: ${dbStatus.message}`);
    console.log(`   Detail: ${dbStatus.error}`);
    console.log(`   (Server running in degraded mode. Run 'npm run db:test' to diagnose)`);
  }
  console.log('====================================================');
});

// Graceful shutdown handling
const handleShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      await pool.end();
      console.log('PostgreSQL connection pool closed.');
    } catch (err) {
      console.error('Error closing PostgreSQL pool:', err.message);
    }
    process.exit(0);
  });
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
  process.exit(1);
});
