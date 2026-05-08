package com.socialApp.Lishare.modules.social.chat.dto;

import com.socialApp.Lishare.modules.social.chat.entity.ConversationType;

import java.time.LocalDateTime;
import java.util.List;

public record ConversationSummaryResponse(
        Long conversationId,
        ConversationType type,
        String title,
        List<ConversationMemberResponse> members,
        String lastMessage,
        Long lastMessageSenderId,
        LocalDateTime lastMessageAt,
        long unreadCount
) {}
