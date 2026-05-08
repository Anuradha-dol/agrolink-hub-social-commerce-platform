import axiosInstance from "/src/modules/platform/api/axiosInstance";
import { ENDPOINTS } from "/src/modules/platform/api/endpoints";

export const feedService = {
  getFeed: () => axiosInstance.get(ENDPOINTS.feed.sharedFeed),
  createPost: (formData) =>
    axiosInstance.post(ENDPOINTS.feed.createPost, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    }),
  deletePost: (postId) => axiosInstance.delete(ENDPOINTS.feed.deletePost(postId)),
  addComment: (postId, content) => axiosInstance.post(ENDPOINTS.feed.commentAdd(postId), { content }),
  getComments: (postId) => axiosInstance.get(ENDPOINTS.feed.comments(postId)),
  react: (postId, type) => axiosInstance.post(ENDPOINTS.feed.reaction(postId), null, { params: { type } }),
  getReactions: (postId) => axiosInstance.get(ENDPOINTS.feed.reactionCounts(postId)),
  share: (postId, caption) => axiosInstance.post(ENDPOINTS.feed.share(postId), { caption }),
  savePost: (postId) => axiosInstance.post(ENDPOINTS.feed.savePost(postId)),
  unsavePost: (postId) => axiosInstance.delete(ENDPOINTS.feed.savePost(postId)),
  getSavedPosts: (params = {}) => axiosInstance.get(ENDPOINTS.feed.savedPosts, { params }),
  reportPost: (postId, reason) => axiosInstance.post(ENDPOINTS.feed.reportPost(postId), { reason })
};
