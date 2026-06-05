package com.socialApp.Lishare.modules.business.cart.mapper;

import com.socialApp.Lishare.modules.business.cart.dto.CartItemResponse;
import com.socialApp.Lishare.modules.business.cart.entity.CartItem;
import com.socialApp.Lishare.modules.business.product.entity.Product;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class CartItemMapper {

    public CartItemResponse toResponse(CartItem item) {
        Product product = item.getProduct();
        BigDecimal unitPrice = product.getPrice() == null ? BigDecimal.ZERO : product.getPrice();
        int quantity = item.getQuantity() == null ? 1 : item.getQuantity();
        return new CartItemResponse(
                item.getId(),
                product.getId(),
                product.getName(),
                product.getImageUrl(),
                product.getBusinessPage().getId(),
                product.getBusinessPage().getName(),
                product.getCategory(),
                product.getDeliveryMethod(),
                unitPrice,
                quantity,
                product.getStock(),
                product.isAvailable(),
                unitPrice.multiply(BigDecimal.valueOf(quantity)),
                item.getCreatedAt(),
                item.getUpdatedAt()
        );
    }
}
