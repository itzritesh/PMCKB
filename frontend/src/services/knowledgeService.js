import api from './api';

export const knowledgeService = {
  // Categories
  getCategories: () => {
    return api.get('/api/kb/categories');
  },

  getCategory: (id) => {
    return api.get(`/api/kb/categories/${id}`);
  },

  createCategory: (data) => {
    return api.post('/api/kb/categories', data);
  },

  updateCategory: (id, data) => {
    return api.put(`/api/kb/categories/${id}`, data);
  },

  deleteCategory: (id) => {
    return api.delete(`/api/kb/categories/${id}`);
  },

  // Articles
  getArticles: (params = {}) => {
    return api.get('/api/kb/articles', { params });
  },

  getArticle: (id) => {
    return api.get(`/api/kb/articles/${id}`);
  },

  createArticle: (data) => {
    return api.post('/api/kb/articles', data);
  },

  updateArticle: (id, data) => {
    return api.put(`/api/kb/articles/${id}`, data);
  },

  deleteArticle: (id) => {
    return api.delete(`/api/kb/articles/${id}`);
  },
};
