package com.socialApp.Lishare.modules.business.order.serviceImpl;

import com.socialApp.Lishare.modules.social.notification.entity.Notification;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.social.notification.entity.NotificationType;
import com.socialApp.Lishare.modules.social.notification.service.NotificationService;
import com.socialApp.Lishare.modules.business.order.dto.OrderCreateRequest;
import com.socialApp.Lishare.modules.business.order.dto.OrderResponse;
import com.socialApp.Lishare.modules.business.order.dto.OrderStatusUpdateRequest;
import com.socialApp.Lishare.modules.business.order.entity.AppOrder;
import com.socialApp.Lishare.modules.business.order.entity.OrderStatus;
import com.socialApp.Lishare.modules.business.order.mapper.AppOrderMapper;
import com.socialApp.Lishare.modules.business.order.repository.AppOrderRepository;
import com.socialApp.Lishare.modules.business.order.service.OrderService;
import com.socialApp.Lishare.modules.business.product.entity.Product;
import com.socialApp.Lishare.modules.business.product.repository.ProductRepository;
import com.socialApp.Lishare.modules.platform.user.repository.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final AppOrderRepository appOrderRepository;
    private final ProductRepository productRepository;
    private final UserRepo userRepo;
    private final NotificationService notificationService;
    private final AppOrderMapper mapper;

    @Override
    @Transactional
    public OrderResponse createOrder(Long buyerId, OrderCreateRequest request) {
        User buyer = userRepo.findById(buyerId)
                .orElseThrow(() -> new RuntimeException("Buyer not found"));

        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (!product.isAvailable()) {
            throw new RuntimeException("Product is not available");
        }
        if (product.getStock() < request.quantity()) {
            throw new RuntimeException("Insufficient stock");
        }

        User seller = product.getBusinessPage().getOwner();
        if (seller.getUserId().equals(buyerId)) {
            throw new RuntimeException("You cannot order your own product");
        }

        BigDecimal unitPrice = product.getPrice();
        BigDecimal totalPrice = unitPrice.multiply(BigDecimal.valueOf(request.quantity()));

        AppOrder order = AppOrder.builder()
                .buyer(buyer)
                .seller(seller)
                .product(product)
                .quantity(request.quantity())
                .unitPrice(unitPrice)
                .totalPrice(totalPrice)
                .status(OrderStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        product.setStock(product.getStock() - request.quantity());
        if (product.getStock() <= 0) {
            product.setAvailable(false);
        }
        productRepository.save(product);

        AppOrder saved = appOrderRepository.save(order);

        notificationService.publish(Notification.builder()
                .user(seller)
                .message("New order received for product: " + product.getName())
                .type(NotificationType.ORDER_STATUS)
                .actorUser(buyer)
                .referenceId(saved.getId())
                .referenceType("ORDER")
                .read(false)
                .createdAt(LocalDateTime.now())
                .build());

        return mapper.toResponse(saved);
    }

    @Override
    public Page<OrderResponse> getMyOrders(Long buyerId, int page, int size) {
        return appOrderRepository.findBuyerOrders(buyerId, PageRequest.of(page, size))
                .map(mapper::toResponse);
    }

    @Override
    public Page<OrderResponse> getBusinessOrders(Long sellerId, int page, int size) {
        return appOrderRepository.findSellerOrders(sellerId, PageRequest.of(page, size))
                .map(mapper::toResponse);
    }

    @Override
    public OrderResponse getOrderForCurrentUser(Long currentUserId, Long orderId) {
        AppOrder order = appOrderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        boolean owner = order.getBuyer().getUserId().equals(currentUserId)
                || order.getSeller().getUserId().equals(currentUserId);
        if (!owner) {
            throw new RuntimeException("You are not authorized to view this order");
        }
        return mapper.toResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Long sellerId, Long orderId, OrderStatusUpdateRequest request) {
        AppOrder order = appOrderRepository.findByIdForSeller(orderId, sellerId)
                .orElseThrow(() -> new RuntimeException("Order not found for this business account"));

        OrderStatus current = order.getStatus();
        OrderStatus next = request.status();

        if (!isTransitionAllowed(current, next)) {
            throw new RuntimeException("Invalid order status transition from " + current + " to " + next);
        }

        order.setStatus(next);
        AppOrder saved = appOrderRepository.save(order);

        notificationService.publish(Notification.builder()
                .user(saved.getBuyer())
                .message("Your order #" + saved.getId() + " is now " + next.name())
                .type(NotificationType.ORDER_STATUS)
                .actorUser(saved.getSeller())
                .referenceId(saved.getId())
                .referenceType("ORDER")
                .read(false)
                .createdAt(LocalDateTime.now())
                .build());

        return mapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void cancelOrder(Long buyerId, Long orderId) {
        AppOrder order = appOrderRepository.findByIdForBuyer(orderId, buyerId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!(order.getStatus() == OrderStatus.PENDING || order.getStatus() == OrderStatus.ACCEPTED)) {
            throw new RuntimeException("Only pending/accepted orders can be cancelled");
        }

        order.setStatus(OrderStatus.CANCELLED);
        appOrderRepository.save(order);

        Product product = order.getProduct();
        product.setStock(product.getStock() + order.getQuantity());
        if (product.getStock() > 0) {
            product.setAvailable(true);
        }
        productRepository.save(product);

        notificationService.publish(Notification.builder()
                .user(order.getSeller())
                .message("Order #" + order.getId() + " was cancelled by buyer")
                .type(NotificationType.ORDER_STATUS)
                .actorUser(order.getBuyer())
                .referenceId(order.getId())
                .referenceType("ORDER")
                .read(false)
                .createdAt(LocalDateTime.now())
                .build());
    }

    private boolean isTransitionAllowed(OrderStatus current, OrderStatus next) {
        if (current == next) {
            return true;
        }

        return switch (current) {
            case PENDING -> in(next, OrderStatus.ACCEPTED, OrderStatus.CANCELLED);
            case ACCEPTED -> in(next, OrderStatus.PROCESSING, OrderStatus.CANCELLED);
            case PROCESSING -> in(next, OrderStatus.SHIPPED);
            case SHIPPED -> in(next, OrderStatus.DELIVERED);
            case DELIVERED, CANCELLED -> false;
        };
    }

    private boolean in(OrderStatus value, OrderStatus... allowed) {
        Set<OrderStatus> allowedSet = EnumSet.noneOf(OrderStatus.class);
        for (OrderStatus orderStatus : allowed) {
            allowedSet.add(orderStatus);
        }
        return allowedSet.contains(value);
    }
}
