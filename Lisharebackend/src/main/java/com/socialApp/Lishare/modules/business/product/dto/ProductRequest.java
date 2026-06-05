package com.socialApp.Lishare.modules.business.product.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record ProductRequest(
        @NotNull(message = "Business page ID is required")
        Long businessPageId,

        @NotBlank(message = "Product name is required")
        @Size(max = 200, message = "Product name must be at most 200 characters")
        String name,

        @Size(max = 1500, message = "Description must be at most 1500 characters")
        String description,

        @NotNull(message = "Price is required")
        @DecimalMin(value = "0.00", inclusive = true, message = "Price must be non-negative")
        BigDecimal price,

        @NotNull(message = "Stock is required")
        @Min(value = 0, message = "Stock must be non-negative")
        Integer stock,

        @Size(max = 100, message = "Category must be at most 100 characters")
        String category,

        @Size(max = 500, message = "Image URL must be at most 500 characters")
        String imageUrl,

        @Size(max = 80, message = "Delivery method must be at most 80 characters")
        String deliveryMethod
) {}
