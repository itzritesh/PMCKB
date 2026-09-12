const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('./env');
const { isOriginAllowed } = require('./cors');

let io = null;

/**
 * Initialize Socket.IO with HTTP server
 */
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Socket CORS disallowed: ${origin}`), false);
      },
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  // Authentication middleware using JWT validation
  io.use((socket, next) => {
    const rawToken =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization;

    if (!rawToken) {
      return next(new Error('Authentication token required'));
    }

    const token = rawToken.startsWith('Bearer ')
      ? rawToken.slice(7).trim()
      : rawToken.trim();

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      socket.user = decoded; // { id, email, name, ... }
      next();
    } catch (err) {
      return next(new Error('Invalid or expired authentication token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user?.id;
    if (userId) {
      const userRoom = `user:${userId}`;
      socket.join(userRoom);
      console.log(`🔌 [Socket.IO] Authenticated user ${userId} connected (joined room: ${userRoom})`);
    }

    socket.on('disconnect', (reason) => {
      console.log(`🔌 [Socket.IO] User ${socket.user?.id} disconnected (${reason})`);
    });
  });

  return io;
}

/**
 * Get active Socket.IO server instance
 */
function getIO() {
  return io;
}

/**
 * Safely emit an event to a specific user's private room
 */
function emitToUser(userId, event, payload) {
  if (io && userId) {
    const room = `user:${userId}`;
    io.to(room).emit(event, payload);
    console.log(`📡 [Socket.IO] Emitted '${event}' to ${room} (item: ${payload?.title || payload?.id})`);
  }
}

module.exports = {
  initSocket,
  getIO,
  emitToUser,
};
