const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/task.controller');
const { authenticateJwt } = require('../middleware/auth.middleware');

// All task routes require authentication
router.use(authenticateJwt);

router.post('/', TaskController.createTask);
router.get('/', TaskController.getAllTasks);
router.get('/project/:projectId', TaskController.getTasksByProject);
router.get('/:id', TaskController.getTaskById);
router.put('/:id', TaskController.updateTask);
router.patch('/:id/assign', TaskController.assignTask);
router.delete('/:id', TaskController.deleteTask);

module.exports = router;
