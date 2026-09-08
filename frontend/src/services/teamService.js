import api from './api';

export const teamService = {
  /**
   * Fetch all teams/workspaces the authenticated user belongs to
   */
  async getTeams() {
    const response = await api.get('/api/teams');
    return response.data;
  },

  /**
   * Fetch a single team by its ID
   * @param {number|string} id
   */
  async getTeam(id) {
    const response = await api.get(`/api/teams/${id}`);
    return response.data;
  },

  /**
   * Create a new team
   * @param {{ name: string, description?: string }} data
   */
  async createTeam(data) {
    const response = await api.post('/api/teams', data);
    return response.data;
  },

  /**
   * Update an existing team
   * @param {number|string} id
   * @param {{ name: string, description?: string }} data
   */
  async updateTeam(id, data) {
    const response = await api.put(`/api/teams/${id}`, data);
    return response.data;
  },

  /**
   * Delete a team
   * @param {number|string} id
   */
  async deleteTeam(id) {
    const response = await api.delete(`/api/teams/${id}`);
    return response.data;
  },

  /**
   * Fetch members of a team
   * @param {number|string} teamId
   */
  async getTeamMembers(teamId) {
    const response = await api.get(`/api/teams/${teamId}/members`);
    return response.data;
  },

  /**
   * Add a member to a team
   * @param {number|string} teamId
   * @param {{ userId?: number, email?: string, role?: 'leader' | 'member' }} data
   */
  async addTeamMember(teamId, data) {
    const response = await api.post(`/api/teams/${teamId}/members`, data);
    return response.data;
  },

  /**
   * Update a member's role
   * @param {number|string} teamId
   * @param {number|string} userId
   * @param {'leader' | 'member'} role
   */
  async updateMemberRole(teamId, userId, role) {
    const response = await api.put(`/api/teams/${teamId}/members/${userId}`, { role });
    return response.data;
  },

  /**
   * Remove a member from a team
   * @param {number|string} teamId
   * @param {number|string} userId
   */
  async removeTeamMember(teamId, userId) {
    const response = await api.delete(`/api/teams/${teamId}/members/${userId}`);
    return response.data;
  },
};

export default teamService;
