package com.socialApp.Lishare.modules.business.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DeleteUserRequest(
        @NotBlank(message = "Deletion reason is required")
        @Size(max = 1000, message = "Deletion reason must be at most 1000 characters")
        String reason
) {}
