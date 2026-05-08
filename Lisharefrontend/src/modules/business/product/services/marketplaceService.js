import axiosInstance from "/src/modules/platform/api/axiosInstance";
import { ENDPOINTS } from "/src/modules/platform/api/endpoints";

export const marketplaceService = {
  listProducts: (params = {}) => axiosInstance.get(ENDPOINTS.products.list, { params }),
  getProduct: (id) => axiosInstance.get(ENDPOINTS.products.item(id)),
  listProductsByBusiness: (businessPageId, params = {}) =>
    axiosInstance.get(ENDPOINTS.products.byBusiness(businessPageId), { params }),
  createProduct: (payload) => axiosInstance.post(ENDPOINTS.products.list, payload),
  updateProduct: (id, payload) => axiosInstance.put(ENDPOINTS.products.item(id), payload),
  deleteProduct: (id) => axiosInstance.delete(ENDPOINTS.products.item(id))
};
