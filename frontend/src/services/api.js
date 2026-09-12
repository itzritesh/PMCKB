import axios from 'axios';

// Support VITE_API_URL, VITE_API_BASE_URL, or fallback to current host or localhost:5000
const API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5000';

if (import.meta.env.DEV) {
  console.log(`📡 [PMCKB API Configuration] Base URL: ${API_URL}/api`);
}

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Normalize paths, attach JWT token and active team ID
api.interceptors.request.use(
  (config) => {
    // Normalize path: allow both /auth/login and /api/auth/login seamlessly
    if (config.url) {
      if (config.url.startsWith('/api/')) {
        config.url = config.url.replace(/^\/api/, '');
      } else if (config.url === '/api') {
        config.url = '';
      }
    }

    // Attach JWT token (check both auth_token and token keys for maximum compatibility)
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const currentTeamId = localStorage.getItem('current_team_id');
    if (currentTeamId) {
      config.headers['x-team-id'] = currentTeamId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Actionable network error messages and dev logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isNetworkError =
      !error.response ||
      error.code === 'ERR_NETWORK' ||
      error.message === 'Network Error';

    const message = isNetworkError
      ? 'Unable to connect to the server. Please make sure the backend is running and your device is connected to the same network.'
      : error.response?.data?.message || error.message || 'An unexpected error occurred';

    if (import.meta.env.DEV) {
      console.error(
        `❌ [API Failure] ${error.config?.method?.toUpperCase()} ${error.config?.baseURL || ''}${error.config?.url || ''} | Status: ${error.response?.status || 'Network Error'} | Reason: ${error.message}`
      );
    }

    const customError = {
      status: error.response?.status || 0,
      message,
      data: error.response?.data || null,
      isNetworkError,
      originalError: error,
    };

    return Promise.reject(customError);
  }
);

export { API_URL };
export default api;
