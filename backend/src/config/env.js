const dotenv = require('dotenv');
const path = require('path');

// Load .env file from backend directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',

  // Database settings
  DATABASE_URL: process.env.DATABASE_URL || null,
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT, 10) || 5432,
  DB_NAME: process.env.DB_NAME || 'projects_db',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',

  // Authentication settings
  JWT_SECRET: process.env.JWT_SECRET || 'default_jwt_secret_dev_only',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Web Push VAPID settings
  VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY || '',
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY || '',
  VAPID_SUBJECT: process.env.VAPID_SUBJECT || 'mailto:support@pmckb.com',

  // Email Notification & Invitation Service settings
  EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || 'gmail',
  EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
  EMAIL_PORT: parseInt(process.env.EMAIL_PORT, 10) || 587,
  EMAIL_SECURE: process.env.EMAIL_SECURE === 'true',
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || '',
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || 'PMCKB',
  EMAIL_FROM_ADDRESS: process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER || 'no-reply@pmckb.com',
  FRONTEND_URL: process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173',

  /**
   * Helper to retrieve validated frontend URL for invitation links.
   * Strictly enforces HTTPS in production environments.
   */
  getInvitationBaseUrl() {
    let url = (env.FRONTEND_URL || env.CLIENT_URL || 'http://localhost:5173').trim();
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }
    if (env.NODE_ENV === 'production') {
      if (!url.startsWith('https://')) {
        console.warn('⚠️ [SECURITY] FRONTEND_URL is not HTTPS in production. Upgrading to https://');
        url = url.replace(/^http:\/\//i, 'https://');
      }
    }
    return url;
  },
};

module.exports = env;
