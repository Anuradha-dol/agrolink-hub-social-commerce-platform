package com.socialApp.Lishare.modules.business.order.dto;

import com.socialApp.Lishare.modules.business.order.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record OrderStatusUpdateRequest(
        @NotNull(message = "Status is required")
        OrderStatus status
) {}
