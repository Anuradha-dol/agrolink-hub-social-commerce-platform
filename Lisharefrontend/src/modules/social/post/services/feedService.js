import axiosInstance from "/src/modules/platform/api/axiosInstance";
import { ENDPOINTS } from "/src/modules/platform/api/endpoints";

function buildCommentPayload(content, mediaFile) {
  if (!mediaFile) {
    return {
      body: { content },
      config: undefined
    };
  }

  const formData = new FormData();
  formData.append("content", content || "");
  formData.append("media", mediaFile);
  return {
    body: formData,
    config: { headers: { "Content-Type": "multipart/form-data" } }
  };
}

export const feedService = {
  getFeed: () => axiosInstance.get(ENDPOINTS.feed.sharedFeed),
  getMyPosts: () => axiosInstance.get(ENDPOINTS.feed.myPosts),
  createPost: (formData) =>
    axiosInstance.post(ENDPOINTS.feed.createPost, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    }),
  updatePost: (postId, formData) =>
    axiosInstance.put(`/posts/update/${postId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    }),
  deletePost: async (postId) => {
    try {
      return await axiosInstance.delete(ENDPOINTS.feed.deletePost(postId));
    } catch (error) {
      if ([404, 405].includes(Number(error?.response?.status))) {
        return axiosInstance.delete(`/api/posts/${postId}`);
      }
      throw error;
    }
  },
  markReelView: (postId) => axiosInstance.post(`/posts/${postId}/reel-view`),
  votePoll: (postId, optionIndex) => axiosInstance.post(ENDPOINTS.feed.pollVote(postId), null, { params: { optionIndex } }),
  addComment: (postId, content, mediaFile = null) => {
    const payload = buildCommentPayload(content, mediaFile);
    return axiosInstance.post(ENDPOINTS.feed.commentAdd(postId), payload.body, payload.config);
  },
  addReply: (postId, parentCommentId, content, mediaFile = null) => {
    const payload = buildCommentPayload(content, mediaFile);
    return axiosInstance.post(ENDPOINTS.feed.commentReply(postId, parentCommentId), payload.body, payload.config);
  },
  updateComment: (commentId, content) => axiosInstance.put(ENDPOINTS.feed.commentUpdate(commentId), { content }),
  deleteComment: (commentId) => axiosInstance.delete(ENDPOINTS.feed.commentDelete(commentId)),
  getComments: (postId) => axiosInstance.get(ENDPOINTS.feed.comments(postId)),
  reactComment: (commentId, type) => axiosInstance.post(ENDPOINTS.feed.commentReaction(commentId), null, { params: { type } }),
  getCommentReactions: (commentId) => axiosInstance.get(ENDPOINTS.feed.commentReactionCounts(commentId)),
  react: (postId, type) => axiosInstance.post(ENDPOINTS.feed.reaction(postId), null, { params: { type } }),
  getReactions: (postId) => axiosInstance.get(ENDPOINTS.feed.reactionCounts(postId)),
  getReactionUsers: (postId) => axiosInstance.get(ENDPOINTS.feed.reactionUsers(postId)),
  share: (postId, caption, options = {}) =>
    axiosInstance.post(ENDPOINTS.feed.share(postId), {
      caption,
      notifyFollowers: options.notifyFollowers ?? true,
      mentionedUserIds: options.mentionedUserIds || [],
      postValue: options.postValue || "medium"
    }),
  deleteShare: (shareId) => axiosInstance.delete(ENDPOINTS.feed.shareDelete(shareId)),
  savePost: (postId) => axiosInstance.post(ENDPOINTS.feed.savePost(postId)),
  unsavePost: (postId) => axiosInstance.delete(ENDPOINTS.feed.savePost(postId)),
  getSavedPosts: (params = {}) => axiosInstance.get(ENDPOINTS.feed.savedPosts, { params }),
  reportPost: (postId, reason) => axiosInstance.post(ENDPOINTS.feed.reportPost(postId), { reason })
};
