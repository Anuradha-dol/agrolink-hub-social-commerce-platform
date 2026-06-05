import axiosInstance from "/src/modules/platform/api/axiosInstance";
import { ENDPOINTS } from "/src/modules/platform/api/endpoints";

export const userService = {
  getMe: () => axiosInstance.get(ENDPOINTS.user.me),
  getPublicProfile: (userId) => axiosInstance.get(ENDPOINTS.user.publicProfile(userId)),
  updateName: (payload) => axiosInstance.put(ENDPOINTS.user.updateName, payload),
  updateProfileDetails: (payload) => axiosInstance.put(ENDPOINTS.user.updateProfileDetails, payload),
  updateEmail: (payload) => axiosInstance.put(ENDPOINTS.user.updateEmail, payload),
  verifyNewEmail: (otp) => axiosInstance.post(ENDPOINTS.user.verifyNewEmail, null, { params: { otp } }),
  updatePassword: (payload) => axiosInstance.put(ENDPOINTS.user.updatePassword, payload),
  deleteAccount: (payload) => axiosInstance.delete(ENDPOINTS.user.deleteAccount, { data: payload }),
  requestDeleteOtp: () => axiosInstance.post(ENDPOINTS.user.requestDeleteOtp),
  verifyDeleteOtp: (payload) => axiosInstance.post(ENDPOINTS.user.verifyDeleteOtp, payload),
  uploadProfileImage: (formData) =>
    axiosInstance.post(ENDPOINTS.user.uploadProfileImage, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    }),
  uploadCoverImage: (formData) =>
    axiosInstance.post(ENDPOINTS.user.uploadCoverImage, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    }),
  removeProfileImage: () => axiosInstance.delete(ENDPOINTS.user.removeProfileImage),
  removeCoverImage: () => axiosInstance.delete(ENDPOINTS.user.removeCoverImage)
};
