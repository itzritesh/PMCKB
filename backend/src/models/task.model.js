const { query, pool } = require('../config/db');
const TaskAssigneeModel = require('./taskAssignee.model');

/**
 * Format a task row to ensure `assignees` is an array and backwards-compatible with `assigned_to`
 * @param {object} row
 * @returns {object}
 */
function formatTaskRow(row) {
  if (!row) return null;
  let assignees = row.assignees;
  if (typeof assignees === 'string') {
    try {
      assignees = JSON.parse(assignees);
    } catch {
      assignees = [];
    }
  }
  if (!Array.isArray(assignees)) {
    assignees = [];
  }

  // Fallback if task_assignees table row didn't exist yet but legacy assigned_to was populated
  if (assignees.length === 0 && row.assigned_to && row.assignee_name) {
    assignees = [
      {
        id: row.assigned_to,
        name: row.assignee_name,
        email: row.assignee_email,
      },
    ];
  }

  return {
    ...row,
    assignees,
  };
}

/**
 * SQL subquery fragment to aggregate assignees into a JSON array
 */
const ASSIGNEES_SUBQUERY = `
  COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'id', u_sub.id,
          'name', u_sub.name,
          'email', u_sub.email,
          'assigned_at', ta_sub.assigned_at
        ) ORDER BY ta_sub.assigned_at ASC, ta_sub.id ASC
      )
      FROM task_assignees ta_sub
      JOIN users u_sub ON u_sub.id = ta_sub.user_id
      WHERE ta_sub.task_id = t.id
    ),
    '[]'::json
  ) as assignees
`;

/**
 * Task Data Access Model
 * Supports single and multiple team-isolated assignees per task
 */
