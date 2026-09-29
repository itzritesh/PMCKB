const { NotificationModel, PushSubscriptionModel } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');
const { emitToUser } = require('../config/socket');
const WebPushService = require('../services/webPushService');
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
        isDismissed: false,
      });

      // Emit real-time notification to user via Socket.IO
      emitToUser(req.user.id, 'notification:new', notif);

      // Dispatch Web Push notification to user's registered devices
      WebPushService.sendPushToUser(req.user.id, notif).catch((pushErr) => {
        console.warn('⚠️ [TestNotification] Push warning:', pushErr.message);
      });

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
   * Return VAPID Public Key for client subscription setup
   * GET /api/notifications/push/vapid-public-key
   */
  async getVapidPublicKey(req, res, next) {
    try {
      const publicKey = WebPushService.getPublicKey();
      return sendSuccess(
        res,
        {
          publicKey,
          isConfigured: WebPushService.isConfigured(),
        },
        'VAPID public key retrieved successfully.'
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Save a Web Push subscription associated strictly with req.user.id
   * POST /api/notifications/push/subscribe
   */
  async subscribePush(req, res, next) {
    try {
      const { subscription } = req.body;
      if (!subscription || !subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
        return sendError(res, 'Valid subscription with endpoint, p256dh, and auth keys is required.', 400);
      }

      const saved = await PushSubscriptionModel.upsertSubscription(req.user.id, subscription);

      return sendSuccess(
        res,
        { subscription: saved },
        'Push notification subscription registered successfully.',
        201
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Remove a Web Push subscription for req.user.id
   * POST /api/notifications/push/unsubscribe
   */
  async unsubscribePush(req, res, next) {
    try {
      const { endpoint } = req.body;
      if (!endpoint) {
        return sendError(res, 'Subscription endpoint is required.', 400);
      }

      const deleted = await PushSubscriptionModel.deleteSubscription(req.user.id, endpoint);

      return sendSuccess(
        res,
        { deleted: !!deleted },
        'Push notification subscription removed successfully.'
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get Web Push subscription status for the current user
   * GET /api/notifications/push/status
   */
  async getPushStatus(req, res, next) {
    try {
      const isSubscribed = await PushSubscriptionModel.isSubscribed(req.user.id);
      return sendSuccess(
        res,
        {
          isSubscribed,
          isVapidConfigured: WebPushService.isConfigured(),
        },
        'Push subscription status retrieved.'
      );
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
      const onlyActiveToasts = req.query.activeToasts === 'true';

      const [notifications, unreadCount] = await Promise.all([
        NotificationModel.findAllForUser(req.user.id, {
          teamId,
          limit,
          onlyUnread,
          onlyActiveToasts,
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
   * Mark a notification as read (optionally also mark dismissed if dismiss=true)
   * PATCH /api/notifications/:id/read
   * Lifecycle: View action sends { dismiss: true } => is_read = true, is_dismissed = true
   *            Mark as read action sends {} => is_read = true, is_dismissed unchanged
   */
  async markRead(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return sendError(res, 'Invalid notification ID.', 400);
      }

      const dismiss = req.body?.dismiss === true;
      const updated = await NotificationModel.markAsRead(id, req.user.id, { dismiss });
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
   * Dismiss a notification (removes active toast, keeps notification in notification center)
   * PATCH /api/notifications/:id/dismiss
   * Lifecycle: Dismiss / X action => is_dismissed = true, is_read unchanged
   */
  async dismiss(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return sendError(res, 'Invalid notification ID.', 400);
      }

      const updated = await NotificationModel.markAsDismissed(id, req.user.id);
      if (!updated) {
        return sendError(res, 'Notification not found or unauthorized.', 404);
      }

      const unreadCount = await NotificationModel.countUnread(req.user.id, req.teamId || null);

      return sendSuccess(
        res,
        { notification: updated, unreadCount },
        'Notification marked as dismissed.'
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
   * Delete a notification for user
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
