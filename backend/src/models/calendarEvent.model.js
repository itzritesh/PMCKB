const { query } = require('../config/db');

/**
 * Calendar Event Data Access Model
 * Team-isolated calendar events
 */
const CalendarEventModel = {
  /**
   * Create a new calendar event for a team
   */
  async create({ title, description, startDatetime, endDatetime, location, createdBy, teamId }) {
    const text = `
      INSERT INTO calendar_events (title, description, start_datetime, end_datetime, location, created_by, team_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;
    const values = [
      title.trim(),
      description ? description.trim() : null,
      startDatetime,
      endDatetime,
      location ? location.trim() : null,
      createdBy,
      teamId,
    ];
    const res = await query(text, values);
    return this.findById(res.rows[0].id);
  },

  /**
   * Find calendar events belonging to the verified workspace
   */
  async findAll({ teamId, userId, startDate, endDate }) {
    let text = `
      SELECT e.id, e.team_id, e.title, e.description, e.start_datetime, e.end_datetime,
             e.location, e.created_by, e.created_at, e.updated_at,
             u.name as creator_name, u.email as creator_email,
             tm.role as user_role
      FROM calendar_events e
      JOIN team_members tm ON tm.team_id = e.team_id
      INNER JOIN users u ON e.created_by = u.id
      WHERE e.team_id = $1 AND tm.user_id = $2
    `;
    const values = [teamId, userId];
    let paramIndex = 3;

    if (startDate) {
      text += ` AND e.end_datetime >= $${paramIndex}`;
      values.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      text += ` AND e.start_datetime <= $${paramIndex}`;
      values.push(endDate);
      paramIndex++;
    }

    text += ` ORDER BY e.start_datetime ASC`;
    const res = await query(text, values);
    return res.rows;
  },

  /**
   * Find single event by ID
   */
  async findById(id) {
    const text = `
      SELECT e.id, e.team_id, e.title, e.description, e.start_datetime, e.end_datetime,
             e.location, e.created_by, e.created_at, e.updated_at,
             u.name as creator_name, u.email as creator_email
      FROM calendar_events e
      INNER JOIN users u ON e.created_by = u.id
      WHERE e.id = $1
      LIMIT 1
    `;
    const res = await query(text, [id]);
    return res.rows[0] || null;
  },

  /**
   * Find single event by ID verifying team access
   */
  async findByIdAndTeam(id, userId) {
    const text = `
      SELECT e.id, e.team_id, e.title, e.description, e.start_datetime, e.end_datetime,
             e.location, e.created_by, e.created_at, e.updated_at,
             u.name as creator_name, u.email as creator_email,
             tm.role as user_role
      FROM calendar_events e
      JOIN team_members tm ON tm.team_id = e.team_id
      INNER JOIN users u ON e.created_by = u.id
      WHERE e.id = $1 AND tm.user_id = $2
      LIMIT 1
    `;
    const res = await query(text, [id, userId]);
    return res.rows[0] || null;
  },

  /**
   * Update calendar event
   */
  async update({ id, title, description, startDatetime, endDatetime, location }) {
    const text = `
      UPDATE calendar_events
      SET title = $1,
          description = $2,
          start_datetime = $3,
          end_datetime = $4,
          location = $5,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING id
    `;
    const values = [
      title.trim(),
      description ? description.trim() : null,
      startDatetime,
      endDatetime,
      location ? location.trim() : null,
      id,
    ];
    const res = await query(text, values);
    if (!res.rows[0]) return null;
    return this.findById(id);
  },

  /**
   * Delete calendar event
   */
  async delete(id) {
    const text = `DELETE FROM calendar_events WHERE id = $1 RETURNING id`;
    const res = await query(text, [id]);
    return res.rowCount > 0;
  },
};

module.exports = CalendarEventModel;
