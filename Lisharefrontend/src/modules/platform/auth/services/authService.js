import axiosInstance from "/src/modules/platform/api/axiosInstance";
import { ENDPOINTS } from "/src/modules/platform/api/endpoints";

export const authService = {
  register: (payload) => axiosInstance.post(ENDPOINTS.auth.register, payload),
  login: (payload) => axiosInstance.post(ENDPOINTS.auth.login, payload),
  verifyOtp: (payload) => axiosInstance.post(ENDPOINTS.auth.verifyOtp, payload),
  resendOtp: () => axiosInstance.post(ENDPOINTS.auth.resendOtp),
  logout: () => axiosInstance.post(ENDPOINTS.auth.logout),
  forgotSendOtp: (payload) => axiosInstance.post(ENDPOINTS.forgotPassword.sendOtp, payload),
  forgotVerifyOtp: (payload) => axiosInstance.post(ENDPOINTS.forgotPassword.verifyOtp, payload),
  forgotResendOtp: () => axiosInstance.post(ENDPOINTS.forgotPassword.resendOtp),
  forgotChangePassword: (payload) => axiosInstance.post(ENDPOINTS.forgotPassword.changePassword, payload)
};
