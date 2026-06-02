import axiosInstance from "/src/modules/platform/api/axiosInstance";

const BASE = "/api/calendar";

export const calendarService = {
  listEvents: (params = {}) => axiosInstance.get(`${BASE}/events`, { params }),
  listMyEvents: (params = {}) => axiosInstance.get(`${BASE}/events/mine`, { params }),
  createEvent: (payload) => axiosInstance.post(`${BASE}/events`, payload),
  updateEvent: (eventId, payload) => axiosInstance.put(`${BASE}/events/${eventId}`, payload),
  deleteEvent: (eventId) => axiosInstance.delete(`${BASE}/events/${eventId}`),
  subscribeReminder: (eventId, payload) => axiosInstance.post(`${BASE}/events/${eventId}/remind-me`, payload),
  unsubscribeReminder: (eventId) => axiosInstance.delete(`${BASE}/events/${eventId}/remind-me`),
  listReminders: (params = {}) => axiosInstance.get(`${BASE}/reminders`, { params })
};
