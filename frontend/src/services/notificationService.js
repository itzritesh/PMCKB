import api from './api';

export const notificationService = {
  /**
   * Get notifications for current user
   * @param {Object} params - { unread, limit, activeToasts }
   */
  getNotifications: async (params = {}) => {
    const res = await api.get('/api/notifications', { params });
    return res.data;
  },

  /**
   * Mark a single notification as read (optionally also dismissed)
   * View action sends: { dismiss: true } => is_read = true, is_dismissed = true
   */
  markAsRead: async (id, { dismiss = false } = {}) => {
    const res = await api.patch(`/api/notifications/${id}/read`, { dismiss });
    return res.data;
  },

  /**
   * Dismiss a single notification (Dismiss / X action: is_dismissed = true, is_read unchanged)
   */
  dismissNotification: async (id) => {
    const res = await api.patch(`/api/notifications/${id}/dismiss`);
    return res.data;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    const res = await api.patch('/api/notifications/read-all');
    return res.data;
  },

  /**
   * Delete a notification
   */
  deleteNotification: async (id) => {
    const res = await api.delete(`/api/notifications/${id}`);
    return res.data;
  },

  /**
   * Get Web Push subscription status from backend
   */
  getPushStatus: async () => {
    const res = await api.get('/api/notifications/push/status');
    return res.data;
  },

  /**
   * Safe test endpoint to trigger a real-time reminder notification
   */
  sendTestNotification: async (data = {}) => {
    const res = await api.post('/api/notifications/test', data);
    return res.data;
  },
};

export default notificationService;
