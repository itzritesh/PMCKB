import api from './api';

export const meetingService = {
  // Meetings CRUD
  getMeetings: (params = {}) => {
    return api.get('/api/meetings', { params });
  },

  getMeeting: (id) => {
    return api.get(`/api/meetings/${id}`);
  },

  createMeeting: (data) => {
    return api.post('/api/meetings', data);
  },

  updateMeeting: (id, data) => {
    return api.put(`/api/meetings/${id}`, data);
  },

  deleteMeeting: (id) => {
    return api.delete(`/api/meetings/${id}`);
  },

  // Attendees
  getAttendees: (meetingId) => {
    return api.get(`/api/meetings/${meetingId}/attendees`);
  },

  addAttendee: (meetingId, data) => {
    return api.post(`/api/meetings/${meetingId}/attendees`, data);
  },

  updateAttendeeResponse: (meetingId, userId, data) => {
    return api.put(`/api/meetings/${meetingId}/attendees/${userId}`, data);
  },

  removeAttendee: (meetingId, userId) => {
    return api.delete(`/api/meetings/${meetingId}/attendees/${userId}`);
  },

  // Minutes
  getMinutes: (meetingId) => {
    return api.get(`/api/meetings/${meetingId}/minutes`);
  },

  createMinutes: (meetingId, data) => {
    return api.post(`/api/meetings/${meetingId}/minutes`, data);
  },

  updateMinutes: (meetingId, data) => {
    return api.put(`/api/meetings/${meetingId}/minutes`, data);
  },

  deleteMinutes: (meetingId) => {
    return api.delete(`/api/meetings/${meetingId}/minutes`);
  },
};
