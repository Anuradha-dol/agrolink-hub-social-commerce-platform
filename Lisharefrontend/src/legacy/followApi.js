// src/followApi.js
import api from "./api";

export const getFollowers = async () => {
  const res = await api.get("/follow/followers", { withCredentials: true });
  return res.data;
};

export const getFollowing = async () => {
  const res = await api.get("/follow/following", { withCredentials: true });
  return res.data;
};

export const followUser = async (userId) => {
  const res = await api.post(`/follow/${userId}/follow`, {}, { withCredentials: true });
  return res.data;
};

export const unfollowUser = async (userId) => {
  const res = await api.delete(`/follow/${userId}/unfollow`, { withCredentials: true });
  return res.data;
};

export const searchUsers = async (query) => {
  const res = await api.get("/follow/search", {
    params: { query },
    withCredentials: true,
  });
  return res.data;
};
