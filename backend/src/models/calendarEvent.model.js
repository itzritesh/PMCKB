const { query } = require('../config/db');

/**
 * Calendar Event Data Access Model
 */
const CalendarEventModel = {
  /**
   * Create a new calendar event
   */
  async create({ title, description, startDatetime, endDatetime, location, createdBy }) {
    const text = `
      INSERT INTO calendar_events (title, description, start_datetime, end_datetime, location, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    const values = [
      title.trim(),
      description ? description.trim() : null,
      startDatetime,
      endDatetime,
      location ? location.trim() : null,
      createdBy,
    ];
    const res = await query(text, values);
    return this.findById(res.rows[0].id);
  },

  /**
   * Find events with optional date range filter and ownership/access
   * Sorted chronologically (start_datetime ASC)
   */
  async findAll({ userId, startDate, endDate }) {
    let text = `
      SELECT e.id, e.title, e.description, e.start_datetime, e.end_datetime,
             e.location, e.created_by, e.created_at, e.updated_at,
             u.name as creator_name, u.email as creator_email
      FROM calendar_events e
      INNER JOIN users u ON e.created_by = u.id
      WHERE 1=1
    `;
    const values = [];
    let paramIndex = 1;

    if (userId) {
      text += ` AND e.created_by = $${paramIndex}`;
      values.push(userId);
      paramIndex++;
    }

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
   * Find a single event by ID
   */
  async findById(id) {
    const text = `
      SELECT e.id, e.title, e.description, e.start_datetime, e.end_datetime,
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
   * Update an existing event (creator only)
   */
  async update({ id, userId, title, description, startDatetime, endDatetime, location }) {
    const text = `
      UPDATE calendar_events
      SET title = $1,
          description = $2,
          start_datetime = $3,
          end_datetime = $4,
          location = $5,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6 AND created_by = $7
      RETURNING id
    `;
    const values = [
      title.trim(),
      description ? description.trim() : null,
      startDatetime,
      endDatetime,
      location ? location.trim() : null,
      id,
      userId,
    ];
    const res = await query(text, values);
    if (!res.rows[0]) return null;
    return this.findById(id);
  },

  /**
   * Delete an existing event (creator only)
   */
  async delete({ id, userId }) {
    const text = `
      DELETE FROM calendar_events
      WHERE id = $1 AND created_by = $2
      RETURNING id
    `;
    const res = await query(text, [id, userId]);
    return res.rowCount > 0;
  },
};

module.exports = CalendarEventModel;
