import axiosInstance from "/src/modules/platform/api/axiosInstance";
import { ENDPOINTS } from "/src/modules/platform/api/endpoints";

export const cartService = {
  list: () => axiosInstance.get(ENDPOINTS.cart.list),
  add: (payload) => axiosInstance.post(ENDPOINTS.cart.list, payload),
  update: (id, payload) => axiosInstance.put(ENDPOINTS.cart.item(id), payload),
  remove: (id) => axiosInstance.delete(ENDPOINTS.cart.item(id)),
  clear: () => axiosInstance.delete(ENDPOINTS.cart.list),
  checkout: () => axiosInstance.post(ENDPOINTS.cart.checkout)
};
