import axiosInstance from "/src/modules/platform/api/axiosInstance";
import { ENDPOINTS } from "/src/modules/platform/api/endpoints";

export const followService = {
  follow: (userId) => axiosInstance.post(ENDPOINTS.follow.follow(userId)),
  unfollow: (userId) => axiosInstance.delete(ENDPOINTS.follow.unfollow(userId)),
  searchUsers: (query) => axiosInstance.get(ENDPOINTS.follow.search, { params: { query } }),
  followers: () => axiosInstance.get(ENDPOINTS.follow.followers),
  following: () => axiosInstance.get(ENDPOINTS.follow.following),
  followersForUser: (userId) => axiosInstance.get(ENDPOINTS.follow.followersForUser(userId)),
  followingForUser: (userId) => axiosInstance.get(ENDPOINTS.follow.followingForUser(userId)),
  followersCount: () => axiosInstance.get(ENDPOINTS.follow.followersCount),
  followingCount: () => axiosInstance.get(ENDPOINTS.follow.followingCount),
  followersCountForUser: (userId) => axiosInstance.get(ENDPOINTS.follow.followersCountForUser(userId)),
  followingCountForUser: (userId) => axiosInstance.get(ENDPOINTS.follow.followingCountForUser(userId))
};
