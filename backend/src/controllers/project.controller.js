const { ProjectModel } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

const ALLOWED_STATUSES = ['planning', 'in_progress', 'completed', 'on_hold'];

/**
 * Project Controller for CRUD operations with team isolation and role authorization
 */
const ProjectController = {
  /**
   * Create a new project within verified team
   * POST /api/projects
   */
  async createProject(req, res, next) {
    try {
      // Enforce Leader role requirement: Members cannot create projects
      if (req.teamRole !== 'leader') {
        return sendError(res, 'Access denied. Only team leaders can create projects.', 403);
      }

      const { name, description, status } = req.body;

      // Validate project name
      if (!name || typeof name !== 'string' || !name.trim()) {
        return sendError(res, 'Project name is required and cannot be empty.', 400);
      }

      if (name.trim().length > 255) {
        return sendError(res, 'Project name cannot exceed 255 characters.', 400);
      }

      // Validate status if provided
      const projectStatus = status || 'planning';
      if (!ALLOWED_STATUSES.includes(projectStatus)) {
        return sendError(
          res,
          `Invalid project status. Allowed values are: ${ALLOWED_STATUSES.join(', ')}`,
          400
        );
      }

      const project = await ProjectModel.create({
        name,
        description,
        status: projectStatus,
        ownerId: req.user.id,
        teamId: req.teamId,
      });

      return sendSuccess(res, { project }, 'Project created successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all projects for the verified workspace
   * GET /api/projects
   */
  async getProjects(req, res, next) {
    try {
      const projects = await ProjectModel.findAllByTeam({
        teamId: req.teamId,
        userId: req.user.id,
      });

      return sendSuccess(
        res,
        {
          projects,
          total: projects.length,
          teamId: req.teamId,
        },
        'Projects fetched successfully'
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get a single project by ID (ensuring team access)
   * GET /api/projects/:id
   */
  async getProjectById(req, res, next) {
    try {
      return sendSuccess(res, { project: req.resource }, 'Project retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update a project by ID (ensuring team access)
   * PUT /api/projects/:id
   */
  async updateProject(req, res, next) {
    try {
      // Enforce Leader role requirement: Members cannot edit project information
      if (req.teamRole !== 'leader') {
        return sendError(res, 'Access denied. Only team leaders can edit project information.', 403);
      }

      const { name, description, status } = req.body;

      if (!name || typeof name !== 'string' || !name.trim()) {
        return sendError(res, 'Project name is required and cannot be empty.', 400);
      }

      if (name.trim().length > 255) {
        return sendError(res, 'Project name cannot exceed 255 characters.', 400);
      }

      const projectStatus = status || req.resource.status;
      if (!ALLOWED_STATUSES.includes(projectStatus)) {
        return sendError(
          res,
          `Invalid project status. Allowed values are: ${ALLOWED_STATUSES.join(', ')}`,
          400
        );
      }

      const updatedProject = await ProjectModel.update({
        id: req.resource.id,
        name,
        description,
        status: projectStatus,
      });

      return sendSuccess(res, { project: updatedProject }, 'Project updated successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a project by ID (Leader only)
   * DELETE /api/projects/:id
   */
  async deleteProject(req, res, next) {
    try {
      // Enforce Leader role requirement: Members cannot delete projects
      if (req.teamRole !== 'leader') {
        return sendError(res, 'Access denied. Only team leaders can delete projects.', 403);
      }

      await ProjectModel.delete(req.resource.id);
      return sendSuccess(res, { id: req.resource.id }, 'Project deleted successfully');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = ProjectController;
