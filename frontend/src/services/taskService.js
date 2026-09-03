import api from './api';

export const taskService = {
  /**
   * Get all tasks across all projects for the authenticated user
   * @param {{ status?: string, priority?: string }} [params]
   */
  async getAllTasks(params = {}) {
    const response = await api.get('/api/tasks', { params });
    return response.data;
  },

  /**
   * Get all tasks for a specific project
   * @param {number|string} projectId
   */
  async getTasksByProject(projectId) {
    const response = await api.get(`/api/tasks/project/${projectId}`);
    return response.data;
  },

  /**
   * Get a single task by ID
   * @param {number|string} id
   */
  async getTask(id) {
    const response = await api.get(`/api/tasks/${id}`);
    return response.data;
  },

  /**
   * Create a new task
   * @param {{
   *   project_id: number|string,
   *   title: string,
   *   description?: string,
   *   status?: string,
   *   priority?: string,
   *   due_date?: string|null,
   *   assigned_to?: number|string|null
   * }} data
   */
  async createTask(data) {
    const response = await api.post('/api/tasks', data);
    return response.data;
  },

  /**
   * Update an existing task
   * @param {number|string} id
   * @param {{
   *   title: string,
   *   description?: string,
   *   status?: string,
   *   priority?: string,
   *   due_date?: string|null,
   *   assigned_to?: number|string|null
   * }} data
   */
  async updateTask(id, data) {
    const response = await api.put(`/api/tasks/${id}`, data);
    return response.data;
  },

  /**
   * Delete a task
   * @param {number|string} id
   */
  async deleteTask(id) {
    const response = await api.delete(`/api/tasks/${id}`);
    return response.data;
  },

  /**
   * Assign or unassign a task
   * @param {number|string} id
   * @param {number|string|null} assignedTo
   */
  async assignTask(id, assignedTo) {
    const response = await api.patch(`/api/tasks/${id}/assign`, {
      assigned_to: assignedTo,
    });
    return response.data;
  },
};

export default taskService;
