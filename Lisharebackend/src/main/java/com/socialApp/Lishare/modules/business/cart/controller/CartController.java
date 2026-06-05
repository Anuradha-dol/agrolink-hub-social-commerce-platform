package com.socialApp.Lishare.modules.business.cart.controller;

import com.socialApp.Lishare.modules.business.cart.dto.CartItemRequest;
import com.socialApp.Lishare.modules.business.cart.dto.CartItemResponse;
import com.socialApp.Lishare.modules.business.cart.service.CartService;
import com.socialApp.Lishare.modules.business.order.dto.OrderResponse;
import com.socialApp.Lishare.modules.platform.common.response.ApiResponse;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CartItemResponse>>> getCart(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success("Cart fetched", cartService.getCart(user.getUserId())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CartItemResponse>> addItem(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CartItemRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Product added to cart", cartService.addItem(user.getUserId(), request)));
    }

    @PutMapping("/{itemId}")
    public ResponseEntity<ApiResponse<CartItemResponse>> updateItem(
            @AuthenticationPrincipal User user,
            @PathVariable Long itemId,
            @Valid @RequestBody CartItemRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Cart item updated", cartService.updateItem(user.getUserId(), itemId, request)));
    }

    @DeleteMapping("/{itemId}")
    public ResponseEntity<ApiResponse<Void>> removeItem(
            @AuthenticationPrincipal User user,
            @PathVariable Long itemId
    ) {
        cartService.removeItem(user.getUserId(), itemId);
        return ResponseEntity.ok(ApiResponse.success("Cart item removed", null));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> clearCart(@AuthenticationPrincipal User user) {
        cartService.clearCart(user.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Cart cleared", null));
    }

    @PostMapping("/checkout")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> checkout(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success("Order placed from cart", cartService.checkout(user.getUserId())));
    }
}
