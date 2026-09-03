const express = require('express');
const router = express.Router();
const ProjectController = require('../controllers/project.controller');
const { authenticateJwt } = require('../middleware/auth.middleware');

// All project routes require authentication
router.use(authenticateJwt);

router.post('/', ProjectController.createProject);
router.get('/', ProjectController.getProjects);
router.get('/:id', ProjectController.getProjectById);
router.put('/:id', ProjectController.updateProject);
router.delete('/:id', ProjectController.deleteProject);

module.exports = router;
