const { TaskModel, ProjectModel, UserModel, TeamMemberModel, NotificationModel } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');
const { emitToUser } = require('../config/socket');
const WebPushService = require('../services/webPushService');
const { query } = require('../config/db');

const ALLOWED_STATUSES = ['todo', 'in_progress', 'completed'];
const ALLOWED_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

/**
 * Validate that every assignee ID in assigneeIds belongs to the target team.
 * Rejects invalid format or cross-team users with 403 Forbidden.
 * Deduplicates IDs.
 * @param {Array<number|string>|number|string} rawAssignees
 * @param {number} teamId
 * @returns {Promise<{valid: boolean, userIds: Array<number>, error?: string, status?: number}>}
 */
async function validateTeamAssignees(rawAssignees, teamId) {
  if (rawAssignees === undefined || rawAssignees === null) {
    return { valid: true, userIds: [] };
  }

  const list = Array.isArray(rawAssignees) ? rawAssignees : [rawAssignees];
  if (list.length === 0) {
    return { valid: true, userIds: [] };
  }

  // Parse IDs
  const parsedIds = [];
  for (const item of list) {
    if (item === null || item === '' || item === undefined) continue;
    const parsed = parseInt(item, 10);
    if (isNaN(parsed) || parsed <= 0) {
      return { valid: false, error: 'Invalid assignee user ID format.', status: 400 };
    }
    parsedIds.push(parsed);
  }

  const uniqueIds = [...new Set(parsedIds)];
  if (uniqueIds.length === 0) {
    return { valid: true, userIds: [] };
  }

  // Check that EVERY user belongs to the target team
  const checkRes = await query(
    `SELECT user_id FROM team_members WHERE team_id = $1 AND user_id = ANY($2::int[])`,
    [teamId, uniqueIds]
  );
  const foundUserIds = new Set(checkRes.rows.map((r) => r.user_id));

  for (const uid of uniqueIds) {
    if (!foundUserIds.has(uid)) {
      return {
        valid: false,
        error: `User ID ${uid} does not belong to this team. Cross-team assignment is strictly forbidden.`,
        status: 403,
      };
    }
  }

  return { valid: true, userIds: uniqueIds };
}

/**
 * Notify newly assigned users of a task assignment
 * @param {object} task
 * @param {Array<number>} newAssigneeIds
 * @param {Array<number>} previousAssigneeIds
 * @param {number|null} assignedBy
 */
async function notifyNewAssignees(task, newAssigneeIds, previousAssigneeIds = [], assignedBy = null) {
  if (!Array.isArray(newAssigneeIds) || newAssigneeIds.length === 0) return;
  const prevSet = new Set(previousAssigneeIds);

  for (const uid of newAssigneeIds) {
    if (!prevSet.has(uid) && uid !== assignedBy) {
      try {
        const notif = await NotificationModel.create({
          userId: uid,
          teamId: task.team_id,
          type: 'task_assigned',
          title: 'Task Assigned',
          message: `You were assigned to "${task.title}".`,
          referenceType: 'task',
          referenceId: task.id,
          isDismissed: false,
        });
        emitToUser(uid, 'notification:new', notif);
        WebPushService.sendPushToUser(uid, notif).catch(() => {});
      } catch (e) {
        console.warn('⚠️ [TaskController] Assignment notification error:', e.message);
      }
    }
  }
}

/**
 * Task Controller for CRUD and Multi-Assignment operations with team isolation & role rules
 */
