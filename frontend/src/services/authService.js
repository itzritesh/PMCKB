import api from './api';

export const authService = {
  /**
   * Register a new user
   * @param {{ name: string, email: string, password: string }} data
   */
  async register(data) {
    const response = await api.post('/api/auth/register', data);
    return response.data;
  },

  /**
   * Login user with credentials
   * @param {{ email: string, password: string }} credentials
   */
  async login(credentials) {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  },

  /**
   * Fetch current authenticated user profile
   */
  async getProfile() {
    const response = await api.get('/api/auth/me');
    return response.data;
  },

  /**
   * Call the test protected endpoint to verify JWT bearer access
   */
  async testProtected() {
    const start = performance.now();
    const response = await api.get('/api/protected/test');
    const latency = Math.round(performance.now() - start);
    return {
      data: response.data,
      latency,
      status: response.status,
    };
  },
};

export default authService;
