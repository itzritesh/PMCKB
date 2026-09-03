import api from './api';

export const commentService = {
  /**
   * Get all comments for a specific task
   * @param {number|string} taskId
   */
  async getComments(taskId) {
    const response = await api.get(`/api/tasks/${taskId}/comments`);
    return response.data;
  },

  /**
   * Create a new comment on a task
   * @param {number|string} taskId
   * @param {string} comment
   */
  async createComment(taskId, comment) {
    const response = await api.post(`/api/tasks/${taskId}/comments`, { comment });
    return response.data;
  },

  /**
   * Update an existing comment (author only)
   * @param {number|string} id
   * @param {string} comment
   */
  async updateComment(id, comment) {
    const response = await api.put(`/api/comments/${id}`, { comment });
    return response.data;
  },

  /**
   * Delete an existing comment (author only)
   * @param {number|string} id
   */
  async deleteComment(id) {
    const response = await api.delete(`/api/comments/${id}`);
    return response.data;
  },
};

export default commentService;
