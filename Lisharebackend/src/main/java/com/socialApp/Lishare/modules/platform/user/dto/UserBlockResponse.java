package com.socialApp.Lishare.modules.platform.user.dto;

import java.time.LocalDateTime;

public record UserBlockResponse(
        Long id,
        Long blockedUserId,
        String blockedUserName,
        LocalDateTime createdAt
) {}
