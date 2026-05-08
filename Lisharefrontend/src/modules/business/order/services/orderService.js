import axiosInstance from "/src/modules/platform/api/axiosInstance";
import { ENDPOINTS } from "/src/modules/platform/api/endpoints";

export const orderService = {
  createOrder: (payload) => axiosInstance.post(ENDPOINTS.orders.create, payload),
  myOrders: (params = {}) => axiosInstance.get(ENDPOINTS.orders.mine, { params }),
  businessOrders: (params = {}) => axiosInstance.get(ENDPOINTS.orders.business, { params }),
  getOrder: (id) => axiosInstance.get(ENDPOINTS.orders.get(id)),
  cancelOrder: (id) => axiosInstance.delete(ENDPOINTS.orders.cancel(id)),
  updateOrderStatus: (id, payload) => axiosInstance.put(ENDPOINTS.orders.updateStatus(id), payload)
};
