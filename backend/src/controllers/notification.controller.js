const { NotificationModel } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');
const { emitToUser } = require('../config/socket');
const { query } = require('../config/db');

const NotificationController = {
  /**
   * Safe development test endpoint to emit a real-time notification
   * POST /api/notifications/test
   */
  async sendTestNotification(req, res, next) {
    try {
      if (process.env.NODE_ENV === 'production') {
        return sendError(res, 'Test endpoint is only available in development.', 403);
      }

      const { reference_type = 'calendar_event', title, message, reference_id = 1 } = req.body;

      // Find user's active team or primary membership
      let targetTeamId = req.teamId;
      if (!targetTeamId) {
        const primaryRes = await query(
          'SELECT team_id FROM team_members WHERE user_id = $1 ORDER BY team_id ASC LIMIT 1',
          [req.user.id]
        );
        targetTeamId = primaryRes.rows[0]?.team_id || 1;
      }

      const notifTitle =
        title || (reference_type === 'meeting' ? 'Meeting Reminder' : 'Calendar Reminder');
      const notifMessage =
        message ||
        (reference_type === 'meeting'
          ? '"Weekly Project Review" starts in 15 minutes.'
          : '"Project Planning" starts in 10 minutes.');

      const notif = await NotificationModel.create({
        userId: req.user.id,
        teamId: targetTeamId,
        type: 'reminder',
        title: notifTitle,
        message: notifMessage,
        referenceType: reference_type,
        referenceId: parseInt(reference_id, 10) || 1,
      });

      emitToUser(req.user.id, 'notification:new', notif);

      return sendSuccess(
        res,
        { notification: notif },
        'Test reminder notification dispatched successfully.'
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Trigger reminder processing cycle (dev/test only)
   * POST /api/notifications/trigger-reminders
   */
  async triggerReminderCycle(req, res, next) {
    try {
      if (process.env.NODE_ENV === 'production') {
        return sendError(res, 'Test endpoint is only available in development.', 403);
      }
      const { checkAndTriggerReminders } = require('../services/reminderProcessor');
      const result = await checkAndTriggerReminders();
      return sendSuccess(res, result, 'Reminder processor executed.');
    } catch (error) {
      next(error);
    }
  },

  /**
   * List notifications for authenticated user
   * GET /api/notifications
   */
  async list(req, res, next) {
    try {
      const teamId = req.teamId || null;
      const limit = parseInt(req.query.limit, 10) || 50;
      const onlyUnread = req.query.unread === 'true';

      const [notifications, unreadCount] = await Promise.all([
        NotificationModel.findAllForUser(req.user.id, {
          teamId,
          limit,
          onlyUnread,
        }),
        NotificationModel.countUnread(req.user.id, teamId),
      ]);

      return sendSuccess(
        res,
        {
          notifications,
          unreadCount,
        },
        'Notifications retrieved successfully.'
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Mark a notification as read
   * PATCH /api/notifications/:id/read
   */
  async markRead(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return sendError(res, 'Invalid notification ID.', 400);
      }

      const updated = await NotificationModel.markAsRead(id, req.user.id);
      if (!updated) {
        return sendError(res, 'Notification not found or unauthorized.', 404);
      }

      const unreadCount = await NotificationModel.countUnread(req.user.id, req.teamId || null);

      return sendSuccess(
        res,
        { notification: updated, unreadCount },
        'Notification marked as read.'
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Mark all notifications as read for the user
   * PATCH /api/notifications/read-all
   */
  async markAllRead(req, res, next) {
    try {
      const teamId = req.teamId || null;
      const updatedCount = await NotificationModel.markAllAsRead(req.user.id, teamId);

      return sendSuccess(
        res,
        { updatedCount, unreadCount: 0 },
        'All notifications marked as read.'
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a notification
   * DELETE /api/notifications/:id
   */
  async delete(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return sendError(res, 'Invalid notification ID.', 400);
      }

      const deleted = await NotificationModel.delete(id, req.user.id);
      if (!deleted) {
        return sendError(res, 'Notification not found or unauthorized.', 404);
      }

      const unreadCount = await NotificationModel.countUnread(req.user.id, req.teamId || null);

      return sendSuccess(
        res,
        { notification: deleted, unreadCount },
        'Notification deleted successfully.'
      );
    } catch (error) {
      next(error);
    }
  },
};

module.exports = NotificationController;
