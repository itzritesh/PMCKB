const { TaskModel, ProjectModel, UserModel } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

const ALLOWED_STATUSES = ['todo', 'in_progress', 'completed'];
const ALLOWED_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

/**
 * Task Controller for CRUD and Assignment operations with project & owner isolation
 */
const TaskController = {
  /**
   * Create a new task in a project
   * POST /api/tasks
   */
  async createTask(req, res, next) {
    try {
      const { project_id, title, description, status, priority, due_date, assigned_to } = req.body;

      // Validate project_id
      const projectId = parseInt(project_id, 10);
      if (isNaN(projectId)) {
        return sendError(res, 'A valid project_id is required.', 400);
      }

      // Verify the target project exists and belongs to the authenticated user
      const project = await ProjectModel.findByIdAndOwner(projectId, req.user.id);
      if (!project) {
        return sendError(res, 'Project not found or you do not have permission to add tasks to it.', 404);
      }

      // Validate title
      if (!title || typeof title !== 'string' || !title.trim()) {
        return sendError(res, 'Task title is required and cannot be empty.', 400);
      }

      if (title.trim().length > 255) {
        return sendError(res, 'Task title cannot exceed 255 characters.', 400);
      }

      // Validate status
      const taskStatus = status || 'todo';
      if (!ALLOWED_STATUSES.includes(taskStatus)) {
        return sendError(
          res,
          `Invalid task status. Allowed values are: ${ALLOWED_STATUSES.join(', ')}`,
          400
        );
      }

      // Validate priority
      const taskPriority = priority || 'medium';
      if (!ALLOWED_PRIORITIES.includes(taskPriority)) {
        return sendError(
          res,
          `Invalid task priority. Allowed values are: ${ALLOWED_PRIORITIES.join(', ')}`,
          400
        );
      }

      // Validate due_date format if provided
      let formattedDueDate = null;
      if (due_date) {
        const parsedDate = new Date(due_date);
        if (isNaN(parsedDate.getTime())) {
          return sendError(res, 'Invalid due_date format.', 400);
        }
        formattedDueDate = parsedDate.toISOString();
      }

      // Validate assigned_to user exists if specified
      let assigneeId = null;
      if (assigned_to !== undefined && assigned_to !== null && assigned_to !== '') {
        const parsedUserId = parseInt(assigned_to, 10);
        if (isNaN(parsedUserId)) {
          return sendError(res, 'Invalid assigned_to user ID format.', 400);
        }
        const user = await UserModel.findById(parsedUserId);
        if (!user) {
          return sendError(res, 'Selected assignee does not exist.', 400);
        }
        assigneeId = parsedUserId;
      }

      const task = await TaskModel.create({
        projectId,
        ownerId: req.user.id,
        title,
        description,
        status: taskStatus,
        priority: taskPriority,
        dueDate: formattedDueDate,
        assignedTo: assigneeId,
      });

      return sendSuccess(res, { task }, 'Task created successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all tasks for a specific project
   * GET /api/tasks/project/:projectId
   */
  async getTasksByProject(req, res, next) {
    try {
      const { projectId } = req.params;
      const pid = parseInt(projectId, 10);

      if (isNaN(pid)) {
        return sendError(res, 'Invalid project ID format.', 400);
      }

      // Ensure project exists and belongs to the user
      const project = await ProjectModel.findByIdAndOwner(pid, req.user.id);
      if (!project) {
        return sendError(res, 'Project not found or access denied.', 404);
      }

      const tasks = await TaskModel.findAllByProject(pid, req.user.id);
      return sendSuccess(res, { tasks, total: tasks.length }, 'Tasks retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all tasks across all projects owned by the user
   * GET /api/tasks
   */
  async getAllTasks(req, res, next) {
    try {
      let tasks = await TaskModel.findAllByOwner(req.user.id);

      // Optional status filter
      if (req.query.status && ALLOWED_STATUSES.includes(req.query.status)) {
        tasks = tasks.filter((t) => t.status === req.query.status);
      }

      // Optional priority filter
      if (req.query.priority && ALLOWED_PRIORITIES.includes(req.query.priority)) {
        tasks = tasks.filter((t) => t.priority === req.query.priority);
      }

      return sendSuccess(res, { tasks, total: tasks.length }, 'All tasks retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get a single task by ID
   * GET /api/tasks/:id
   */
  async getTaskById(req, res, next) {
    try {
      const { id } = req.params;
      const taskId = parseInt(id, 10);

      if (isNaN(taskId)) {
        return sendError(res, 'Invalid task ID format.', 400);
      }

      const task = await TaskModel.findByIdAndOwner(taskId, req.user.id);
      if (!task) {
        return sendError(res, 'Task not found or access denied.', 404);
      }

      return sendSuccess(res, { task }, 'Task retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update a task
   * PUT /api/tasks/:id
   */
  async updateTask(req, res, next) {
    try {
      const { id } = req.params;
      const taskId = parseInt(id, 10);

      if (isNaN(taskId)) {
        return sendError(res, 'Invalid task ID format.', 400);
      }

      const { title, description, status, priority, due_date, assigned_to } = req.body;

      // Validate title
      if (!title || typeof title !== 'string' || !title.trim()) {
        return sendError(res, 'Task title is required and cannot be empty.', 400);
      }

      if (title.trim().length > 255) {
        return sendError(res, 'Task title cannot exceed 255 characters.', 400);
      }

      // Validate status
      const taskStatus = status || 'todo';
      if (!ALLOWED_STATUSES.includes(taskStatus)) {
        return sendError(
          res,
          `Invalid task status. Allowed values are: ${ALLOWED_STATUSES.join(', ')}`,
          400
        );
      }

      // Validate priority
      const taskPriority = priority || 'medium';
      if (!ALLOWED_PRIORITIES.includes(taskPriority)) {
        return sendError(
          res,
          `Invalid task priority. Allowed values are: ${ALLOWED_PRIORITIES.join(', ')}`,
          400
        );
      }

      // Validate due_date
      let formattedDueDate = null;
      if (due_date) {
        const parsedDate = new Date(due_date);
        if (isNaN(parsedDate.getTime())) {
          return sendError(res, 'Invalid due_date format.', 400);
        }
        formattedDueDate = parsedDate.toISOString();
      }

      // Validate assigned_to user exists if specified
      let assigneeId = null;
      if (assigned_to !== undefined && assigned_to !== null && assigned_to !== '') {
        const parsedUserId = parseInt(assigned_to, 10);
        if (isNaN(parsedUserId)) {
          return sendError(res, 'Invalid assigned_to user ID format.', 400);
        }
        const user = await UserModel.findById(parsedUserId);
        if (!user) {
          return sendError(res, 'Selected assignee does not exist.', 400);
        }
        assigneeId = parsedUserId;
      }

      const updatedTask = await TaskModel.update({
        id: taskId,
        ownerId: req.user.id,
        title,
        description,
        status: taskStatus,
        priority: taskPriority,
        dueDate: formattedDueDate,
        assignedTo: assigneeId,
      });

      if (!updatedTask) {
        return sendError(res, 'Task not found or you do not have permission to edit it.', 404);
      }

      return sendSuccess(res, { task: updatedTask }, 'Task updated successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Assign or reassign a task
   * PATCH /api/tasks/:id/assign
   */
  async assignTask(req, res, next) {
    try {
      const { id } = req.params;
      const taskId = parseInt(id, 10);

      if (isNaN(taskId)) {
        return sendError(res, 'Invalid task ID format.', 400);
      }

      const { assigned_to } = req.body;
      let targetUserId = null;

      if (assigned_to !== undefined && assigned_to !== null && assigned_to !== '') {
        const parsedUserId = parseInt(assigned_to, 10);
        if (isNaN(parsedUserId)) {
          return sendError(res, 'Invalid assigned_to user ID format.', 400);
        }
        const user = await UserModel.findById(parsedUserId);
        if (!user) {
          return sendError(res, 'Selected assignee does not exist.', 400);
        }
        targetUserId = parsedUserId;
      }

      const updatedTask = await TaskModel.assign({
        id: taskId,
        ownerId: req.user.id,
        assignedTo: targetUserId,
      });

      if (!updatedTask) {
        return sendError(res, 'Task not found or access denied.', 404);
      }

      return sendSuccess(
        res,
        { task: updatedTask },
        targetUserId ? 'Task assignee updated successfully' : 'Task unassigned successfully'
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a task
   * DELETE /api/tasks/:id
   */
  async deleteTask(req, res, next) {
    try {
      const { id } = req.params;
      const taskId = parseInt(id, 10);

      if (isNaN(taskId)) {
        return sendError(res, 'Invalid task ID format.', 400);
      }

      const deleted = await TaskModel.delete(taskId, req.user.id);
      if (!deleted) {
        return sendError(res, 'Task not found or you do not have permission to delete it.', 404);
      }

      return sendSuccess(res, { id: taskId }, 'Task deleted successfully');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = TaskController;