const TaskModel = {
  /**
   * Create a new task in a project and return with all assignee details
   */
  async create({
    projectId,
    teamId,
    title,
    description = '',
    status = 'todo',
    priority = 'medium',
    dueDate = null,
    assignedTo = null,
    assigneeIds = [],
    createdBy = null,
  }) {
    // Deduplicate assignee IDs
    let allAssigneeIds = Array.isArray(assigneeIds) ? [...assigneeIds] : [];
    if (assignedTo && !allAssigneeIds.includes(assignedTo)) {
      allAssigneeIds.unshift(assignedTo);
    }
    allAssigneeIds = [...new Set(allAssigneeIds.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id) && id > 0))];

    const primaryAssignee = allAssigneeIds.length > 0 ? allAssigneeIds[0] : null;

    const text = `
      INSERT INTO tasks (project_id, team_id, title, description, status, priority, due_date, assigned_to)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `;
    const values = [
      projectId,
      teamId,
      title.trim(),
      description ? description.trim() : '',
      status,
      priority,
      dueDate || null,
      primaryAssignee,
    ];
    const res = await query(text, values);
    const createdId = res.rows[0].id;

    // Populate task_assignees table
    if (allAssigneeIds.length > 0) {
      await TaskAssigneeModel.replaceAssignees(createdId, allAssigneeIds, createdBy);
    }

    return this.findById(createdId);
  },

  /**
   * Find a single task by ID
   */
  async findById(id) {
    const text = `
      SELECT t.id, t.project_id, t.team_id, t.title, t.description, t.status, t.priority,
             t.due_date, t.assigned_to, t.created_at, t.updated_at,
             p.name as project_name, p.owner_id,
             u.name as assignee_name, u.email as assignee_email,
             ${ASSIGNEES_SUBQUERY}
      FROM tasks t
      INNER JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.id = $1
      LIMIT 1
    `;
    const res = await query(text, [id]);
    return formatTaskRow(res.rows[0]);
  },

  /**
   * Find all tasks belonging to a specific project (verifying team membership)
   */
  async findAllByProject(projectId, userId) {
    const text = `
      SELECT t.id, t.project_id, t.team_id, t.title, t.description, t.status, t.priority,
             t.due_date, t.assigned_to, t.created_at, t.updated_at,
             u.name as assignee_name, u.email as assignee_email,
             tm.role as user_role,
             ${ASSIGNEES_SUBQUERY}
      FROM tasks t
      INNER JOIN projects p ON t.project_id = p.id
      JOIN team_members tm ON tm.team_id = t.team_id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.project_id = $1 AND tm.user_id = $2
      ORDER BY
        CASE WHEN t.status = 'completed' THEN 2 ELSE 1 END,
        t.due_date ASC NULLS LAST,
        t.created_at DESC
    `;
    const res = await query(text, [projectId, userId]);
    return res.rows.map(formatTaskRow);
  },

  /**
   * Find all tasks for a verified team
   */
  async findAllByTeam({ teamId, userId, projectId = null }) {
    let text = `
      SELECT t.id, t.project_id, t.team_id, t.title, t.description, t.status, t.priority,
             t.due_date, t.assigned_to, t.created_at, t.updated_at,
             p.name as project_name,
             u.name as assignee_name, u.email as assignee_email,
             tm.role as user_role,
             ${ASSIGNEES_SUBQUERY}
      FROM tasks t
      INNER JOIN projects p ON t.project_id = p.id
      JOIN team_members tm ON tm.team_id = t.team_id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.team_id = $1 AND tm.user_id = $2
    `;
    const values = [teamId, userId];

    if (projectId) {
      text += ` AND t.project_id = $3`;
      values.push(projectId);
    }

    text += `
      ORDER BY
        CASE WHEN t.status = 'completed' THEN 2 ELSE 1 END,
        t.due_date ASC NULLS LAST,
        t.created_at DESC
    `;
    const res = await query(text, values);
    return res.rows.map(formatTaskRow);
  },

  /**
   * Legacy findAllByOwner for compatibility
   */
  async findAllByOwner(ownerId) {
    const text = `
      SELECT t.id, t.project_id, t.team_id, t.title, t.description, t.status, t.priority,
             t.due_date, t.assigned_to, t.created_at, t.updated_at,
             p.name as project_name,
             u.name as assignee_name, u.email as assignee_email,
             ${ASSIGNEES_SUBQUERY}
      FROM tasks t
      INNER JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE p.owner_id = $1
      ORDER BY
        CASE WHEN t.status = 'completed' THEN 2 ELSE 1 END,
        t.due_date ASC NULLS LAST,
        t.created_at DESC
    `;
    const res = await query(text, [ownerId]);
    return res.rows.map(formatTaskRow);
  },

  /**
   * Find a single task by ID verifying team access
   */
  async findByIdAndTeam(id, userId) {
    const text = `
      SELECT t.id, t.project_id, t.team_id, t.title, t.description, t.status, t.priority,
             t.due_date, t.assigned_to, t.created_at, t.updated_at,
             p.name as project_name, p.owner_id,
             u.name as assignee_name, u.email as assignee_email,
             tm.role as user_role,
             ${ASSIGNEES_SUBQUERY}
      FROM tasks t
      INNER JOIN projects p ON t.project_id = p.id
      JOIN team_members tm ON tm.team_id = t.team_id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.id = $1 AND tm.user_id = $2
      LIMIT 1
    `;
    const res = await query(text, [id, userId]);
    return formatTaskRow(res.rows[0]);
  },

  /**
   * Legacy findByIdAndOwner
   */
  async findByIdAndOwner(id, ownerId) {
    return this.findByIdAndTeam(id, ownerId);
  },

  /**
   * Update an existing task
   */
  async update({ id, title, description, status, priority, dueDate, assignedTo, assigneeIds, updatedBy = null }) {
    // If assigneeIds is provided, update task_assignees
    let primaryAssignee = assignedTo;
    if (assigneeIds !== undefined) {
      const { assignees } = await TaskAssigneeModel.replaceAssignees(id, assigneeIds, updatedBy);
      primaryAssignee = assignees.length > 0 ? assignees[0].id : null;
    } else if (assignedTo !== undefined) {
      await TaskAssigneeModel.replaceAssignees(id, assignedTo ? [assignedTo] : [], updatedBy);
      primaryAssignee = assignedTo || null;
    }

    const text = `
      UPDATE tasks
      SET title = $1,
          description = $2,
          status = $3,
          priority = $4,
          due_date = $5,
          assigned_to = $6,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING id
    `;
    const values = [
      title.trim(),
      description !== undefined ? description.trim() : '',
      status,
      priority,
      dueDate || null,
      primaryAssignee !== undefined ? primaryAssignee : null,
      id,
    ];
    const res = await query(text, values);
    if (!res.rows[0]) return null;
    return this.findById(id);
  },

  /**
   * Assign or unassign a task (supports assigneeIds or assignedTo)
   */
  async assign({ id, assignedTo, assigneeIds, assignedBy = null }) {
    const targetIds = assigneeIds !== undefined
      ? assigneeIds
      : (assignedTo ? [assignedTo] : []);

    await TaskAssigneeModel.replaceAssignees(id, targetIds, assignedBy);
    return this.findById(id);
  },

  /**
   * Delete a task
   */
  async delete(id) {
    const text = `
      DELETE FROM tasks
      WHERE id = $1
      RETURNING id
    `;
    const res = await query(text, [id]);
    return res.rowCount > 0;
  },
};

module.exports = TaskModel;
