package com.socialApp.Lishare.modules.business.admin.dto;

import com.socialApp.Lishare.modules.platform.common.enums.Role;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRoleRequest(
        @NotNull(message = "Role is required")
        Role role
) {}
