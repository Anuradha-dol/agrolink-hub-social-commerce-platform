package com.socialApp.Lishare.modules.social.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MessageReactionRequest(
        @NotBlank(message = "Emoji is required")
        @Size(max = 50, message = "Emoji must be at most 50 characters")
        String emoji
) {}
