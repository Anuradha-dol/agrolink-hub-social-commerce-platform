package com.socialApp.Lishare.modules.social.chat.dto;

import jakarta.validation.constraints.NotNull;

public record ConversationMemberManageRequest(
        @NotNull(message = "User ID is required")
        Long userId
) {}
