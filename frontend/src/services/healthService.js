import api from './api';

export const healthService = {
  /**
   * Ping root API endpoint
   */
  async getRoot() {
    const start = performance.now();
    const response = await api.get('/');
    const latency = Math.round(performance.now() - start);
    return {
      data: response.data,
      latency,
      status: response.status,
    };
  },

  /**
   * Ping detailed health-check endpoint
   */
  async getHealth() {
    const start = performance.now();
    const response = await api.get('/api/health');
    const latency = Math.round(performance.now() - start);
    return {
      data: response.data,
      latency,
      status: response.status,
    };
  },
};

export default healthService;
