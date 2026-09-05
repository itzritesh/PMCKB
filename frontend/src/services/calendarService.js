import api from './api';

export const calendarService = {
  getEvents: (params = {}) => {
    return api.get('/api/calendar/events', { params });
  },

  getEvent: (id) => {
    return api.get(`/api/calendar/events/${id}`);
  },

  createEvent: (data) => {
    return api.post('/api/calendar/events', data);
  },

  updateEvent: (id, data) => {
    return api.put(`/api/calendar/events/${id}`, data);
  },

  deleteEvent: (id) => {
    return api.delete(`/api/calendar/events/${id}`);
  },
};
