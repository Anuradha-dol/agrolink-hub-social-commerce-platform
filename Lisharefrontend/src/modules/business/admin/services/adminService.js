import axiosInstance from "/src/modules/platform/api/axiosInstance";
import { ENDPOINTS } from "/src/modules/platform/api/endpoints";

export const adminService = {
  getUsers: (params = {}) => axiosInstance.get(ENDPOINTS.admin.users, { params }),
  getStats: () => axiosInstance.get(ENDPOINTS.admin.stats),
  updateRole: (userId, role) => axiosInstance.put(ENDPOINTS.admin.updateRole(userId), { role }),
  updateModeration: (userId, status, message) =>
    axiosInstance.put(ENDPOINTS.admin.updateModeration(userId), { status, message }),
  deleteUser: (userId, reason) => axiosInstance.delete(ENDPOINTS.admin.deleteUser(userId), { data: { reason } }),
  getReports: (params = {}) => axiosInstance.get(ENDPOINTS.admin.reports, { params }),
  updateReportStatus: (reportId, status) =>
    axiosInstance.put(ENDPOINTS.admin.reportStatus(reportId), { status }),
  getSupportQuestions: () => axiosInstance.get(ENDPOINTS.support.list),
  respondSupportQuestion: (id, response) => axiosInstance.put(ENDPOINTS.support.respond(id), { response })
};
