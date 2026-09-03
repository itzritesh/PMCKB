const { query } = require('../config/db');

/**
 * Task Data Access Model
 * Ensures tasks can only be accessed, updated, or deleted if the parent project is owned by the user.
 */
const TaskModel = {
  /**
   * Create a new task in a project and return with assignee details
   * @param {object} params
   * @param {number|string} params.projectId
   * @param {number|string} params.ownerId
   * @param {string} params.title
   * @param {string} [params.description]
   * @param {string} [params.status='todo']
   * @param {string} [params.priority='medium']
   * @param {string|Date|null} [params.dueDate=null]
   * @param {number|string|null} [params.assignedTo=null]
   * @returns {Promise<object>} Created task with assignee details
   */
  async create({
    projectId,
    ownerId,
    title,
    description = '',
    status = 'todo',
    priority = 'medium',
    dueDate = null,
    assignedTo = null,
  }) {
    const text = `
      INSERT INTO tasks (project_id, title, description, status, priority, due_date, assigned_to)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;
    const values = [
      projectId,
      title.trim(),
      description ? description.trim() : '',
      status,
      priority,
      dueDate || null,
      assignedTo || null,
    ];
    const res = await query(text, values);
    const createdId = res.rows[0].id;
    return this.findByIdAndOwner(createdId, ownerId);
  },

  /**
   * Find all tasks belonging to a specific project (verifying project ownership)
   * @param {number|string} projectId
   * @param {number|string} ownerId
   * @returns {Promise<Array<object>>}
   */
  async findAllByProject(projectId, ownerId) {
    const text = `
      SELECT t.id, t.project_id, t.title, t.description, t.status, t.priority,
             t.due_date, t.assigned_to, t.created_at, t.updated_at,
             u.name as assignee_name, u.email as assignee_email
      FROM tasks t
      INNER JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.project_id = $1 AND p.owner_id = $2
      ORDER BY
        CASE WHEN t.status = 'completed' THEN 2 ELSE 1 END,
        t.due_date ASC NULLS LAST,
        t.created_at DESC
    `;
    const res = await query(text, [projectId, ownerId]);
    return res.rows;
  },

  /**
   * Find all tasks across all projects owned by the user
   * @param {number|string} ownerId
   * @returns {Promise<Array<object>>}
   */
  async findAllByOwner(ownerId) {
    const text = `
      SELECT t.id, t.project_id, t.title, t.description, t.status, t.priority,
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
   * Find a single task by ID verifying project ownership
   * @param {number|string} id
   * @param {number|string} ownerId
   * @returns {Promise<object|null>}
   */
  async findByIdAndOwner(id, ownerId) {
    const text = `
      SELECT t.id, t.project_id, t.title, t.description, t.status, t.priority,
             t.due_date, t.assigned_to, t.created_at, t.updated_at,
             p.name as project_name, p.owner_id,
             u.name as assignee_name, u.email as assignee_email
      FROM tasks t
      INNER JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.id = $1 AND p.owner_id = $2
      LIMIT 1
    `;
    const res = await query(text, [id, ownerId]);
    return res.rows[0] || null;
  },

  /**
   * Update an existing task ensuring ownership
   * @param {object} params
   * @param {number|string} params.id
   * @param {number|string} params.ownerId
   * @param {string} params.title
   * @param {string} params.description
   * @param {string} params.status
   * @param {string} params.priority
   * @param {string|Date|null} params.dueDate
   * @param {number|string|null} params.assignedTo
   * @returns {Promise<object|null>}
   */
  async update({ id, ownerId, title, description, status, priority, dueDate, assignedTo }) {
    const text = `
      UPDATE tasks t
      SET title = $1,
          description = $2,
          status = $3,
          priority = $4,
          due_date = $5,
          assigned_to = $6,
          updated_at = CURRENT_TIMESTAMP
      FROM projects p
      WHERE t.id = $7 AND t.project_id = p.id AND p.owner_id = $8
      RETURNING t.id
    `;
    const values = [
      title.trim(),
      description !== undefined ? description.trim() : '',
      status,
      priority,
      dueDate || null,
      assignedTo || null,
      id,
      ownerId,
    ];
    const res = await query(text, values);
    if (!res.rows[0]) return null;
    return this.findByIdAndOwner(id, ownerId);
  },

  /**
   * Assign or unassign a task ensuring ownership
   * @param {object} params
   * @param {number|string} params.id
   * @param {number|string} params.ownerId
   * @param {number|string|null} params.assignedTo
   * @returns {Promise<object|null>}
   */
  async assign({ id, ownerId, assignedTo }) {
    const text = `
      UPDATE tasks t
      SET assigned_to = $1,
          updated_at = CURRENT_TIMESTAMP
      FROM projects p
      WHERE t.id = $2 AND t.project_id = p.id AND p.owner_id = $3
      RETURNING t.id
    `;
    const res = await query(text, [assignedTo || null, id, ownerId]);
    if (!res.rows[0]) return null;
    return this.findByIdAndOwner(id, ownerId);
  },

  /**
   * Delete a task ensuring ownership
   * @param {number|string} id
   * @param {number|string} ownerId
   * @returns {Promise<boolean>}
   */
  async delete(id, ownerId) {
    const text = `
      DELETE FROM tasks t
      USING projects p
      WHERE t.id = $1 AND t.project_id = p.id AND p.owner_id = $2
      RETURNING t.id
    `;
    const res = await query(text, [id, ownerId]);
    return res.rowCount > 0;
  },
};

module.exports = TaskModel;
