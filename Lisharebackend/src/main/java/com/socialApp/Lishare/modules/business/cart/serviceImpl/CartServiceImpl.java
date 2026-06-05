package com.socialApp.Lishare.modules.business.cart.serviceImpl;

import com.socialApp.Lishare.modules.business.cart.dto.CartItemRequest;
import com.socialApp.Lishare.modules.business.cart.dto.CartItemResponse;
import com.socialApp.Lishare.modules.business.cart.entity.CartItem;
import com.socialApp.Lishare.modules.business.cart.mapper.CartItemMapper;
import com.socialApp.Lishare.modules.business.cart.repository.CartItemRepository;
import com.socialApp.Lishare.modules.business.cart.service.CartService;
import com.socialApp.Lishare.modules.business.order.dto.OrderCreateRequest;
import com.socialApp.Lishare.modules.business.order.dto.OrderResponse;
import com.socialApp.Lishare.modules.business.order.service.OrderService;
import com.socialApp.Lishare.modules.business.product.entity.Product;
import com.socialApp.Lishare.modules.business.product.repository.ProductRepository;
import com.socialApp.Lishare.modules.platform.common.enums.Role;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.platform.user.repository.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepo userRepo;
    private final OrderService orderService;
    private final CartItemMapper mapper;

    @Override
    public List<CartItemResponse> getCart(Long userId) {
        return cartItemRepository.findByUserUserIdOrderByCreatedAtDesc(userId).stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public CartItemResponse addItem(Long userId, CartItemRequest request) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        ensureBuyerAccount(user);
        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new RuntimeException("Product not found"));
        validateProduct(product);

        CartItem item = cartItemRepository.findByUserUserIdAndProductId(userId, product.getId())
                .orElseGet(() -> CartItem.builder()
                        .user(user)
                        .product(product)
                        .quantity(0)
                        .build());

        int nextQuantity = Math.max(1, item.getQuantity() + request.quantity());
        if (nextQuantity > product.getStock()) {
            throw new RuntimeException("Cart quantity exceeds available stock");
        }
        item.setQuantity(nextQuantity);
        return mapper.toResponse(cartItemRepository.save(item));
    }

    @Override
    @Transactional
    public CartItemResponse updateItem(Long userId, Long itemId, CartItemRequest request) {
        CartItem item = cartItemRepository.findByIdAndUserUserId(itemId, userId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));
        validateProduct(item.getProduct());
        if (request.quantity() > item.getProduct().getStock()) {
            throw new RuntimeException("Cart quantity exceeds available stock");
        }
        item.setQuantity(request.quantity());
        return mapper.toResponse(cartItemRepository.save(item));
    }

    @Override
    @Transactional
    public void removeItem(Long userId, Long itemId) {
        CartItem item = cartItemRepository.findByIdAndUserUserId(itemId, userId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));
        cartItemRepository.delete(item);
    }

    @Override
    @Transactional
    public void clearCart(Long userId) {
        cartItemRepository.deleteByUserUserId(userId);
    }

    @Override
    @Transactional
    public List<OrderResponse> checkout(Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        ensureBuyerAccount(user);

        List<CartItem> items = cartItemRepository.findByUserUserIdOrderByCreatedAtDesc(userId);
        if (items.isEmpty()) {
            throw new RuntimeException("Cart is empty");
        }

        List<OrderResponse> orders = items.stream()
                .map((item) -> orderService.createOrder(
                        userId,
                        new OrderCreateRequest(item.getProduct().getId(), item.getQuantity(), item.getProduct().getDeliveryMethod())
                ))
                .toList();

        cartItemRepository.deleteByUserUserId(userId);
        return orders;
    }

    private void validateProduct(Product product) {
        if (!product.isAvailable() || product.getStock() == null || product.getStock() <= 0) {
            throw new RuntimeException("Product is not available");
        }
    }

    private void ensureBuyerAccount(User user) {
        if (user.getRole() == Role.ROLE_BUSINESS || user.getRole() == Role.ROLE_FARMER) {
            throw new RuntimeException("Business seller accounts cannot add marketplace products to cart");
        }
    }
}
