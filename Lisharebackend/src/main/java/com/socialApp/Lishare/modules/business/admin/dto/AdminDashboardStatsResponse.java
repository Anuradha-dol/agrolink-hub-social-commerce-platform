package com.socialApp.Lishare.modules.business.admin.dto;

public record AdminDashboardStatsResponse(
        long totalUsers,
        long totalPosts,
        long totalOrders,
        long totalProducts,
        long totalBusinessPages
) {}
