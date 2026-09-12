const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const apiRoutes = require('./routes');
const { getRootInfo } = require('./controllers/health.controller');
const notFoundHandler = require('./middleware/notFound.middleware');
const errorHandler = require('./middleware/error.middleware');

const { corsOptions } = require('./config/cors');

const app = express();

// Enable CORS with configurable and LAN origins
app.use(cors(corsOptions));

const path = require('path');
const fs = require('fs');

// Built-in body parsing middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount main API router under /api
app.use('/api', apiRoutes);

// In production, serve the frontend SPA build if frontend/dist exists
const distPath = path.resolve(__dirname, '../../frontend/dist');
const hasFrontendDist = fs.existsSync(distPath);

if (env.NODE_ENV === 'production' && hasFrontendDist) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Root health-check / info endpoint in development or standalone API mode
  app.get('/', getRootInfo);
}

// Catch-all 404 handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

module.exports = app;
