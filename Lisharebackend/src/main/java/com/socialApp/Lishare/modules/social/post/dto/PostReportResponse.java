package com.socialApp.Lishare.modules.social.post.dto;

import com.socialApp.Lishare.modules.social.post.entity.PostReportStatus;

import java.time.LocalDateTime;

public record PostReportResponse(
        Long id,
        Long postId,
        Long reporterId,
        String reporterName,
        String reason,
        PostReportStatus status,
        LocalDateTime createdAt
) {}
