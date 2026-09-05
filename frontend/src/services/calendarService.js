import api from './api';

export const calendarService = {
  getEvents: async (params = {}) => {
    const res = await api.get('/api/calendar/events', { params });
    return res.data;
  },

  getEvent: async (id) => {
    const res = await api.get(`/api/calendar/events/${id}`);
    return res.data;
  },

  createEvent: async (data) => {
    const res = await api.post('/api/calendar/events', data);
    return res.data;
  },

  updateEvent: async (id, data) => {
    const res = await api.put(`/api/calendar/events/${id}`, data);
    return res.data;
  },

  deleteEvent: async (id) => {
    const res = await api.delete(`/api/calendar/events/${id}`);
    return res.data;
  },
};

export default calendarService;
