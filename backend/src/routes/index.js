const express = require('express');
const router = express.Router();
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const protectedRoutes = require('./protected.routes');
const projectRoutes = require('./project.routes');
const taskRoutes = require('./task.routes');
const userRoutes = require('./user.routes');
const commentRoutes = require('./comment.routes');
const calendarRoutes = require('./calendar.routes');
const meetingRoutes = require('./meeting.routes');
const kbRoutes = require('./kb.routes');

// Mount routes under /api
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/protected', protectedRoutes);
router.use('/projects', projectRoutes);
router.use('/tasks', taskRoutes);
router.use('/users', userRoutes);
router.use('/comments', commentRoutes);
router.use('/calendar', calendarRoutes);
router.use('/meetings', meetingRoutes);
router.use('/kb', kbRoutes);

module.exports = router;
