import axiosInstance from "/src/modules/platform/api/axiosInstance";
import { ENDPOINTS } from "/src/modules/platform/api/endpoints";

export const userBlockService = {
  listBlocked: () => axiosInstance.get(ENDPOINTS.userBlocks.list),
  blockUser: (userId) => axiosInstance.post(ENDPOINTS.userBlocks.block(userId)),
  unblockUser: (userId) => axiosInstance.delete(ENDPOINTS.userBlocks.unblock(userId))
};
