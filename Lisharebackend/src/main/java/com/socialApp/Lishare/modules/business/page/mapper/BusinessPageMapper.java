package com.socialApp.Lishare.modules.business.page.mapper;

import com.socialApp.Lishare.modules.business.page.dto.BusinessPageResponse;
import com.socialApp.Lishare.modules.business.page.entity.BusinessPage;
import org.springframework.stereotype.Component;

@Component
public class BusinessPageMapper {

    public BusinessPageResponse toResponse(BusinessPage page) {
        String ownerName = page.getOwner().getFirstname() + " " + page.getOwner().getLastName();
        return new BusinessPageResponse(
                page.getId(),
                page.getOwner().getUserId(),
                ownerName.trim(),
                page.getName(),
                page.getDescription(),
                page.getCategory(),
                page.isActive(),
                page.getCreatedAt(),
                page.getUpdatedAt()
        );
    }
}
