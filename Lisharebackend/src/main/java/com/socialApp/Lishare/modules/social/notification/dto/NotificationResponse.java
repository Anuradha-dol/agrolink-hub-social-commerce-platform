package com.socialApp.Lishare.modules.social.notification.dto;

import com.socialApp.Lishare.modules.social.notification.entity.NotificationType;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        NotificationType type,
        String message,
        boolean read,
        LocalDateTime createdAt,
        Long actorUserId,
        String actorName,
        String actorProfileImageUrl,
        Long referenceId,
        String referenceType,
        Long postId,
        Long commentId,
        Long replyId
) {}
