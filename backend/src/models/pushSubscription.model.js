const { query } = require('../config/db');

/**
 * PushSubscription Model
 * Manages user Web Push subscriptions for background and desktop system notifications.
 */
const PushSubscriptionModel = {
  /**
   * Insert or update a push subscription associated with an authenticated user
   * @param {number} userId
   * @param {{ endpoint: string, keys: { p256dh: string, auth: string } }} subscription
   */
  async upsertSubscription(userId, subscription) {
    const { endpoint, keys } = subscription;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      throw new Error('Invalid push subscription format: endpoint, p256dh, and auth are required.');
    }

    const res = await query(
      `
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (endpoint) DO UPDATE
      SET user_id = EXCLUDED.user_id,
          p256dh = EXCLUDED.p256dh,
          auth = EXCLUDED.auth,
          updated_at = CURRENT_TIMESTAMP
      RETURNING id, user_id, endpoint, created_at, updated_at
      `,
      [userId, endpoint, keys.p256dh, keys.auth]
    );

    return res.rows[0];
  },

  /**
   * Delete a subscription for a specific user
   */
  async deleteSubscription(userId, endpoint) {
    const res = await query(
      `
      DELETE FROM push_subscriptions
      WHERE user_id = $1 AND endpoint = $2
      RETURNING id, endpoint
      `,
      [userId, endpoint]
    );

    return res.rows[0] || null;
  },

  /**
   * Delete dead or expired subscriptions by endpoint (e.g. on HTTP 404 / 410 from push service)
   */
  async deleteByEndpoint(endpoint) {
    const res = await query(
      `
      DELETE FROM push_subscriptions
      WHERE endpoint = $1
      RETURNING id, user_id, endpoint
      `,
      [endpoint]
    );

    return res.rows[0] || null;
  },

  /**
   * Retrieve all active push subscriptions for a user
   */
  async findAllByUserId(userId) {
    const res = await query(
      `
      SELECT id, user_id, endpoint, p256dh, auth, created_at, updated_at
      FROM push_subscriptions
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    return res.rows;
  },

  /**
   * Check if a user currently has any active push subscriptions
   */
  async isSubscribed(userId) {
    const res = await query(
      `
      SELECT id FROM push_subscriptions
      WHERE user_id = $1
      LIMIT 1
      `,
      [userId]
    );

    return res.rows.length > 0;
  },
};

module.exports = PushSubscriptionModel;
