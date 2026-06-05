package com.socialApp.Lishare.modules.business.cart.entity;

import com.socialApp.Lishare.modules.business.product.entity.Product;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "cart_items",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_cart_items_user_product", columnNames = {"user_id", "product_id"})
        },
        indexes = {
                @Index(name = "idx_cart_items_user_id", columnList = "user_id"),
                @Index(name = "idx_cart_items_product_id", columnList = "product_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
        if (quantity == null || quantity < 1) {
            quantity = 1;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        if (quantity == null || quantity < 1) {
            quantity = 1;
        }
    }
}
