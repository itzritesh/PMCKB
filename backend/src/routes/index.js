const express = require('express');
const router = express.Router();
const healthRoutes = require('./health.routes');

// Mount health routes under /api/health
router.use('/health', healthRoutes);

// Placeholder mount points for future phases:
// router.use('/auth', authRoutes);
// router.use('/projects', projectRoutes);
// router.use('/meetings', meetingRoutes);
// router.use('/calendar', calendarRoutes);
// router.use('/knowledge', knowledgeRoutes);

module.exports = router;
