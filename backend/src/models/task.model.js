const { query } = require('../config/db');

/**
 * Task Data Access Model
 * Team-isolated task queries
 */
const TaskModel = {
  /**
   * Create a new task in a project and return with assignee details
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
  }) {
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
      assignedTo || null,
    ];
    const res = await query(text, values);
    const createdId = res.rows[0].id;
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
             u.name as assignee_name, u.email as assignee_email
      FROM tasks t
      INNER JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.id = $1
      LIMIT 1
    `;
    const res = await query(text, [id]);
    return res.rows[0] || null;
  },

  /**
   * Find all tasks belonging to a specific project (verifying team membership)
   */
  async findAllByProject(projectId, userId) {
    const text = `
      SELECT t.id, t.project_id, t.team_id, t.title, t.description, t.status, t.priority,
             t.due_date, t.assigned_to, t.created_at, t.updated_at,
             u.name as assignee_name, u.email as assignee_email,
             tm.role as user_role
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
    return res.rows;
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
             tm.role as user_role
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
    return res.rows;
  },

  /**
   * Legacy findAllByOwner for compatibility
   */
  async findAllByOwner(ownerId) {
    const text = `
      SELECT t.id, t.project_id, t.team_id, t.title, t.description, t.status, t.priority,
             t.due_date, t.assigned_to, t.created_at, t.updated_at,
             p.name as project_name,
             u.name as assignee_name, u.email as assignee_email
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
    return res.rows;
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
             tm.role as user_role
      FROM tasks t
      INNER JOIN projects p ON t.project_id = p.id
      JOIN team_members tm ON tm.team_id = t.team_id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.id = $1 AND tm.user_id = $2
      LIMIT 1
    `;
    const res = await query(text, [id, userId]);
    return res.rows[0] || null;
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
  async update({ id, title, description, status, priority, dueDate, assignedTo }) {
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
      assignedTo || null,
      id,
    ];
    const res = await query(text, values);
    if (!res.rows[0]) return null;
    return this.findById(id);
  },

  /**
   * Assign or unassign a task
   */
  async assign({ id, assignedTo }) {
    const text = `
      UPDATE tasks
      SET assigned_to = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id
    `;
    const res = await query(text, [assignedTo || null, id]);
    if (!res.rows[0]) return null;
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