const TaskController = {
  /**
   * Create a new task in a project (Leader only)
   * POST /api/tasks
   */
  async createTask(req, res, next) {
    try {
      // Enforce Leader role requirement: Members cannot create tasks
      if (req.teamRole !== 'leader') {
        return sendError(res, 'Access denied. Only team leaders can create tasks.', 403);
      }

      const { project_id, title, description, status, priority, due_date, assigned_to, assignee_ids } = req.body;

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

      // Multi-assignee support with backwards compatibility for assigned_to
      let rawAssignees = [];
      if (assignee_ids !== undefined) {
        rawAssignees = assignee_ids;
      } else if (assigned_to !== undefined && assigned_to !== null && assigned_to !== '') {
        rawAssignees = [assigned_to];
      }

      const assigneeValidation = await validateTeamAssignees(rawAssignees, project.team_id);
      if (!assigneeValidation.valid) {
        return sendError(res, assigneeValidation.error, assigneeValidation.status || 403);
      }

      const task = await TaskModel.create({
        projectId: project.id,
        teamId: project.team_id,
        title,
        description,
        status: taskStatus,
        priority: taskPriority,
        dueDate: formattedDueDate,
        assigneeIds: assigneeValidation.userIds,
        createdBy: req.user.id,
      });

      // Dispatch real-time assignment notifications
      notifyNewAssignees(task, assigneeValidation.userIds, [], req.user.id);

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
      const { title, description, status, priority, due_date, assigned_to, assignee_ids } = req.body;

      // Role check: If caller is a Member
      if (req.teamRole === 'member') {
        // Members can only update their own assigned tasks
        const isAssigned =
          req.resource.assigned_to === req.user.id ||
          (Array.isArray(req.resource.assignees) && req.resource.assignees.some((a) => a.id === req.user.id));

        if (!isAssigned) {
          return sendError(
            res,
            'Access denied. Members can only update their own assigned tasks.',
            403
          );
        }

        // Members can ONLY update status - reject changes to other properties
        const hasTitleChange = title !== undefined && title.trim() !== req.resource.title;
        const hasDescChange = description !== undefined && description.trim() !== (req.resource.description || '');
        const hasPriorityChange = priority !== undefined && priority !== req.resource.priority;
        const hasAssigneeChange = assigned_to !== undefined || assignee_ids !== undefined;

        let hasDateChange = false;
        if (due_date !== undefined) {
          const reqTime = due_date ? new Date(due_date).getTime() : null;
          const currTime = req.resource.due_date ? new Date(req.resource.due_date).getTime() : null;
          if (reqTime !== currTime) hasDateChange = true;
        }

        if (hasTitleChange || hasDescChange || hasPriorityChange || hasAssigneeChange || hasDateChange) {
          return sendError(
            res,
            'Access denied. Members can only update the status of their assigned tasks.',
            403
          );
        }

        const taskStatus = status || req.resource.status;
        if (!ALLOWED_STATUSES.includes(taskStatus)) {
          return sendError(
            res,
            `Invalid task status. Allowed values are: ${ALLOWED_STATUSES.join(', ')}`,
            400
          );
        }

        const updatedTask = await TaskModel.update({
          id: req.resource.id,
          title: req.resource.title,
          description: req.resource.description,
          status: taskStatus,
          priority: req.resource.priority,
          dueDate: req.resource.due_date,
        });

        return sendSuccess(res, { task: updatedTask }, 'Task status updated successfully');
      }

      // Leader flow:
      const taskTitle = title !== undefined ? (typeof title === 'string' ? title.trim() : '') : req.resource.title;
      if (!taskTitle) {
        return sendError(res, 'Task title cannot be empty.', 400);
      }

      if (taskTitle.length > 255) {
        return sendError(res, 'Task title cannot exceed 255 characters.', 400);
      }

      const taskDesc = description !== undefined ? description : req.resource.description;

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

      // Validate assignees if provided
      let targetAssigneeIds = undefined;
      if (assignee_ids !== undefined) {
        const val = await validateTeamAssignees(assignee_ids, req.resource.team_id);
        if (!val.valid) {
          return sendError(res, val.error, val.status || 403);
        }
        targetAssigneeIds = val.userIds;
      } else if (assigned_to !== undefined) {
        const legacyVal = assigned_to ? [assigned_to] : [];
        const val = await validateTeamAssignees(legacyVal, req.resource.team_id);
        if (!val.valid) {
          return sendError(res, val.error, val.status || 403);
        }
        targetAssigneeIds = val.userIds;
      }

      const prevAssigneeIds = (req.resource.assignees || []).map((a) => a.id);
      if (req.resource.assigned_to && !prevAssigneeIds.includes(req.resource.assigned_to)) {
        prevAssigneeIds.push(req.resource.assigned_to);
      }

      const updatedTask = await TaskModel.update({
        id: req.resource.id,
        title: taskTitle,
        description: taskDesc,
        status: taskStatus,
        priority: taskPriority,
        dueDate: formattedDueDate,
        assigneeIds: targetAssigneeIds,
        updatedBy: req.user.id,
      });

      // Dispatch notifications to newly assigned members
      if (targetAssigneeIds !== undefined) {
        notifyNewAssignees(updatedTask, targetAssigneeIds, prevAssigneeIds, req.user.id);
      }

      return sendSuccess(res, { task: updatedTask }, 'Task updated successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Assign or unassign a task (Leader only)
   * PUT /api/tasks/:id/assign
   */
  async assignTask(req, res, next) {
    try {
      if (req.teamRole !== 'leader') {
        return sendError(res, 'Access denied. Only team leaders can assign tasks.', 403);
      }

      const { assigned_to, assignee_ids } = req.body;

      let rawAssignees = [];
      if (assignee_ids !== undefined) {
        rawAssignees = assignee_ids;
      } else if (assigned_to !== undefined && assigned_to !== null && assigned_to !== '') {
        rawAssignees = [assigned_to];
      }

      const val = await validateTeamAssignees(rawAssignees, req.resource.team_id);
      if (!val.valid) {
        return sendError(res, val.error, val.status || 403);
      }

      const prevAssigneeIds = (req.resource.assignees || []).map((a) => a.id);
      if (req.resource.assigned_to && !prevAssigneeIds.includes(req.resource.assigned_to)) {
        prevAssigneeIds.push(req.resource.assigned_to);
      }

      const updatedTask = await TaskModel.assign({
        id: req.resource.id,
        assigneeIds: val.userIds,
        assignedBy: req.user.id,
      });

      notifyNewAssignees(updatedTask, val.userIds, prevAssigneeIds, req.user.id);

      return sendSuccess(res, { task: updatedTask }, 'Task assigned successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a task (Leader only)
   * DELETE /api/tasks/:id
   */
  async deleteTask(req, res, next) {
    try {
      if (req.teamRole !== 'leader') {
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
