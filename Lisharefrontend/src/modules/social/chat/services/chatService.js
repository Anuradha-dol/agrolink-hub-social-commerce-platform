import axiosInstance from "/src/modules/platform/api/axiosInstance";
import { ENDPOINTS } from "/src/modules/platform/api/endpoints";

export const chatService = {
  getConversations: () => axiosInstance.get(ENDPOINTS.chat.conversations),
  openDirectConversation: (otherUserId) => axiosInstance.post(ENDPOINTS.chat.directConversation(otherUserId)),
  createGroupConversation: (payload) => axiosInstance.post(ENDPOINTS.chat.groupConversation, payload),
  getMessages: (conversationId, params = {}) =>
    axiosInstance.get(ENDPOINTS.chat.messages(conversationId), { params }),
  sendMessage: (conversationId, payload) =>
    axiosInstance.post(ENDPOINTS.chat.messages(conversationId), payload),
  markSeen: (conversationId) => axiosInstance.put(ENDPOINTS.chat.seen(conversationId)),
  addMember: (conversationId, userId) => axiosInstance.post(ENDPOINTS.chat.addMember(conversationId), { userId }),
  removeMember: (conversationId, userId) =>
    axiosInstance.delete(ENDPOINTS.chat.removeMember(conversationId, userId)),
  uploadAttachment: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return axiosInstance.post(ENDPOINTS.chat.attachments, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
  },
  getMessageReactions: (messageId) => axiosInstance.get(ENDPOINTS.chat.reactions(messageId)),
  reactToMessage: (messageId, emoji) => axiosInstance.put(ENDPOINTS.chat.reaction(messageId), { emoji }),
  removeMessageReaction: (messageId) => axiosInstance.delete(ENDPOINTS.chat.reaction(messageId))
};
