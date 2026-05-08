package com.socialApp.Lishare.modules.social.chat.dto;

import java.time.LocalDateTime;

public record MessageReactionResponse(
        Long id,
        Long messageId,
        Long userId,
        String userName,
        String emoji,
        LocalDateTime createdAt
) {}
