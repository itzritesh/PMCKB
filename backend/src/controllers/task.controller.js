const { TaskModel, ProjectModel, UserModel, TeamMemberModel } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

const ALLOWED_STATUSES = ['todo', 'in_progress', 'completed'];
const ALLOWED_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

/**
 * Task Controller for CRUD and Assignment operations with team isolation & role rules
 */
const TaskController = {
  /**
   * Create a new task in a project
   * POST /api/tasks
   */
  async createTask(req, res, next) {
    try {
      const { project_id, title, description, status, priority, due_date, assigned_to } = req.body;

      const projectId = parseInt(project_id, 10);
      if (isNaN(projectId)) {
        return sendError(res, 'A valid project_id is required.', 400);
      }

      // Verify the target project exists and belongs to the user's workspace
      const project = await ProjectModel.findByIdAndTeam(projectId, req.user.id);
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

      const taskStatus = status || 'todo';
      if (!ALLOWED_STATUSES.includes(taskStatus)) {
        return sendError(
          res,
          `Invalid task status. Allowed values are: ${ALLOWED_STATUSES.join(', ')}`,
          400
        );
      }

      const taskPriority = priority || 'medium';
      if (!ALLOWED_PRIORITIES.includes(taskPriority)) {
        return sendError(
          res,
          `Invalid task priority. Allowed values are: ${ALLOWED_PRIORITIES.join(', ')}`,
          400
        );
      }

      let formattedDueDate = null;
      if (due_date) {
        const parsedDate = new Date(due_date);
        if (isNaN(parsedDate.getTime())) {
          return sendError(res, 'Invalid due_date format.', 400);
        }
        formattedDueDate = parsedDate.toISOString();
      }

      // Role check: Arbitrary task assignment
      let assigneeId = null;
      if (assigned_to !== undefined && assigned_to !== null && assigned_to !== '') {
        const parsedUserId = parseInt(assigned_to, 10);
        if (isNaN(parsedUserId)) {
          return sendError(res, 'Invalid assigned_to user ID format.', 400);
        }

        // Check if member is assigning to someone other than themselves
        if (parsedUserId !== req.user.id && req.teamRole !== 'leader') {
          return sendError(
            res,
            'Access denied. Only team leaders can assign tasks to other team members.',
            403
          );
        }

        // Verify assignee belongs to the same workspace or auto-add by leader
        const assigneeMembership = await TeamMemberModel.findByTeamAndUser(project.team_id, parsedUserId);
        if (!assigneeMembership) {
          const targetUser = await UserModel.findById(parsedUserId);
          if (targetUser && req.teamRole === 'leader') {
            await TeamMemberModel.addMember({
              teamId: project.team_id,
              userId: parsedUserId,
              role: 'member',
            });
          } else {
            return sendError(res, 'Assignee must be a member of this workspace.', 400);
          }
        }

        assigneeId = parsedUserId;
      }

      const task = await TaskModel.create({
        projectId: project.id,
        teamId: project.team_id,
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
   * Get all tasks for the verified workspace or a specific project
   * GET /api/tasks
   */
  async getTasks(req, res, next) {
    try {
      const { project_id } = req.query;

      let projectId = null;
      if (project_id) {
        projectId = parseInt(project_id, 10);
        if (isNaN(projectId)) {
          return sendError(res, 'Invalid project_id filter format.', 400);
        }

        const project = await ProjectModel.findByIdAndTeam(projectId, req.user.id);
        if (!project) {
          return sendError(res, 'Project not found or access denied.', 404);
        }
      }

      const tasks = await TaskModel.findAllByTeam({
        teamId: req.teamId,
        userId: req.user.id,
        projectId,
      });

      return sendSuccess(
        res,
        {
          tasks,
          total: tasks.length,
          projectId: projectId || null,
          teamId: req.teamId,
        },
        'Tasks fetched successfully'
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get single task by ID
   * GET /api/tasks/:id
   */
  async getTaskById(req, res, next) {
    try {
      return sendSuccess(res, { task: req.resource }, 'Task retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update an existing task
   * PUT /api/tasks/:id
   */
  async updateTask(req, res, next) {
    try {
      const { title, description, status, priority, due_date, assigned_to } = req.body;

      if (!title || typeof title !== 'string' || !title.trim()) {
        return sendError(res, 'Task title is required and cannot be empty.', 400);
      }

      if (title.trim().length > 255) {
        return sendError(res, 'Task title cannot exceed 255 characters.', 400);
      }

      const taskStatus = status || req.resource.status;
      if (!ALLOWED_STATUSES.includes(taskStatus)) {
        return sendError(
          res,
          `Invalid task status. Allowed values are: ${ALLOWED_STATUSES.join(', ')}`,
          400
        );
      }

      const taskPriority = priority || req.resource.priority;
      if (!ALLOWED_PRIORITIES.includes(taskPriority)) {
        return sendError(
          res,
          `Invalid task priority. Allowed values are: ${ALLOWED_PRIORITIES.join(', ')}`,
          400
        );
      }

      let formattedDueDate = req.resource.due_date;
      if (due_date !== undefined) {
        if (due_date === null || due_date === '') {
          formattedDueDate = null;
        } else {
          const parsedDate = new Date(due_date);
          if (isNaN(parsedDate.getTime())) {
            return sendError(res, 'Invalid due_date format.', 400);
          }
          formattedDueDate = parsedDate.toISOString();
        }
      }

      // Role check: Arbitrary task assignment
      let assigneeId = req.resource.assigned_to;
      if (assigned_to !== undefined) {
        if (assigned_to === null || assigned_to === '') {
          // If non-leader attempts to unassign someone else
          if (req.resource.assigned_to && req.resource.assigned_to !== req.user.id && req.teamRole !== 'leader') {
            return sendError(res, 'Access denied. Only team leaders can modify other members’ assignments.', 403);
          }
          assigneeId = null;
        } else {
          const parsedUserId = parseInt(assigned_to, 10);
          if (isNaN(parsedUserId)) {
            return sendError(res, 'Invalid assigned_to user ID format.', 400);
          }

          if (parsedUserId !== req.user.id && req.teamRole !== 'leader') {
            return sendError(
              res,
              'Access denied. Only team leaders can assign tasks to other team members.',
              403
            );
          }

          const assigneeMembership = await TeamMemberModel.findByTeamAndUser(req.resource.team_id, parsedUserId);
          if (!assigneeMembership) {
            const targetUser = await UserModel.findById(parsedUserId);
            if (targetUser && req.teamRole === 'leader') {
              await TeamMemberModel.addMember({
                teamId: req.resource.team_id,
                userId: parsedUserId,
                role: 'member',
              });
            } else {
              return sendError(res, 'Assignee must be a member of this workspace.', 400);
            }
          }

          assigneeId = parsedUserId;
        }
      }

      const updatedTask = await TaskModel.update({
        id: req.resource.id,
        title,
        description,
        status: taskStatus,
        priority: taskPriority,
        dueDate: formattedDueDate,
        assignedTo: assigneeId,
      });

      return sendSuccess(res, { task: updatedTask }, 'Task updated successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Assign or unassign a task
   * PUT /api/tasks/:id/assign
   */
  async assignTask(req, res, next) {
    try {
      const { assigned_to } = req.body;

      let assigneeId = null;
      if (assigned_to !== undefined && assigned_to !== null && assigned_to !== '') {
        const parsedUserId = parseInt(assigned_to, 10);
        if (isNaN(parsedUserId)) {
          return sendError(res, 'Invalid assigned_to user ID format.', 400);
        }

        if (parsedUserId !== req.user.id && req.teamRole !== 'leader') {
          return sendError(
            res,
            'Access denied. Only team leaders can assign tasks to other team members.',
            403
          );
        }

        const assigneeMembership = await TeamMemberModel.findByTeamAndUser(req.resource.team_id, parsedUserId);
        if (!assigneeMembership) {
          const targetUser = await UserModel.findById(parsedUserId);
          if (targetUser && req.teamRole === 'leader') {
            await TeamMemberModel.addMember({
              teamId: req.resource.team_id,
              userId: parsedUserId,
              role: 'member',
            });
          } else {
            return sendError(res, 'Assignee must be a member of this workspace.', 400);
          }
        }

        assigneeId = parsedUserId;
      } else {
        if (req.resource.assigned_to && req.resource.assigned_to !== req.user.id && req.teamRole !== 'leader') {
          return sendError(res, 'Access denied. Only team leaders can modify other members’ assignments.', 403);
        }
      }

      const updatedTask = await TaskModel.assign({
        id: req.resource.id,
        assignedTo: assigneeId,
      });

      return sendSuccess(res, { task: updatedTask }, 'Task assigned successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a task (Leader or creator)
   * DELETE /api/tasks/:id
   */
  async deleteTask(req, res, next) {
    try {
      if (req.teamRole !== 'leader' && req.resource.assigned_to !== req.user.id) {
        return sendError(res, 'Access denied. Only team leaders can delete tasks.', 403);
      }

      await TaskModel.delete(req.resource.id);
      return sendSuccess(res, { id: req.resource.id }, 'Task deleted successfully');
    } catch (error) {
      next(error);
    }
  },
};

// Provide aliases for backwards route compatibility
TaskController.getAllTasks = TaskController.getTasks;
TaskController.getTasksByProject = async (req, res, next) => {
  req.query.project_id = req.params.projectId;
  return TaskController.getTasks(req, res, next);
};

module.exports = TaskController;
