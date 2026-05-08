import axiosInstance from "/src/modules/platform/api/axiosInstance";
import { ENDPOINTS } from "/src/modules/platform/api/endpoints";

export const adminService = {
  getUsers: (params = {}) => axiosInstance.get(ENDPOINTS.admin.users, { params }),
  getStats: () => axiosInstance.get(ENDPOINTS.admin.stats),
  updateRole: (userId, role) => axiosInstance.put(ENDPOINTS.admin.updateRole(userId), { role }),
  deleteUser: (userId) => axiosInstance.delete(ENDPOINTS.admin.deleteUser(userId)),
  getReports: (params = {}) => axiosInstance.get(ENDPOINTS.admin.reports, { params }),
  updateReportStatus: (reportId, status) =>
    axiosInstance.put(ENDPOINTS.admin.reportStatus(reportId), { status })
};
