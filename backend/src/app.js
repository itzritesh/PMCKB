const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const apiRoutes = require('./routes');
const { getRootInfo } = require('./controllers/health.controller');
const notFoundHandler = require('./middleware/notFound.middleware');
const errorHandler = require('./middleware/error.middleware');

const app = express();

// Enable CORS with configurable origins
const allowedOrigins = [
  env.CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in development
    },
    credentials: true,
  })
);

// Built-in body parsing middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root health-check / info endpoint
app.get('/', getRootInfo);

// Mount main API router under /api
app.use('/api', apiRoutes);

// Catch-all 404 handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

module.exports = app;
