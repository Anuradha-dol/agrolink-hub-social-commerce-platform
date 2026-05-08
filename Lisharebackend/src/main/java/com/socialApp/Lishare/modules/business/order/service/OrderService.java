package com.socialApp.Lishare.modules.business.order.service;

import com.socialApp.Lishare.modules.business.order.dto.OrderCreateRequest;
import com.socialApp.Lishare.modules.business.order.dto.OrderResponse;
import com.socialApp.Lishare.modules.business.order.dto.OrderStatusUpdateRequest;
import org.springframework.data.domain.Page;

public interface OrderService {
    OrderResponse createOrder(Long buyerId, OrderCreateRequest request);

    Page<OrderResponse> getMyOrders(Long buyerId, int page, int size);

    Page<OrderResponse> getBusinessOrders(Long sellerId, int page, int size);

    OrderResponse getOrderForCurrentUser(Long currentUserId, Long orderId);

    OrderResponse updateOrderStatus(Long sellerId, Long orderId, OrderStatusUpdateRequest request);

    void cancelOrder(Long buyerId, Long orderId);
}
