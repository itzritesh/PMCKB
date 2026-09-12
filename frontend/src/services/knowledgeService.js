import api from './api';

export const knowledgeService = {
  // Categories
  getCategories: async () => {
    const res = await api.get('/api/kb/categories');
    return res.data;
  },

  getCategory: async (id) => {
    const res = await api.get(`/api/kb/categories/${id}`);
    return res.data;
  },

  createCategory: async (data) => {
    const res = await api.post('/api/kb/categories', data);
    return res.data;
  },

  updateCategory: async (id, data) => {
    const res = await api.put(`/api/kb/categories/${id}`, data);
    return res.data;
  },

  deleteCategory: async (id) => {
    const res = await api.delete(`/api/kb/categories/${id}`);
    return res.data;
  },

  // Articles
  getArticles: async (params = {}) => {
    const res = await api.get('/api/kb/articles', { params });
    return res.data;
  },

  getArticle: async (id) => {
    const res = await api.get(`/api/kb/articles/${id}`);
    return res.data;
  },

  createArticle: async (data) => {
    const res = await api.post('/api/kb/articles', data);
    return res.data;
  },

  updateArticle: async (id, data) => {
    const res = await api.put(`/api/kb/articles/${id}`, data);
    return res.data;
  },

  deleteArticle: async (id) => {
    const res = await api.delete(`/api/kb/articles/${id}`);
    return res.data;
  },

  // Version History
  getArticleVersions: async (articleId) => {
    const res = await api.get(`/api/kb/articles/${articleId}/versions`);
    return res.data;
  },

  getArticleVersion: async (articleId, versionNumber) => {
    const res = await api.get(`/api/kb/articles/${articleId}/versions/${versionNumber}`);
    return res.data;
  },

  restoreArticleVersion: async (articleId, versionNumber, data = {}) => {
    const res = await api.post(`/api/kb/articles/${articleId}/versions/${versionNumber}/restore`, data);
    return res.data;
  },
};

export default knowledgeService;
