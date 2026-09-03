import api from './api';

export const projectService = {
  /**
   * Fetch all projects owned by the authenticated user
   */
  async getProjects() {
    const response = await api.get('/api/projects');
    return response.data;
  },

  /**
   * Fetch a single project by its ID
   * @param {number|string} id
   */
  async getProject(id) {
    const response = await api.get(`/api/projects/${id}`);
    return response.data;
  },

  /**
   * Create a new project
   * @param {{ name: string, description?: string, status?: string }} data
   */
  async createProject(data) {
    const response = await api.post('/api/projects', data);
    return response.data;
  },

  /**
   * Update an existing project
   * @param {number|string} id
   * @param {{ name: string, description?: string, status?: string }} data
   */
  async updateProject(id, data) {
    const response = await api.put(`/api/projects/${id}`, data);
    return response.data;
  },

  /**
   * Delete a project
   * @param {number|string} id
   */
  async deleteProject(id) {
    const response = await api.delete(`/api/projects/${id}`);
    return response.data;
  },
};

export default projectService;
