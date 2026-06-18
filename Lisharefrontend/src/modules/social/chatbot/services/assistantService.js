import axiosInstance from "/src/modules/platform/api/axiosInstance";
import { ENDPOINTS } from "/src/modules/platform/api/endpoints";

function unwrapReply(response) {
  const payload = response?.data?.data ?? response?.data;
  return payload?.reply || payload?.message || "";
}

export const assistantService = {
  ask: async (message) => {
    const response = await axiosInstance.post(ENDPOINTS.assistant.ask, { message });
    return unwrapReply(response);
  }
};
