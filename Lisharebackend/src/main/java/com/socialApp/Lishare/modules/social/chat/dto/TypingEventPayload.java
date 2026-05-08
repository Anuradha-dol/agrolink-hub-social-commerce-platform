package com.socialApp.Lishare.modules.social.chat.dto;

public record TypingEventPayload(
        Long conversationId,
        Long userId,
        String userName,
        boolean typing
) {}
