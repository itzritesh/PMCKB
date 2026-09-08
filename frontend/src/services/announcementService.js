import api from './api';

export const announcementService = {
  /**
   * Fetch all announcements for the active workspace
   */
  async getAnnouncements() {
    const response = await api.get('/api/announcements');
    return response.data;
  },

  /**
   * Fetch a single announcement by ID
   * @param {number|string} id
   */
  async getAnnouncement(id) {
    const response = await api.get(`/api/announcements/${id}`);
    return response.data;
  },

  /**
   * Create an announcement (Leader only)
   * @param {{ title: string, content: string, priority?: string }} data
   */
  async createAnnouncement(data) {
    const response = await api.post('/api/announcements', data);
    return response.data;
  },

  /**
   * Update an announcement (Leader only)
   * @param {number|string} id
   * @param {{ title?: string, content?: string, priority?: string }} data
   */
  async updateAnnouncement(id, data) {
    const response = await api.put(`/api/announcements/${id}`, data);
    return response.data;
  },

  /**
   * Delete an announcement (Leader only)
   * @param {number|string} id
   */
  async deleteAnnouncement(id) {
    const response = await api.delete(`/api/announcements/${id}`);
    return response.data;
  },
};
