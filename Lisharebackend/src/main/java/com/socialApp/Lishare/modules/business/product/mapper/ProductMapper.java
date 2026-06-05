package com.socialApp.Lishare.modules.business.product.mapper;

import com.socialApp.Lishare.modules.business.product.dto.ProductResponse;
import com.socialApp.Lishare.modules.business.product.entity.Product;
import org.springframework.stereotype.Component;

@Component
public class ProductMapper {
    public ProductResponse toResponse(Product product) {
        String ownerName = (product.getBusinessPage().getOwner().getFirstname() + " "
                + product.getBusinessPage().getOwner().getLastName()).trim();
        return new ProductResponse(
                product.getId(),
                product.getBusinessPage().getId(),
                product.getBusinessPage().getName(),
                product.getBusinessPage().getOwner().getUserId(),
                ownerName,
                product.getBusinessPage().getOwner().getEmail(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getStock(),
                product.getCategory(),
                product.getImageUrl(),
                product.getDeliveryMethod(),
                product.isAvailable(),
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }
}
