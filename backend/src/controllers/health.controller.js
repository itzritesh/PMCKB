const { testDbConnection } = require('../config/db');
const env = require('../config/env');
const { sendSuccess } = require('../utils/response');

/**
 * Basic root endpoint handler (GET /)
 */
const getRootInfo = (req, res) => {
  return sendSuccess(res, {
    project: 'Projects, Meetings, Calendar, Knowledge Base',
    phase: 'Phase 1: Foundation Setup',
    version: '1.0.0',
    status: 'online',
    timestamp: new Date().toISOString(),
    endpoints: {
      root: 'GET /',
      health: 'GET /api/health',
    },
  }, 'API service is running');
};

/**
 * Deep health-check endpoint (GET /api/health)
 * Verifies API status, system uptime, and PostgreSQL connectivity
 */
const getHealthStatus = async (req, res) => {
  const dbStatus = await testDbConnection();

  const healthData = {
    status: 'healthy',
    environment: env.NODE_ENV,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    memory: {
      rssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    },
    database: {
      status: dbStatus.connected ? 'connected' : 'disconnected',
      details: dbStatus,
    },
  };

  return sendSuccess(res, healthData, 'System health check completed successfully');
};

module.exports = {
  getRootInfo,
  getHealthStatus,
};
