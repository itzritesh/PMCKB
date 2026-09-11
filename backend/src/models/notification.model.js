const { query } = require('../config/db');

/**
 * Notification Data Access Model
 * User-facing notifications (reminders, announcements, etc.)
 */
const NotificationModel = {
  /**
   * Create a new notification
   */
  async create({
    userId,
    teamId,
    type = 'reminder',
    title,
    message,
    referenceType = null,
    referenceId = null,
  }) {
    const text = `
      INSERT INTO notifications (
        user_id, team_id, type, title, message, reference_type, reference_id, is_read
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)
      RETURNING *
    `;
    const values = [
      userId,
      teamId,
      type,
      title.trim(),
      message.trim(),
      referenceType,
      referenceId,
    ];
    const res = await query(text, values);
    return res.rows[0];
  },

  /**
   * Find notifications for a user in their active/authorized team
   */
  async findAllForUser(userId, { teamId = null, limit = 50, onlyUnread = false } = {}) {
    let text = `
      SELECT n.*,
        t.name as team_name
      FROM notifications n
      JOIN team_members tm ON tm.team_id = n.team_id AND tm.user_id = $1
      INNER JOIN teams t ON n.team_id = t.id
      WHERE n.user_id = $1
    `;
    const values = [userId];
    let paramIndex = 2;

    if (teamId) {
      text += ` AND n.team_id = $${paramIndex}`;
      values.push(teamId);
      paramIndex++;
    }

    if (onlyUnread) {
      text += ` AND n.is_read = FALSE`;
    }

    text += ` ORDER BY n.created_at DESC LIMIT $${paramIndex}`;
    values.push(limit);

    const res = await query(text, values);
    return res.rows;
  },

  /**
   * Count unread notifications for a user (scoped to team if provided)
   */
  async countUnread(userId, teamId = null) {
    let text = `
      SELECT COUNT(n.id)::int as unread_count
      FROM notifications n
      JOIN team_members tm ON tm.team_id = n.team_id AND tm.user_id = $1
      WHERE n.user_id = $1 AND n.is_read = FALSE
    `;
    const values = [userId];

    if (teamId) {
      text += ` AND n.team_id = $2`;
      values.push(teamId);
    }

    const res = await query(text, values);
    return res.rows[0]?.unread_count || 0;
  },

  /**
   * Find single notification by ID
   */
  async findById(id) {
    const text = `SELECT * FROM notifications WHERE id = $1 LIMIT 1`;
    const res = await query(text, [id]);
    return res.rows[0] || null;
  },

  /**
   * Mark single notification as read for user
   */
  async markAsRead(id, userId) {
    const text = `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const res = await query(text, [id, userId]);
    return res.rows[0] || null;
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId, teamId = null) {
    let text = `
      UPDATE notifications
      SET is_read = TRUE
      WHERE user_id = $1 AND is_read = FALSE
    `;
    const values = [userId];

    if (teamId) {
      text += ` AND team_id = $2`;
      values.push(teamId);
    }

    text += ` RETURNING id`;
    const res = await query(text, values);
    return res.rows.length;
  },

  /**
   * Delete a notification for user
   */
  async delete(id, userId) {
    const text = `DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *`;
    const res = await query(text, [id, userId]);
    return res.rows[0] || null;
  },
};

module.exports = NotificationModel;
