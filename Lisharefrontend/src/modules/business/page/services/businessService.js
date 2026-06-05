import axiosInstance from "/src/modules/platform/api/axiosInstance";
import { ENDPOINTS } from "/src/modules/platform/api/endpoints";

export const businessService = {
  listPages: (params = {}) => axiosInstance.get(ENDPOINTS.business.pages, { params }),
  getPage: (id) => axiosInstance.get(ENDPOINTS.business.page(id)),
  listMyPages: (params = {}) => axiosInstance.get(ENDPOINTS.business.myPages, { params }),
  createPage: (payload) => axiosInstance.post(ENDPOINTS.business.pages, payload),
  updatePage: (id, payload) => axiosInstance.put(`${ENDPOINTS.business.pages}/${id}`, payload),
  deactivatePage: (id) => axiosInstance.delete(`${ENDPOINTS.business.pages}/${id}`)
};
