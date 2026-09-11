const { query } = require('../config/db');

/**
 * Reminder Data Access Model
 * Team-isolated calendar and meeting reminders
 */
const ReminderModel = {
  /**
   * Create a new reminder
   */
  async create({
    teamId,
    userId,
    reminderType,
    referenceType,
    referenceId,
    remindAt,
    status = 'pending',
  }) {
    const text = `
      INSERT INTO reminders (
        team_id, user_id, reminder_type, reference_type, reference_id, remind_at, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      teamId,
      userId,
      reminderType || referenceType,
      referenceType,
      referenceId,
      remindAt,
      status,
    ];
    const res = await query(text, values);
    return res.rows[0];
  },

  /**
   * Find existing duplicate pending reminder for user and resource at same time
   */
  async findDuplicate({ userId, referenceType, referenceId, remindAt }) {
    const text = `
      SELECT * FROM reminders
      WHERE user_id = $1
        AND reference_type = $2
        AND reference_id = $3
        AND remind_at = $4
        AND status = 'pending'
      LIMIT 1
    `;
    const res = await query(text, [userId, referenceType, referenceId, remindAt]);
    return res.rows[0] || null;
  },

  /**
   * Find single reminder by ID
   */
  async findById(id) {
    const text = `
      SELECT r.*,
        t.name as team_name,
        u.name as user_name,
        u.email as user_email
      FROM reminders r
      INNER JOIN teams t ON r.team_id = t.id
      INNER JOIN users u ON r.user_id = u.id
      WHERE r.id = $1
      LIMIT 1
    `;
    const res = await query(text, [id]);
    return res.rows[0] || null;
  },

  /**
   * Find reminder verifying ownership and team access
   */
  async findByIdAndUser(id, userId) {
    const text = `
      SELECT r.*,
        t.name as team_name,
        u.name as user_name,
        u.email as user_email
      FROM reminders r
      INNER JOIN teams t ON r.team_id = t.id
      INNER JOIN users u ON r.user_id = u.id
      WHERE r.id = $1 AND r.user_id = $2
      LIMIT 1
    `;
    const res = await query(text, [id, userId]);
    return res.rows[0] || null;
  },

  /**
   * Find all reminders for a user in their authorized team(s)
   */
  async findAll({ userId, teamId, referenceType, referenceId, status }) {
    let text = `
      SELECT r.*,
        CASE
          WHEN r.reference_type = 'meeting' THEN m.title
          WHEN r.reference_type = 'calendar_event' THEN ce.title
          ELSE NULL
        END as resource_title,
        CASE
          WHEN r.reference_type = 'meeting' THEN m.start_datetime
          WHEN r.reference_type = 'calendar_event' THEN ce.start_datetime
          ELSE NULL
        END as resource_start_datetime,
        CASE
          WHEN r.reference_type = 'meeting' THEN m.location
          WHEN r.reference_type = 'calendar_event' THEN ce.location
          ELSE NULL
        END as resource_location
      FROM reminders r
      JOIN team_members tm ON tm.team_id = r.team_id AND tm.user_id = $1
      LEFT JOIN meetings m ON r.reference_type = 'meeting' AND r.reference_id = m.id
      LEFT JOIN calendar_events ce ON r.reference_type = 'calendar_event' AND r.reference_id = ce.id
      WHERE r.user_id = $1
    `;
    const values = [userId];
    let paramIndex = 2;

    if (teamId) {
      text += ` AND r.team_id = $${paramIndex}`;
      values.push(teamId);
      paramIndex++;
    }

    if (referenceType) {
      text += ` AND r.reference_type = $${paramIndex}`;
      values.push(referenceType);
      paramIndex++;
    }

    if (referenceId) {
      text += ` AND r.reference_id = $${paramIndex}`;
      values.push(referenceId);
      paramIndex++;
    }

    if (status && status !== 'all') {
      text += ` AND r.status = $${paramIndex}`;
      values.push(status);
      paramIndex++;
    }

    text += ` ORDER BY r.remind_at ASC`;
    const res = await query(text, values);
    return res.rows;
  },

  /**
   * Update reminder fields
   */
  async update(id, { remindAt, status }) {
    let setClauses = ['updated_at = CURRENT_TIMESTAMP'];
    const values = [id];
    let paramIndex = 2;

    if (remindAt) {
      setClauses.push(`remind_at = $${paramIndex}`);
      values.push(remindAt);
      paramIndex++;
    }

    if (status) {
      setClauses.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    const text = `
      UPDATE reminders
      SET ${setClauses.join(', ')}
      WHERE id = $1
      RETURNING *
    `;
    const res = await query(text, values);
    return res.rows[0] || null;
  },

  /**
   * Update reminder status (e.g. dismissed, cancelled)
   */
  async updateStatus(id, status) {
    const text = `
      UPDATE reminders
      SET status = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const res = await query(text, [id, status]);
    return res.rows[0] || null;
  },

  /**
   * Delete reminder
   */
  async delete(id) {
    const text = `DELETE FROM reminders WHERE id = $1 RETURNING *`;
    const res = await query(text, [id]);
    return res.rows[0] || null;
  },

  /**
   * Delete reminder scoped to user
   */
  async deleteByUserAndId(id, userId) {
    const text = `DELETE FROM reminders WHERE id = $1 AND user_id = $2 RETURNING *`;
    const res = await query(text, [id, userId]);
    return res.rows[0] || null;
  },

  /**
   * Atomically claim and mark due reminders as 'triggered'
   * Guarantees each due reminder is processed exactly once
   */
  async claimDueReminders() {
    const text = `
      UPDATE reminders
      SET status = 'triggered', updated_at = CURRENT_TIMESTAMP
      WHERE status = 'pending' AND remind_at <= CURRENT_TIMESTAMP
      RETURNING *
    `;
    const res = await query(text);
    return res.rows;
  },
};

module.exports = ReminderModel;
