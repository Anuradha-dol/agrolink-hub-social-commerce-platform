import axiosInstance from "/src/modules/platform/api/axiosInstance";
import { ENDPOINTS } from "/src/modules/platform/api/endpoints";

export const reviewService = {
  list: () => axiosInstance.get(ENDPOINTS.reviews.list),
  mine: () => axiosInstance.get(ENDPOINTS.reviews.mine),
  create: (payload) => axiosInstance.post(ENDPOINTS.reviews.create, payload),
  update: (id, payload) => axiosInstance.put(ENDPOINTS.reviews.update(id), payload),
  remove: (id) => axiosInstance.delete(ENDPOINTS.reviews.delete(id))
};
