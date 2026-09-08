import api from './api';

export const invitationService = {
  /**
   * Leader creates an invitation for an email address
   * @param {number|string} teamId
   * @param {string} email
   */
  async createInvitation(teamId, email) {
    const response = await api.post(`/api/teams/${teamId}/invitations`, { email });
    return response.data;
  },

  /**
   * Fetch all pending invitations for the authenticated user
   */
  async getUserInvitations() {
    const response = await api.get('/api/invitations');
    return response.data;
  },

  /**
   * Fetch all invitations issued for a workspace (Leader only)
   * @param {number|string} teamId
   */
  async getWorkspaceInvitations(teamId) {
    const response = await api.get(`/api/teams/${teamId}/invitations`);
    return response.data;
  },

  /**
   * Fetch invitation preview metadata by token
   * @param {string} token
   */
  async getInvitationByToken(token) {
    const response = await api.get(`/api/invitations/${token}`);
    return response.data;
  },

  /**
   * Accept an invitation using its secure token
   * @param {string} token
   */
  async acceptInvitation(token) {
    const response = await api.post(`/api/invitations/${token}/accept`);
    return response.data;
  },

  /**
   * Reject an invitation using its secure token
   * @param {string} token
   */
  async rejectInvitation(token) {
    const response = await api.post(`/api/invitations/${token}/reject`);
    return response.data;
  },
};

export default invitationService;
