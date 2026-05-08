package com.socialApp.Lishare.modules.social.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record ConversationCreateRequest(
        @NotBlank(message = "Group title is required")
        String title,
        @NotEmpty(message = "Group members are required")
        List<Long> memberIds
) {}
