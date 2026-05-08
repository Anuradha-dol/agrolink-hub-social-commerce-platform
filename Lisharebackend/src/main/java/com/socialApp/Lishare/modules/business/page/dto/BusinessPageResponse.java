package com.socialApp.Lishare.modules.business.page.dto;

import java.time.LocalDateTime;

public record BusinessPageResponse(
        Long id,
        Long ownerId,
        String ownerName,
        String name,
        String description,
        String category,
        boolean active,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
