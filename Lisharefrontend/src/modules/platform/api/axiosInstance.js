import axios from "axios";
import { ENDPOINTS } from "./endpoints";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true
});

let refreshingPromise = null;

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error?.response?.status;

    if (!originalRequest || status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (
      originalRequest.url?.includes(ENDPOINTS.auth.refresh) ||
      originalRequest.url?.includes(ENDPOINTS.auth.login)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!refreshingPromise) {
      refreshingPromise = axiosInstance.post(ENDPOINTS.auth.refresh).finally(() => {
        refreshingPromise = null;
      });
    }

    try {
      await refreshingPromise;
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);

export default axiosInstance;
