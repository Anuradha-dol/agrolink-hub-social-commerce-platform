import axiosInstance from "/src/modules/platform/api/axiosInstance";
import { ENDPOINTS } from "/src/modules/platform/api/endpoints";

export const friendService = {
  getFriends: () => axiosInstance.get(ENDPOINTS.friend.all),
  getPending: () => axiosInstance.get(ENDPOINTS.friend.pending),
  request: (userId) => axiosInstance.post(ENDPOINTS.friend.request(userId)),
  accept: (userId) => axiosInstance.post(ENDPOINTS.friend.accept(userId)),
  reject: (userId) => axiosInstance.post(ENDPOINTS.friend.reject(userId)),
  unfriend: (userId) => axiosInstance.delete(ENDPOINTS.friend.unfriend(userId))
};
