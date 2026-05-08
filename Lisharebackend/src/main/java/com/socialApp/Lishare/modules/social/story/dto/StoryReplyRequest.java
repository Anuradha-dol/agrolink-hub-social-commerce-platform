package com.socialApp.Lishare.modules.social.story.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record StoryReplyRequest(
        @NotBlank(message = "Reply content is required")
        @Size(max = 2000, message = "Reply content too long")
        String content
) {}
