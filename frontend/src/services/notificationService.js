import api from './api';

export const notificationService = {
  /**
   * Get notifications for current user
   * @param {Object} params - { unread, limit }
   */
  getNotifications: async (params = {}) => {
    const res = await api.get('/api/notifications', { params });
    return res.data;
  },

  /**
   * Mark a single notification as read
   */
  markAsRead: async (id) => {
    const res = await api.patch(`/api/notifications/${id}/read`);
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
};

export default notificationService;
