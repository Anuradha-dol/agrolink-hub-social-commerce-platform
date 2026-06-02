import axiosInstance from "/src/modules/platform/api/axiosInstance";
import { ENDPOINTS } from "/src/modules/platform/api/endpoints";

export const supportService = {
  create: (payload) => axiosInstance.post(ENDPOINTS.support.create, payload),
  mine: () => axiosInstance.get(ENDPOINTS.support.mine),
  remove: (id) => axiosInstance.delete(ENDPOINTS.support.delete(id))
};
