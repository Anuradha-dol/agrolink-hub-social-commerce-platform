package com.socialApp.Lishare.modules.social.post.dto;

import com.socialApp.Lishare.modules.social.post.entity.PostReportStatus;
import jakarta.validation.constraints.NotNull;

public record PostReportStatusUpdateRequest(
        @NotNull(message = "Status is required")
        PostReportStatus status
) {}
