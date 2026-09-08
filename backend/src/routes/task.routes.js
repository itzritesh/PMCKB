const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/task.controller');
const CommentController = require('../controllers/comment.controller');
const { authenticateJwt } = require('../middleware/auth.middleware');
const {
  verifyTeamAccess,
  verifyResourceTeamAccess,
} = require('../middleware/team.middleware');

// All task routes require authentication
router.use(authenticateJwt);

router.post('/', verifyTeamAccess, TaskController.createTask);
router.get('/', verifyTeamAccess, TaskController.getAllTasks);
router.get('/project/:projectId', verifyTeamAccess, TaskController.getTasksByProject);

router.get(
  '/:id',
  verifyResourceTeamAccess('tasks', 'id', { resourceName: 'Task' }),
  TaskController.getTaskById
);

router.put(
  '/:id',
  verifyResourceTeamAccess('tasks', 'id', { resourceName: 'Task' }),
  TaskController.updateTask
);

router.patch(
  '/:id/assign',
  verifyResourceTeamAccess('tasks', 'id', { resourceName: 'Task' }),
  TaskController.assignTask
);

router.delete(
  '/:id',
  verifyResourceTeamAccess('tasks', 'id', { resourceName: 'Task' }),
  TaskController.deleteTask
);

// Task comments endpoints protected by parent task team access
router.get(
  '/:taskId/comments',
  verifyResourceTeamAccess('tasks', 'taskId', { resourceName: 'Task' }),
  CommentController.getCommentsByTask
);

router.post(
  '/:taskId/comments',
  verifyResourceTeamAccess('tasks', 'taskId', { resourceName: 'Task' }),
  CommentController.createComment
);

module.exports = router;
