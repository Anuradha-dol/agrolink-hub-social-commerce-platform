package com.socialApp.Lishare.modules.business.product.entity;

import com.socialApp.Lishare.modules.business.page.entity.BusinessPage;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "products",
        indexes = {
                @Index(name = "idx_products_page_id", columnList = "business_page_id"),
                @Index(name = "idx_products_category", columnList = "category"),
                @Index(name = "idx_products_created_at", columnList = "created_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "business_page_id", nullable = false)
    private BusinessPage businessPage;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 1500)
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private Integer stock;

    @Column(length = 100)
    private String category;

    @Column(length = 500)
    private String imageUrl;

    @Column(name = "delivery_method", nullable = false, length = 80)
    private String deliveryMethod;

    @Column(nullable = false)
    private boolean available;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
        if (deliveryMethod == null || deliveryMethod.isBlank()) {
            deliveryMethod = "Pickup";
        }
        available = available && stock != null && stock > 0;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        if (deliveryMethod == null || deliveryMethod.isBlank()) {
            deliveryMethod = "Pickup";
        }
        available = stock != null && stock > 0;
    }
}
