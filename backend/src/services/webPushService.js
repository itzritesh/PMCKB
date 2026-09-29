const webpush = require('web-push');
const env = require('../config/env');
const { PushSubscriptionModel } = require('../models');

let isVapidConfigured = false;

// Configure VAPID credentials if available
if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(
      env.VAPID_SUBJECT || 'mailto:support@pmckb.com',
      env.VAPID_PUBLIC_KEY,
      env.VAPID_PRIVATE_KEY
    );
    isVapidConfigured = true;
    console.log('✅ [WebPushService] Web Push VAPID configuration initialized successfully.');
  } catch (err) {
    console.warn('⚠️ [WebPushService] VAPID configuration failed:', err.message);
  }
} else {
  console.warn('⚠️ [WebPushService] VAPID keys not configured. Web Push will run in dummy mode.');
}

const WebPushService = {
  /**
   * Check if VAPID is configured and ready
   */
  isConfigured() {
    return isVapidConfigured;
  },

  /**
   * Get public VAPID key
   */
  getPublicKey() {
    return env.VAPID_PUBLIC_KEY || '';
  },

  /**
   * Send Web Push notification to all active endpoints registered to a user
   *
   * @param {number} userId - The target recipient user ID
   * @param {{
   *   id: number,
   *   title: string,
   *   message: string,
   *   reference_type: string,
   *   reference_id: number,
   *   url?: string
   * }} payload
   * @returns {Promise<{ sent: number, failed: number, pruned: number }>}
   */
  async sendPushToUser(userId, payload) {
    if (!isVapidConfigured) {
      return { sent: 0, failed: 0, pruned: 0, reason: 'VAPID not configured' };
    }

    try {
      const subscriptions = await PushSubscriptionModel.findAllByUserId(userId);
      if (!subscriptions || subscriptions.length === 0) {
        return { sent: 0, failed: 0, pruned: 0, reason: 'No active push subscriptions' };
      }

      console.log(`📡 [WebPushService] Sending push notification to user ${userId} across ${subscriptions.length} endpoint(s)...`);

      // Determine target deep-link URL based on reference
      let targetUrl = '/dashboard';
      if (payload.url) {
        targetUrl = payload.url;
      } else if (payload.reference_type === 'announcement' || payload.type === 'team_announcement') {
        targetUrl = payload.reference_id
          ? `/announcements?id=${payload.reference_id}&notifId=${payload.id}`
          : `/announcements?notifId=${payload.id}`;
      } else if (payload.reference_type === 'meeting' && payload.reference_id) {
        targetUrl = `/meetings/${payload.reference_id}?notifId=${payload.id}`;
      } else if (payload.reference_type === 'calendar_event' && payload.reference_id) {
        targetUrl = `/calendar?event=${payload.reference_id}&notifId=${payload.id}`;
      } else if (payload.id) {
        targetUrl = `/dashboard?notifId=${payload.id}`;
      }

      const isAnnouncement = payload.type === 'team_announcement' || payload.reference_type === 'announcement';

      const pushPayload = JSON.stringify({
        id: payload.id,
        type: payload.type || (isAnnouncement ? 'team_announcement' : 'reminder'),
        title: payload.title || (isAnnouncement ? 'New Team Announcement' : 'PMCKB Reminder'),
        message: payload.message || (isAnnouncement ? 'A new announcement has been posted.' : 'You have an upcoming scheduled item.'),
        reference_type: payload.reference_type || null,
        reference_id: payload.reference_id || null,
        url: targetUrl,
        timestamp: Date.now(),
      });

      let sent = 0;
      let failed = 0;
      let pruned = 0;

      for (const sub of subscriptions) {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await webpush.sendNotification(pushSubscription, pushPayload, {
            TTL: 3600,
            urgency: 'high',
          });
          sent++;
        } catch (pushErr) {
          failed++;
          console.warn(`⚠️ [WebPushService] Push delivery failed for endpoint (${pushErr.statusCode || pushErr.code}):`, pushErr.message);

          // If the push service returns 404 (Not Found) or 410 (Gone), the subscription has expired or was revoked
          if (pushErr.statusCode === 404 || pushErr.statusCode === 410) {
            console.log(`🧹 [WebPushService] Pruning expired subscription endpoint: ${sub.endpoint.slice(0, 45)}...`);
            await PushSubscriptionModel.deleteByEndpoint(sub.endpoint);
            pruned++;
          }
        }
      }

      console.log(`🔔 [WebPushService] User ${userId} push results: ${sent} sent, ${failed} failed, ${pruned} pruned.`);
      return { sent, failed, pruned };
    } catch (err) {
      console.error(`❌ [WebPushService] Unexpected error sending push to user ${userId}:`, err.message);
      return { sent: 0, failed: 1, pruned: 0, error: err.message };
    }
  },
};

module.exports = WebPushService;
