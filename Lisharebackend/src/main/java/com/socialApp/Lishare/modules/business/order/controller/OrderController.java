package com.socialApp.Lishare.modules.business.order.controller;

import com.socialApp.Lishare.modules.platform.common.response.ApiResponse;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.business.order.dto.OrderCreateRequest;
import com.socialApp.Lishare.modules.business.order.dto.OrderResponse;
import com.socialApp.Lishare.modules.business.order.dto.OrderStatusUpdateRequest;
import com.socialApp.Lishare.modules.business.order.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody OrderCreateRequest request
    ) {
        return ResponseEntity.ok(
                ApiResponse.success("Order placed successfully", orderService.createOrder(user.getUserId(), request))
        );
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> myOrders(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(
                ApiResponse.success("My orders fetched", orderService.getMyOrders(user.getUserId(), page, size))
        );
    }

    @PreAuthorize("hasRole('BUSINESS')")
    @GetMapping("/business")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> businessOrders(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(
                ApiResponse.success("Business orders fetched", orderService.getBusinessOrders(user.getUserId(), page, size))
        );
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrder(
            @AuthenticationPrincipal User user,
            @PathVariable Long orderId
    ) {
        return ResponseEntity.ok(
                ApiResponse.success("Order fetched", orderService.getOrderForCurrentUser(user.getUserId(), orderId))
        );
    }

    @PreAuthorize("hasRole('BUSINESS')")
    @PutMapping("/{orderId}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateStatus(
            @AuthenticationPrincipal User user,
            @PathVariable Long orderId,
            @Valid @RequestBody OrderStatusUpdateRequest request
    ) {
        return ResponseEntity.ok(
                ApiResponse.success("Order status updated", orderService.updateOrderStatus(user.getUserId(), orderId, request))
        );
    }

    @DeleteMapping("/{orderId}")
    public ResponseEntity<ApiResponse<Void>> cancelOrder(
            @AuthenticationPrincipal User user,
            @PathVariable Long orderId
    ) {
        orderService.cancelOrder(user.getUserId(), orderId);
        return ResponseEntity.ok(ApiResponse.success("Order cancelled", null));
    }
}
