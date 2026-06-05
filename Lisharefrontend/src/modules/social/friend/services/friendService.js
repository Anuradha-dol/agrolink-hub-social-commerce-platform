import axiosInstance from "/src/modules/platform/api/axiosInstance";
import { ENDPOINTS } from "/src/modules/platform/api/endpoints";

export const friendService = {
  getFriends: () => axiosInstance.get(ENDPOINTS.friend.all),
  getFriendsForUser: (userId) => axiosInstance.get(ENDPOINTS.friend.allForUser(userId)),
  getPending: () => axiosInstance.get(ENDPOINTS.friend.pending),
  getSent: () => axiosInstance.get(ENDPOINTS.friend.sent),
  request: (userId) => axiosInstance.post(ENDPOINTS.friend.request(userId)),
  accept: (userId) => axiosInstance.post(ENDPOINTS.friend.accept(userId)),
  reject: (userId) => axiosInstance.post(ENDPOINTS.friend.reject(userId)),
  cancel: (userId) => axiosInstance.delete(ENDPOINTS.friend.cancel(userId)),
  unfriend: (userId) => axiosInstance.delete(ENDPOINTS.friend.unfriend(userId))
};
