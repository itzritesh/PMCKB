const env = require('./env');

const allowedOrigins = [
  env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://192.168.0.122:5173',
].filter(Boolean);

// LAN origin regex for dev mode: matches localhost, 127.0.0.1, 192.168.x.x, 10.x.x.x, 172.16-31.x.x on any dev port
const LAN_ORIGIN_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/;

/**
 * Validates whether an incoming HTTP or WebSocket origin is permitted.
 * In development, allows localhost and any LAN/Wi-Fi subnet origin.
 * In production, strictly allows configured allowedOrigins (CLIENT_URL).
 *
 * @param {string|undefined} origin
 * @returns {boolean}
 */
function isOriginAllowed(origin) {
  // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
  if (!origin) return true;
  
  if (allowedOrigins.includes(origin)) return true;
  
  if (env.NODE_ENV !== 'production' && LAN_ORIGIN_REGEX.test(origin)) {
    return true;
  }
  
  return false;
}

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy does not allow access from origin: ${origin}`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-team-id'],
};

module.exports = {
  corsOptions,
  isOriginAllowed,
  allowedOrigins,
};
