import axiosInstance from "/src/modules/platform/api/axiosInstance";
import { ENDPOINTS } from "/src/modules/platform/api/endpoints";

export const storyService = {
  getFeedStories: () => axiosInstance.get(ENDPOINTS.stories.feed),
  createStory: (formData) =>
    axiosInstance.post(ENDPOINTS.stories.create, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    }),
  reactToStory: (storyId, type) => axiosInstance.post(ENDPOINTS.stories.react(storyId), null, { params: { type } }),
  shareStory: (storyId) => axiosInstance.post(ENDPOINTS.stories.share(storyId)),
  markStoryViewed: (storyId) => axiosInstance.post(ENDPOINTS.stories.view(storyId)),
  replyToStory: (storyId, content) => axiosInstance.post(ENDPOINTS.stories.reply(storyId), { content }),
  deleteStory: (storyId) => axiosInstance.delete(ENDPOINTS.stories.delete(storyId))
};
