import axiosInstance from "/src/modules/platform/api/axiosInstance";
import { ENDPOINTS } from "/src/modules/platform/api/endpoints";

export const userService = {
  getMe: () => axiosInstance.get(ENDPOINTS.user.me),
  updateName: (payload) => axiosInstance.put(ENDPOINTS.user.updateName, payload),
  updateEmail: (payload) => axiosInstance.put(ENDPOINTS.user.updateEmail, payload),
  verifyNewEmail: (otp) => axiosInstance.post(ENDPOINTS.user.verifyNewEmail, null, { params: { otp } }),
  updatePassword: (payload) => axiosInstance.put(ENDPOINTS.user.updatePassword, payload)
};
