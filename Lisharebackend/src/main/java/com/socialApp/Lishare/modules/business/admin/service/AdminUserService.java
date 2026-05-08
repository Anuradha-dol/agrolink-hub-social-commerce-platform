package com.socialApp.Lishare.modules.business.admin.service;

import com.socialApp.Lishare.modules.business.admin.dto.AdminDashboardStatsResponse;
import com.socialApp.Lishare.modules.business.admin.dto.AdminUserResponse;
import com.socialApp.Lishare.modules.business.admin.dto.UpdateUserRoleRequest;
import org.springframework.data.domain.Page;

public interface AdminUserService {
    Page<AdminUserResponse> getUsers(int page, int size, String query);

    AdminUserResponse updateUserRole(Long userId, UpdateUserRoleRequest request);

    void deleteUser(Long userId);

    AdminDashboardStatsResponse getDashboardStats();
}
