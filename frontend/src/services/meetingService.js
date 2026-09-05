import api from './api';

export const meetingService = {
  // Meetings CRUD
  getMeetings: async (params = {}) => {
    const res = await api.get('/api/meetings', { params });
    return res.data;
  },

  getMeeting: async (id) => {
    const res = await api.get(`/api/meetings/${id}`);
    return res.data;
  },

  createMeeting: async (data) => {
    const res = await api.post('/api/meetings', data);
    return res.data;
  },

  updateMeeting: async (id, data) => {
    const res = await api.put(`/api/meetings/${id}`, data);
    return res.data;
  },

  deleteMeeting: async (id) => {
    const res = await api.delete(`/api/meetings/${id}`);
    return res.data;
  },

  // Attendees
  getAttendees: async (meetingId) => {
    const res = await api.get(`/api/meetings/${meetingId}/attendees`);
    return res.data;
  },

  addAttendee: async (meetingId, data) => {
    const res = await api.post(`/api/meetings/${meetingId}/attendees`, data);
    return res.data;
  },

  updateAttendeeResponse: async (meetingId, userId, data) => {
    const res = await api.put(`/api/meetings/${meetingId}/attendees/${userId}`, data);
    return res.data;
  },

  removeAttendee: async (meetingId, userId) => {
    const res = await api.delete(`/api/meetings/${meetingId}/attendees/${userId}`);
    return res.data;
  },

  // Minutes
  getMinutes: async (meetingId) => {
    const res = await api.get(`/api/meetings/${meetingId}/minutes`);
    return res.data;
  },

  createMinutes: async (meetingId, data) => {
    const res = await api.post(`/api/meetings/${meetingId}/minutes`, data);
    return res.data;
  },

  updateMinutes: async (meetingId, data) => {
    const res = await api.put(`/api/meetings/${meetingId}/minutes`, data);
    return res.data;
  },

  deleteMinutes: async (meetingId) => {
    const res = await api.delete(`/api/meetings/${meetingId}/minutes`);
    return res.data;
  },
};

export default meetingService;
