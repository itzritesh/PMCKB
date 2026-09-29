const { AnnouncementModel } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');
const { pool } = require('../config/db');
const { emitToUser } = require('../config/socket');
const WebPushService = require('../services/webPushService');

const AnnouncementController = {
  /**
   * Get all announcements for the verified workspace
   * GET /api/announcements
   */
  async getAnnouncements(req, res, next) {
    try {
      const targetTeamId = req.teamId || (req.params.teamId ? parseInt(req.params.teamId, 10) : undefined);
      const announcements = await AnnouncementModel.findAllByTeam({
        teamId: targetTeamId,
        userId: req.user.id,
      });

      return sendSuccess(
        res,
        {
          announcements,
          total: announcements.length,
          teamId: targetTeamId,
        },
        'Announcements fetched successfully'
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get single announcement by ID
   * GET /api/announcements/:id
   */
  async getAnnouncementById(req, res, next) {
    try {
      // req.resource is populated by verifyResourceTeamAccess
      return sendSuccess(res, { announcement: req.resource }, 'Announcement retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create an announcement (leader only)
   * POST /api/announcements or POST /api/teams/:teamId/announcements
   * Automatically generates notifications for active team members (excluding creator)
   */
  async createAnnouncement(req, res, next) {
    const client = await pool.connect();
    try {
      const targetTeamId = req.teamId || (req.params.teamId ? parseInt(req.params.teamId, 10) : undefined);
      const { title } = req.body;
      const message = req.body.message || req.body.content;

      if (!title || typeof title !== 'string' || !title.trim()) {
        client.release();
        return sendError(res, 'Announcement title is required.', 400);
      }

      if (!message || typeof message !== 'string' || !message.trim()) {
        client.release();
        return sendError(res, 'Announcement message content is required.', 400);
      }

      await client.query('BEGIN');

      // 1. Insert announcement into database
      const insertAnnounceText = `
        INSERT INTO announcements (team_id, title, message, created_by)
        VALUES ($1, $2, $3, $4)
        RETURNING id, team_id, title, message, created_by, created_at, updated_at
      `;
      const announceRes = await client.query(insertAnnounceText, [
        targetTeamId,
        title.trim(),
        message.trim(),
        req.user.id,
      ]);
      const announcement = announceRes.rows[0];

      // 2. Fetch creator's display name
      let creatorName = req.user?.name;
      if (!creatorName) {
        const userRes = await client.query('SELECT name FROM users WHERE id = $1', [req.user.id]);
        creatorName = userRes.rows[0]?.name || 'Team Leader';
      }

      // 3. Find all ACTIVE members of the SAME team
      const membersText = `
        SELECT tm.user_id, tm.role, u.name, u.email
        FROM team_members tm
        JOIN users u ON u.id = tm.user_id
        WHERE tm.team_id = $1
      `;
      const membersRes = await client.query(membersText, [targetTeamId]);
      const allMembers = membersRes.rows;

      // Filter out announcement creator (creator sees announcement immediately, avoid redundant alert)
      const recipients = allMembers.filter((m) => Number(m.user_id) !== Number(req.user.id));

      const notifTitle = 'New Team Announcement';
      const notifMessage = `${creatorName} posted "${title.trim()}"`;

      // 4. Create one notification record for each recipient (with duplicate prevention)
      const createdNotifications = [];
      for (const recipient of recipients) {
        // Safe check for duplicate notification
        const checkText = `
          SELECT id FROM notifications 
          WHERE user_id = $1 AND reference_type = 'announcement' AND reference_id = $2 AND type = 'team_announcement'
          LIMIT 1
        `;
        const existing = await client.query(checkText, [recipient.user_id, announcement.id]);

        if (existing.rows.length === 0) {
          const notifInsertText = `
            INSERT INTO notifications (
              user_id, team_id, type, title, message, reference_type, reference_id, is_read, is_dismissed
            )
            VALUES ($1, $2, 'team_announcement', $3, $4, 'announcement', $5, FALSE, FALSE)
            ON CONFLICT (user_id, reference_type, reference_id, type) WHERE reference_id IS NOT NULL DO NOTHING
            RETURNING *
          `;
          const notifRes = await client.query(notifInsertText, [
            recipient.user_id,
            targetTeamId,
            notifTitle,
            notifMessage,
            announcement.id,
          ]);
          if (notifRes.rows[0]) {
            createdNotifications.push(notifRes.rows[0]);
          }
        }
      }

      await client.query('COMMIT');
      client.release();

      // 5. Emit real-time events & dispatch Web Push after successful DB commit
      for (const notif of createdNotifications) {
        try {
          // Real-time: emit ONLY to the recipient's private user socket room
          emitToUser(notif.user_id, 'notification:new', notif);
        } catch (socketErr) {
          console.warn(`⚠️ [AnnouncementController] Socket emit failed for user ${notif.user_id}:`, socketErr.message);
        }

        // Web Push notification (fire-and-forget; failure will NOT fail announcement)
        WebPushService.sendPushToUser(notif.user_id, {
          id: notif.id,
          type: 'team_announcement',
          title: notif.title,
          message: notif.message,
          reference_type: 'announcement',
          reference_id: announcement.id,
          url: `/announcements?id=${announcement.id}&notifId=${notif.id}`,
        }).catch((pushErr) => {
          console.warn(`⚠️ [AnnouncementController] Web Push delivery failed for user ${notif.user_id}:`, pushErr.message);
        });
      }

      return sendSuccess(res, { announcement }, 'Announcement created successfully', 201);
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rbErr) {
        // ignore rollback errors
      }
      client.release();
      next(error);
    }
  },

  /**
   * Update an announcement (leader only)
   * PUT /api/announcements/:id
   */
  async updateAnnouncement(req, res, next) {
    try {
      const { title } = req.body;
      const message = req.body.message || req.body.content;

      if (!title || typeof title !== 'string' || !title.trim()) {
        return sendError(res, 'Announcement title is required.', 400);
      }

      if (!message || typeof message !== 'string' || !message.trim()) {
        return sendError(res, 'Announcement message content is required.', 400);
      }

      const updated = await AnnouncementModel.update({
        id: req.resource.id,
        teamId: req.teamId,
        title,
        message,
      });

      return sendSuccess(res, { announcement: updated }, 'Announcement updated successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete an announcement (leader only)
   * DELETE /api/announcements/:id
   */
  async deleteAnnouncement(req, res, next) {
    try {
      await AnnouncementModel.delete(req.resource.id, req.teamId);
      return sendSuccess(res, { id: req.resource.id }, 'Announcement deleted successfully');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = AnnouncementController;
