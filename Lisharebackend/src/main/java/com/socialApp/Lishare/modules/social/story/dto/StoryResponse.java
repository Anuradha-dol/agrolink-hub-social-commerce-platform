package com.socialApp.Lishare.modules.social.story.dto;

import lombok.Builder;

import java.time.LocalDateTime;
import java.util.Map;

@Builder
public record StoryResponse(
        Long id,
        Long ownerUserId,
        String ownerName,
        String mediaUrl,
        String mediaType,
        String caption,
        LocalDateTime createdAt,
        LocalDateTime expiresAt,
        Long sourcePostId,
        Long resharedFromStoryId,
        Long resharedFromOwnerId,
        String resharedFromOwnerName,
        Long viewCount,
        boolean viewedByCurrentUser,
        Map<String, Long> reactionCounts
) {}
