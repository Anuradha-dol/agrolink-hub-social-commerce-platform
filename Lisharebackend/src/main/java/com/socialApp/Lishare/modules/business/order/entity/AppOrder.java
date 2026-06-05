package com.socialApp.Lishare.modules.business.order.entity;

import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.business.product.entity.Product;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "orders",
        indexes = {
                @Index(name = "idx_orders_buyer_id", columnList = "buyer_id"),
                @Index(name = "idx_orders_seller_id", columnList = "seller_id"),
                @Index(name = "idx_orders_status", columnList = "status"),
                @Index(name = "idx_orders_created_at", columnList = "created_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "total_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalPrice;

    @Column(name = "delivery_method", nullable = false, length = 80)
    private String deliveryMethod;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrderStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
        if (status == null) {
            status = OrderStatus.PENDING;
        }
        if (deliveryMethod == null || deliveryMethod.isBlank()) {
            deliveryMethod = "Pickup";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        if (deliveryMethod == null || deliveryMethod.isBlank()) {
            deliveryMethod = "Pickup";
        }
    }
}
