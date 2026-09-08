const express = require('express');
const router = express.Router();
const ProjectController = require('../controllers/project.controller');
const { authenticateJwt } = require('../middleware/auth.middleware');
const {
  verifyTeamAccess,
  verifyResourceTeamAccess,
} = require('../middleware/team.middleware');

// All project routes require authentication
router.use(authenticateJwt);

router.post('/', verifyTeamAccess, ProjectController.createProject);
router.get('/', verifyTeamAccess, ProjectController.getProjects);

router.get(
  '/:id',
  verifyResourceTeamAccess('projects', 'id', { resourceName: 'Project' }),
  ProjectController.getProjectById
);

router.put(
  '/:id',
  verifyResourceTeamAccess('projects', 'id', { resourceName: 'Project' }),
  ProjectController.updateProject
);

router.delete(
  '/:id',
  verifyResourceTeamAccess('projects', 'id', { resourceName: 'Project', requireLeader: true }),
  ProjectController.deleteProject
);

module.exports = router;
