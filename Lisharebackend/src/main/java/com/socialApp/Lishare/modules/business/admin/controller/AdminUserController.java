package com.socialApp.Lishare.modules.business.admin.controller;

import com.socialApp.Lishare.modules.business.admin.dto.AdminDashboardStatsResponse;
import com.socialApp.Lishare.modules.business.admin.dto.AdminUserResponse;
import com.socialApp.Lishare.modules.business.admin.dto.DeleteUserRequest;
import com.socialApp.Lishare.modules.business.admin.dto.UpdateUserModerationRequest;
import com.socialApp.Lishare.modules.business.admin.dto.UpdateUserRoleRequest;
import com.socialApp.Lishare.modules.business.admin.service.AdminUserService;
import com.socialApp.Lishare.modules.platform.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService service;

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Page<AdminUserResponse>>> users(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String q
    ) {
        return ResponseEntity.ok(ApiResponse.success("Users fetched", service.getUsers(page, size, q)));
    }

    @PutMapping("/users/{userId}/role")
    public ResponseEntity<ApiResponse<AdminUserResponse>> updateRole(
            @PathVariable Long userId,
            @Valid @RequestBody UpdateUserRoleRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("User role updated", service.updateUserRole(userId, request)));
    }

    @PutMapping("/users/{userId}/moderation")
    public ResponseEntity<ApiResponse<AdminUserResponse>> updateModeration(
            @PathVariable Long userId,
            @Valid @RequestBody UpdateUserModerationRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("User moderation updated", service.updateUserModeration(userId, request)));
    }

    @DeleteMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @PathVariable Long userId,
            @Valid @RequestBody DeleteUserRequest request
    ) {
        service.deleteUser(userId, request);
        return ResponseEntity.ok(ApiResponse.success("User deleted successfully", null));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AdminDashboardStatsResponse>> dashboardStats() {
        return ResponseEntity.ok(ApiResponse.success("Admin stats fetched", service.getDashboardStats()));
    }
}
