const { query, pool } = require('../config/db');

/**
 * Task Assignee Data Access Model
 * Manages multiple assignees per task via task_assignees table.
 */
const TaskAssigneeModel = {
  /**
   * Find all assignees for a specific task
   * @param {number|string} taskId
   * @param {object} [client] - Optional pg client for transactions
   * @returns {Promise<Array<{id: number, name: string, email: string, assigned_at: string}>>}
   */
  async findByTask(taskId, client = null) {
    const text = `
      SELECT 
        u.id,
        u.name,
        u.email,
        ta.assigned_at,
        ta.assigned_by
      FROM task_assignees ta
      JOIN users u ON u.id = ta.user_id
      WHERE ta.task_id = $1
      ORDER BY ta.assigned_at ASC, ta.id ASC
    `;
    const executor = client || { query };
    const res = await executor.query(text, [taskId]);
    return res.rows;
  },

  /**
   * Find user IDs assigned to a task
   * @param {number|string} taskId
   * @param {object} [client]
   * @returns {Promise<Array<number>>}
   */
  async findUserIdsByTask(taskId, client = null) {
    const text = `
      SELECT user_id
      FROM task_assignees
      WHERE task_id = $1
      ORDER BY assigned_at ASC, id ASC
    `;
    const executor = client || { query };
    const res = await executor.query(text, [taskId]);
    return res.rows.map((r) => r.user_id);
  },

  /**
   * Check whether a user is assigned to a task
   * @param {number|string} taskId
   * @param {number|string} userId
   * @param {object} [client]
   * @returns {Promise<boolean>}
   */
  async isUserAssigned(taskId, userId, client = null) {
    const text = `
      SELECT 1 FROM task_assignees
      WHERE task_id = $1 AND user_id = $2
      LIMIT 1
    `;
    const executor = client || { query };
    const res = await executor.query(text, [taskId, userId]);
    return res.rows.length > 0;
  },

  /**
   * Atomically replace assignees for a task.
   * Uses client if provided, otherwise acquires a client from the pool with BEGIN/COMMIT/ROLLBACK.
   *
   * @param {number|string} taskId
   * @param {Array<number|string>} userIds
   * @param {number|string|null} assignedBy
   * @param {object} [existingClient]
   * @returns {Promise<{assignees: Array<object>, newlyAssignedUserIds: Array<number>, removedUserIds: Array<number>}>}
   */
  async replaceAssignees(taskId, userIds = [], assignedBy = null, existingClient = null) {
    const shouldManageTransaction = !existingClient;
    const client = existingClient || (await pool.connect());

    // Normalize and deduplicate IDs
    const targetUserIds = [
      ...new Set(
        (Array.isArray(userIds) ? userIds : [])
          .map((id) => parseInt(id, 10))
          .filter((id) => !isNaN(id) && id > 0)
      ),
    ];

    try {
      if (shouldManageTransaction) {
        await client.query('BEGIN');
      }

      // 1. Get current assignees
      const currentRes = await client.query(
        'SELECT user_id FROM task_assignees WHERE task_id = $1',
        [taskId]
      );
      const currentUserIds = currentRes.rows.map((r) => r.user_id);

      const toRemove = currentUserIds.filter((id) => !targetUserIds.includes(id));
      const toAdd = targetUserIds.filter((id) => !currentUserIds.includes(id));

      // 2. Remove unselected assignees
      if (toRemove.length > 0) {
        await client.query(
          'DELETE FROM task_assignees WHERE task_id = $1 AND user_id = ANY($2::int[])',
          [taskId, toRemove]
        );
      }

      // 3. Insert newly added assignees
      for (const uid of toAdd) {
        await client.query(
          `INSERT INTO task_assignees (task_id, user_id, assigned_by)
           VALUES ($1, $2, $3)
           ON CONFLICT (task_id, user_id) DO NOTHING`,
          [taskId, uid, assignedBy]
        );
      }

      // 4. Also update legacy tasks.assigned_to column for backward compatibility
      // (Uses first assignee ID or null if unassigned)
      const primaryAssignee = targetUserIds.length > 0 ? targetUserIds[0] : null;
      await client.query(
        'UPDATE tasks SET assigned_to = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [primaryAssignee, taskId]
      );

      // 5. Fetch updated list of assignees
      const updatedAssignees = await this.findByTask(taskId, client);

      if (shouldManageTransaction) {
        await client.query('COMMIT');
      }

      return {
        assignees: updatedAssignees,
        newlyAssignedUserIds: toAdd,
        removedUserIds: toRemove,
      };
    } catch (err) {
      if (shouldManageTransaction) {
        await client.query('ROLLBACK');
      }
      throw err;
    } finally {
      if (shouldManageTransaction) {
        client.release();
      }
    }
  },
};

module.exports = TaskAssigneeModel;
