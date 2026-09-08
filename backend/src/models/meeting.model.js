const { query } = require('../config/db');

/**
 * Meeting Data Access Model
 * Team-isolated meeting queries
 */
const MeetingModel = {
  /**
   * Create a new meeting and automatically add organizer as an accepted attendee
   */
  async create({
    title,
    description,
    startDatetime,
    endDatetime,
    location,
    organizerId,
    teamId,
    status = 'scheduled',
  }) {
    const text = `
      INSERT INTO meetings (title, description, start_datetime, end_datetime, location, organizer_id, team_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `;
    const values = [
      title.trim(),
      description ? description.trim() : null,
      startDatetime,
      endDatetime,
      location ? location.trim() : null,
      organizerId,
      teamId,
      status,
    ];
    const res = await query(text, values);
    const meetingId = res.rows[0].id;

    // Automatically add organizer as attendee with 'accepted' status
    await query(
      `INSERT INTO meeting_attendees (meeting_id, user_id, response_status)
       VALUES ($1, $2, 'accepted')
       ON CONFLICT (meeting_id, user_id) DO NOTHING`,
      [meetingId, organizerId]
    );

    return this.findById(meetingId);
  },

  /**
   * Find all meetings accessible to the user in their workspace
   * Sorted chronologically (start_datetime ASC)
   */
  async findAll({ teamId, userId, status }) {
    let text = `
      SELECT m.id, m.team_id, m.title, m.description, m.start_datetime, m.end_datetime,
             m.location, m.organizer_id, m.status, m.created_at, m.updated_at,
             u.name as organizer_name, u.email as organizer_email,
             tm.role as user_role,
             COUNT(DISTINCT a.id)::int as attendee_count,
             EXISTS(
               SELECT 1 FROM meeting_attendees ma 
               WHERE ma.meeting_id = m.id AND ma.user_id = $2 AND ma.response_status = 'pending'
             ) as is_pending_for_user
      FROM meetings m
      JOIN team_members tm ON tm.team_id = m.team_id
      INNER JOIN users u ON m.organizer_id = u.id
      LEFT JOIN meeting_attendees a ON m.id = a.meeting_id
      WHERE m.team_id = $1 AND tm.user_id = $2
    `;
    const values = [teamId, userId];
    let paramIndex = 3;

    if (status && status !== 'all') {
      text += ` AND m.status = $${paramIndex}`;
      values.push(status);
      paramIndex++;
    }

    text += `
      GROUP BY m.id, u.name, u.email, tm.role
      ORDER BY m.start_datetime ASC
    `;

    const res = await query(text, values);
    return res.rows;
  },

  /**
   * Find single meeting by ID
   */
  async findById(id) {
    const text = `
      SELECT m.id, m.team_id, m.title, m.description, m.start_datetime, m.end_datetime,
             m.location, m.organizer_id, m.status, m.created_at, m.updated_at,
             u.name as organizer_name, u.email as organizer_email
      FROM meetings m
      INNER JOIN users u ON m.organizer_id = u.id
      WHERE m.id = $1
      LIMIT 1
    `;
    const res = await query(text, [id]);
    return res.rows[0] || null;
  },

  /**
   * Find single meeting by ID verifying team access
   */
  async findByIdAndTeam(id, userId) {
    const text = `
      SELECT m.id, m.team_id, m.title, m.description, m.start_datetime, m.end_datetime,
             m.location, m.organizer_id, m.status, m.created_at, m.updated_at,
             u.name as organizer_name, u.email as organizer_email,
             tm.role as user_role
      FROM meetings m
      JOIN team_members tm ON tm.team_id = m.team_id
      INNER JOIN users u ON m.organizer_id = u.id
      WHERE m.id = $1 AND tm.user_id = $2
      LIMIT 1
    `;
    const res = await query(text, [id, userId]);
    return res.rows[0] || null;
  },

  /**
   * Update meeting details
   */
  async update({ id, title, description, startDatetime, endDatetime, location, status }) {
    const text = `
      UPDATE meetings
      SET title = $1,
          description = $2,
          start_datetime = $3,
          end_datetime = $4,
          location = $5,
          status = $6,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING id
    `;
    const values = [
      title.trim(),
      description ? description.trim() : null,
      startDatetime,
      endDatetime,
      location ? location.trim() : null,
      status,
      id,
    ];
    const res = await query(text, values);
    if (!res.rows[0]) return null;
    return this.findById(id);
  },

  /**
   * Delete meeting
   */
  async delete(id) {
    const text = `DELETE FROM meetings WHERE id = $1 RETURNING id`;
    const res = await query(text, [id]);
    return res.rowCount > 0;
  },
};

module.exports = MeetingModel;
