import axiosInstance from "/src/modules/platform/api/axiosInstance";
import { ENDPOINTS } from "/src/modules/platform/api/endpoints";

function cleanProductPayload(payload = {}) {
  const { imageFile, imagePreview, rawImageUrl, ...rest } = payload;
  return rest;
}

function toProductFormData(payload = {}) {
  const formData = new FormData();
  const cleaned = cleanProductPayload(payload);

  Object.entries(cleaned).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });

  if (payload.imageFile) {
    formData.append("image", payload.imageFile);
  }

  return formData;
}

function hasImageFile(payload = {}) {
  return typeof File !== "undefined" && payload.imageFile instanceof File;
}

export const marketplaceService = {
  listProducts: (params = {}) => axiosInstance.get(ENDPOINTS.products.list, { params }),
  getProduct: (id) => axiosInstance.get(ENDPOINTS.products.item(id)),
  listProductsByBusiness: (businessPageId, params = {}) =>
    axiosInstance.get(ENDPOINTS.products.byBusiness(businessPageId), { params }),
  createProduct: (payload) => hasImageFile(payload)
    ? axiosInstance.post(ENDPOINTS.products.list, toProductFormData(payload))
    : axiosInstance.post(ENDPOINTS.products.list, cleanProductPayload(payload)),
  updateProduct: (id, payload) => hasImageFile(payload)
    ? axiosInstance.put(ENDPOINTS.products.item(id), toProductFormData(payload))
    : axiosInstance.put(ENDPOINTS.products.item(id), cleanProductPayload(payload)),
  deleteProduct: (id) => axiosInstance.delete(ENDPOINTS.products.item(id))
};
