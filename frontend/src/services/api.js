import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT token if stored
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Standardize error formatting
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const customError = {
      status: error.response?.status || 0,
      message: error.response?.data?.message || error.message || 'Network connection failed',
      data: error.response?.data || null,
      isNetworkError: !error.response,
    };
    return Promise.reject(customError);
  }
);

export default api;
