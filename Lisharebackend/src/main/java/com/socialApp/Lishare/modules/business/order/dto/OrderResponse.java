package com.socialApp.Lishare.modules.business.order.dto;

import com.socialApp.Lishare.modules.business.order.entity.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OrderResponse(
        Long id,
        Long buyerId,
        String buyerName,
        Long sellerId,
        String sellerName,
        Long productId,
        String productName,
        String productImageUrl,
        Long businessPageId,
        String businessName,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal totalPrice,
        String deliveryMethod,
        OrderStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
