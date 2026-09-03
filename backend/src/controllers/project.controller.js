const { ProjectModel } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

// Allowed status values
const ALLOWED_STATUSES = ['planning', 'in_progress', 'completed', 'on_hold'];

/**
 * Project Controller for CRUD operations with owner-level isolation
 */
const ProjectController = {
  /**
   * Create a new project
   * POST /api/projects
   */
  async createProject(req, res, next) {
    try {
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
      });

      return sendSuccess(res, { project }, 'Project created successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all projects for the authenticated user
   * GET /api/projects
   */
  async getProjects(req, res, next) {
    try {
      const projects = await ProjectModel.findAllByOwner(req.user.id);
      return sendSuccess(
        res,
        {
          projects,
          total: projects.length,
        },
        'Projects fetched successfully'
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get a single project by ID (ensuring ownership)
   * GET /api/projects/:id
   */
  async getProjectById(req, res, next) {
    try {
      const { id } = req.params;
      const projectId = parseInt(id, 10);

      if (isNaN(projectId)) {
        return sendError(res, 'Invalid project ID format.', 400);
      }

      const project = await ProjectModel.findByIdAndOwner(projectId, req.user.id);
      if (!project) {
        return sendError(res, 'Project not found or access denied.', 404);
      }

      return sendSuccess(res, { project }, 'Project retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update a project by ID (ensuring ownership)
   * PUT /api/projects/:id
   */
  async updateProject(req, res, next) {
    try {
      const { id } = req.params;
      const projectId = parseInt(id, 10);

      if (isNaN(projectId)) {
        return sendError(res, 'Invalid project ID format.', 400);
      }

      const { name, description, status } = req.body;

      // Validate project name
      if (!name || typeof name !== 'string' || !name.trim()) {
        return sendError(res, 'Project name is required and cannot be empty.', 400);
      }

      if (name.trim().length > 255) {
        return sendError(res, 'Project name cannot exceed 255 characters.', 400);
      }

      // Validate status
      const projectStatus = status || 'planning';
      if (!ALLOWED_STATUSES.includes(projectStatus)) {
        return sendError(
          res,
          `Invalid project status. Allowed values are: ${ALLOWED_STATUSES.join(', ')}`,
          400
        );
      }

      const updatedProject = await ProjectModel.update({
        id: projectId,
        ownerId: req.user.id,
        name,
        description,
        status: projectStatus,
      });

      if (!updatedProject) {
        return sendError(res, 'Project not found or you do not have permission to edit it.', 404);
      }

      return sendSuccess(res, { project: updatedProject }, 'Project updated successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a project by ID (ensuring ownership)
   * DELETE /api/projects/:id
   */
  async deleteProject(req, res, next) {
    try {
      const { id } = req.params;
      const projectId = parseInt(id, 10);

      if (isNaN(projectId)) {
        return sendError(res, 'Invalid project ID format.', 400);
      }

      const deleted = await ProjectModel.delete(projectId, req.user.id);
      if (!deleted) {
        return sendError(res, 'Project not found or you do not have permission to delete it.', 404);
      }

      return sendSuccess(res, { id: projectId }, 'Project deleted successfully');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = ProjectController;
