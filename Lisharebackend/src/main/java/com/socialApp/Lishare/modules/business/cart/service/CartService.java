package com.socialApp.Lishare.modules.business.cart.service;

import com.socialApp.Lishare.modules.business.cart.dto.CartItemRequest;
import com.socialApp.Lishare.modules.business.cart.dto.CartItemResponse;
import com.socialApp.Lishare.modules.business.order.dto.OrderResponse;

import java.util.List;

public interface CartService {
    List<CartItemResponse> getCart(Long userId);
    CartItemResponse addItem(Long userId, CartItemRequest request);
    CartItemResponse updateItem(Long userId, Long itemId, CartItemRequest request);
    void removeItem(Long userId, Long itemId);
    void clearCart(Long userId);
    List<OrderResponse> checkout(Long userId);
}
