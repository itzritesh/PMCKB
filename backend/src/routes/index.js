const express = require('express');
const router = express.Router();
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const protectedRoutes = require('./protected.routes');

// Mount routes under /api
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/protected', protectedRoutes);

// Placeholder mount points for future phases:
// router.use('/projects', projectRoutes);
// router.use('/meetings', meetingRoutes);
// router.use('/calendar', calendarRoutes);
// router.use('/knowledge', knowledgeRoutes);

module.exports = router;
