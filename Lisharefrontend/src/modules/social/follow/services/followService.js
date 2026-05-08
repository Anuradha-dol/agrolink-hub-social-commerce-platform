import axiosInstance from "/src/modules/platform/api/axiosInstance";
import { ENDPOINTS } from "/src/modules/platform/api/endpoints";

export const followService = {
  follow: (userId) => axiosInstance.post(ENDPOINTS.follow.follow(userId)),
  unfollow: (userId) => axiosInstance.delete(ENDPOINTS.follow.unfollow(userId)),
  searchUsers: (query) => axiosInstance.get(ENDPOINTS.follow.search, { params: { query } }),
  followers: () => axiosInstance.get(ENDPOINTS.follow.followers),
  following: () => axiosInstance.get(ENDPOINTS.follow.following),
  followersCount: () => axiosInstance.get(ENDPOINTS.follow.followersCount),
  followingCount: () => axiosInstance.get(ENDPOINTS.follow.followingCount)
};
