import axiosInstance from "/src/modules/platform/api/axiosInstance";
import { ENDPOINTS } from "/src/modules/platform/api/endpoints";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:4041").replace(/\/+$/, "");

export const authService = {
  register: (payload) => axiosInstance.post(ENDPOINTS.auth.register, payload),
  login: (payload) => axiosInstance.post(ENDPOINTS.auth.login, payload),
  googleOAuthUrl: () => `${API_BASE_URL}/oauth2/authorization/google`,
  verifyOtp: (payload) => axiosInstance.post(ENDPOINTS.auth.verifyOtp, payload),
  resendOtp: () => axiosInstance.post(ENDPOINTS.auth.resendOtp),
  logout: () => axiosInstance.post(ENDPOINTS.auth.logout),
  forgotSendOtp: (payload) => axiosInstance.post(ENDPOINTS.forgotPassword.sendOtp, payload),
  forgotVerifyOtp: (payload) => axiosInstance.post(ENDPOINTS.forgotPassword.verifyOtp, payload),
  forgotResendOtp: () => axiosInstance.post(ENDPOINTS.forgotPassword.resendOtp),
  forgotChangePassword: (payload) => axiosInstance.post(ENDPOINTS.forgotPassword.changePassword, payload)
};
