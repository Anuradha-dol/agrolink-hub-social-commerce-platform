package com.socialApp.Lishare.modules.business.order.mapper;

import com.socialApp.Lishare.modules.business.order.dto.OrderResponse;
import com.socialApp.Lishare.modules.business.order.entity.AppOrder;
import org.springframework.stereotype.Component;

@Component
public class AppOrderMapper {

    public OrderResponse toResponse(AppOrder order) {
        return new OrderResponse(
                order.getId(),
                order.getBuyer().getUserId(),
                order.getBuyer().getFirstname() + " " + order.getBuyer().getLastName(),
                order.getSeller().getUserId(),
                order.getSeller().getFirstname() + " " + order.getSeller().getLastName(),
                order.getProduct().getId(),
                order.getProduct().getName(),
                order.getQuantity(),
                order.getUnitPrice(),
                order.getTotalPrice(),
                order.getStatus(),
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }
}
