package com.socialApp.Lishare.modules.social.chat.dto;

public record ConversationMemberResponse(
        Long userId,
        String fullName,
        String imageUrl,
        boolean online
) {}
