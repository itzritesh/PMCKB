/**
 * Standalone Database Connectivity Verification Script
 * Run with: npm run db:test
 */
const { testDbConnection, pool } = require('./db');
const env = require('./env');

async function runTest() {
  console.log('====================================================');
  console.log('  PostgreSQL Connection Verification Tool');
  console.log('====================================================');
  let targetDisplay;
  if (env.DATABASE_URL) {
    try {
      const parsed = new URL(env.DATABASE_URL);
      targetDisplay = `${parsed.username}@${parsed.host}${parsed.pathname}`;
    } catch {
      targetDisplay = '[DATABASE_URL provided]';
    }
  } else {
    targetDisplay = `${env.DB_USER}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`;
  }
  console.log(`Target: ${targetDisplay}`);
  console.log('Attempting connection to PostgreSQL...');

  const result = await testDbConnection();

  if (result.connected) {
    console.log('\n Status: SUCCESS (Connected)');
    console.log(` Server Time: ${result.timestamp}`);
    console.log(` Database:    ${result.database}`);
    console.log(` Latency:     ${result.latencyMs}ms`);
    console.log(` Engine:      ${result.version}`);
  } else {
    console.log('\n⚠️  Status: FAILED TO CONNECT');
    console.log(` Reason:      ${result.error}`);
    console.log('\nDiagnostic Instructions:');
    console.log(' 1. Ensure PostgreSQL is installed and running on your system.');
    console.log(' 2. Verify credentials in backend/.env:');
    console.log('    - DB_HOST (default: localhost)');
    console.log('    - DB_PORT (default: 5432)');
    console.log('    - DB_NAME (default: projects_db)');
    console.log('    - DB_USER (default: postgres)');
    console.log('    - DB_PASSWORD');
    console.log(' 3. Or provide a cloud connection string (e.g. Supabase, Neon) in DATABASE_URL.');
  }
  console.log('====================================================\n');

  // Terminate the pool so the process exits cleanly
  await pool.end();
  process.exit(result.connected ? 0 : 1);
}

runTest();
