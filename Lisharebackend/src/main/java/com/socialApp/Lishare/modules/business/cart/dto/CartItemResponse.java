package com.socialApp.Lishare.modules.business.cart.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CartItemResponse(
        Long id,
        Long productId,
        String productName,
        String productImageUrl,
        Long businessPageId,
        String businessName,
        String category,
        String deliveryMethod,
        BigDecimal unitPrice,
        Integer quantity,
        Integer stock,
        boolean available,
        BigDecimal lineTotal,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
