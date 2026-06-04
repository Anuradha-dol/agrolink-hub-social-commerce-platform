package com.socialApp.Lishare.modules.social.story.dto;

import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Builder
public record StoryGroupResponse(
        Long userId,
        String username,
        String profileImage,
        LocalDateTime latestStoryTime,
        List<StoryResponse> stories
) {}
