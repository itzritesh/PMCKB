import api from './api';

export const userService = {
  /**
   * Get list of all registered users
   * @returns {Promise<{ status: string, data: { users: Array<{ id: number, name: string, email: string, created_at: string }> } }>}
   */
  async getUsers() {
    const response = await api.get('/api/users');
    return response.data;
  },
};

export default userService;
