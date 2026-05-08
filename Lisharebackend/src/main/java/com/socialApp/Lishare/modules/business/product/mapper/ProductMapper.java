package com.socialApp.Lishare.modules.business.product.mapper;

import com.socialApp.Lishare.modules.business.product.dto.ProductResponse;
import com.socialApp.Lishare.modules.business.product.entity.Product;
import org.springframework.stereotype.Component;

@Component
public class ProductMapper {
    public ProductResponse toResponse(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getBusinessPage().getId(),
                product.getBusinessPage().getName(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getStock(),
                product.getCategory(),
                product.getImageUrl(),
                product.isAvailable(),
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }
}
