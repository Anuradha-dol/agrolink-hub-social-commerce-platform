package com.socialApp.Lishare.modules.business.product.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ProductResponse(
        Long id,
        Long businessPageId,
        String businessPageName,
        String name,
        String description,
        BigDecimal price,
        Integer stock,
        String category,
        String imageUrl,
        boolean available,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
