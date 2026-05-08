package com.socialApp.Lishare.modules.business.admin.dto;

import com.socialApp.Lishare.modules.platform.common.enums.Role;

public record AdminUserResponse(
        Long userId,
        String firstName,
        String lastName,
        String email,
        String phoneNumber,
        Role role,
        Boolean verified
) {}
