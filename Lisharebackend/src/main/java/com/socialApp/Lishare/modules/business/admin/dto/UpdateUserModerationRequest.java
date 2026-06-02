package com.socialApp.Lishare.modules.business.admin.dto;

import com.socialApp.Lishare.modules.platform.common.enums.AccountModerationStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateUserModerationRequest(
        @NotNull(message = "Moderation status is required")
        AccountModerationStatus status,

        @Size(max = 1000, message = "Message must be at most 1000 characters")
        String message
) {}
