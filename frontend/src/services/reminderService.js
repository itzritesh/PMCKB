import api from './api';

export const reminderService = {
  /**
   * Get all reminders for current user
   * @param {Object} params - { reference_type, reference_id, status }
   */
  getReminders: async (params = {}) => {
    const res = await api.get('/api/reminders', { params });
    return res.data;
  },

  /**
   * Get single reminder by ID
   */
  getReminder: async (id) => {
    const res = await api.get(`/api/reminders/${id}`);
    return res.data;
  },

  /**
   * Create a new reminder
   * @param {Object} data - { reference_type, reference_id, remind_at }
   */
  createReminder: async (data) => {
    const res = await api.post('/api/reminders', data);
    return res.data;
  },

  /**
   * Update reminder
   */
  updateReminder: async (id, data) => {
    const res = await api.put(`/api/reminders/${id}`, data);
    return res.data;
  },

  /**
   * Dismiss a reminder
   */
  dismissReminder: async (id) => {
    const res = await api.post(`/api/reminders/${id}/dismiss`);
    return res.data;
  },

  /**
   * Cancel a reminder
   */
  cancelReminder: async (id) => {
    const res = await api.post(`/api/reminders/${id}/cancel`);
    return res.data;
  },

  /**
   * Delete a reminder
   */
  deleteReminder: async (id) => {
    const res = await api.delete(`/api/reminders/${id}`);
    return res.data;
  },
};

export default reminderService;
