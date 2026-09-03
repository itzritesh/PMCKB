const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/task.controller');
const CommentController = require('../controllers/comment.controller');
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

// Task comments endpoints
router.get('/:taskId/comments', CommentController.getCommentsByTask);
router.post('/:taskId/comments', CommentController.createComment);

module.exports = router;
