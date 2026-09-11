const { NotificationModel } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

const NotificationController = {
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
