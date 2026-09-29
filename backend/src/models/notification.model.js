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
    reminderId = null,
    isDismissed = false,
  }) {
    const text = `
      INSERT INTO notifications (
        user_id, team_id, type, title, message, reference_type, reference_id, reminder_id, is_read, is_dismissed
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, $9)
      ON CONFLICT (user_id, reference_type, reference_id, type) WHERE reference_id IS NOT NULL DO NOTHING
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
      reminderId,
      isDismissed,
    ];
    const res = await query(text, values);
    if (!res.rows[0] && referenceType && referenceId) {
      return await this.findByUserAndReference(userId, referenceType, referenceId, type);
    }
    return res.rows[0];
  },

  /**
   * Find notifications for a user in their active/authorized team
   */
  async findAllForUser(
    userId,
    { teamId = null, limit = 50, onlyUnread = false, onlyActiveToasts = false } = {}
  ) {
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

    if (onlyActiveToasts) {
      text += ` AND n.is_dismissed = FALSE`;
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
   * Check if a notification already exists for a reminder
   */
  async findByReminderId(reminderId) {
    if (!reminderId) return null;
    const text = `SELECT * FROM notifications WHERE reminder_id = $1 LIMIT 1`;
    const res = await query(text, [reminderId]);
    return res.rows[0] || null;
  },

  /**
   * Check if a notification already exists for a specific user, reference, and type (duplicate prevention)
   */
  async findByUserAndReference(userId, referenceType, referenceId, type = null) {
    if (!userId || !referenceType || !referenceId) return null;
    let text = `
      SELECT * FROM notifications 
      WHERE user_id = $1 AND reference_type = $2 AND reference_id = $3
    `;
    const values = [userId, referenceType, referenceId];
    if (type) {
      text += ` AND type = $4`;
      values.push(type);
    }
    text += ` LIMIT 1`;
    const res = await query(text, values);
    return res.rows[0] || null;
  },


  /**
   * Mark single notification as read for user (optionally also mark dismissed)
   * View action: { dismiss: true } => is_read = true, is_dismissed = true
   * Mark as read action: { dismiss: false } => is_read = true
   */
  async markAsRead(id, userId, { dismiss = false } = {}) {
    let text = `
      UPDATE notifications
      SET is_read = TRUE
    `;
    if (dismiss) {
      text += `, is_dismissed = TRUE`;
    }
    text += `
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const res = await query(text, [id, userId]);
    return res.rows[0] || null;
  },

  /**
   * Mark notification as dismissed (Dismiss / X action: is_dismissed = true, is_read unchanged)
   */
  async markAsDismissed(id, userId) {
    const text = `
      UPDATE notifications
      SET is_dismissed = TRUE
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
