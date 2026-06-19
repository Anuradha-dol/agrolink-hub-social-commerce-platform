import axiosInstance from "/src/modules/platform/api/axiosInstance";
import { ENDPOINTS } from "/src/modules/platform/api/endpoints";

export const notificationService = {
  getNotifications: (params = {}) => axiosInstance.get(ENDPOINTS.notifications.list, { params }),
  getUnreadCount: () => axiosInstance.get(ENDPOINTS.notifications.unreadCount),
  markRead: (id) => axiosInstance.put(ENDPOINTS.notifications.markRead(id)),
  readAll: () => axiosInstance.put(ENDPOINTS.notifications.readAll),
  remove: (id) => axiosInstance.delete(ENDPOINTS.notifications.item(id)),
  clearAll: () => axiosInstance.delete(ENDPOINTS.notifications.clearAll)
};
