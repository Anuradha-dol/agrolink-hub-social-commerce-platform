package com.socialApp.Lishare.modules.social.chat.dto;

import com.socialApp.Lishare.modules.social.chat.entity.MessageStatus;

import java.time.LocalDateTime;

public record MessageResponse(
        Long id,
        Long conversationId,
        Long senderId,
        String senderName,
        String content,
        String attachmentUrl,
        String attachmentType,
        Long replyToMessageId,
        MessageStatus status,
        LocalDateTime createdAt
) {}
