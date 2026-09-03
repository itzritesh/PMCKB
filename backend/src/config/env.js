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
};

module.exports = env;
