package com.socialApp.Lishare.modules.business.page.service;

import com.socialApp.Lishare.modules.business.page.dto.BusinessPageRequest;
import com.socialApp.Lishare.modules.business.page.dto.BusinessPageResponse;
import org.springframework.data.domain.Page;

public interface BusinessPageService {
    BusinessPageResponse createPage(Long ownerId, BusinessPageRequest request);
    BusinessPageResponse updatePage(Long ownerId, Long pageId, BusinessPageRequest request);
    void deactivatePage(Long ownerId, Long pageId);
    Page<BusinessPageResponse> getPublicPages(int page, int size, String query);
    BusinessPageResponse getPublicPage(Long pageId);
    Page<BusinessPageResponse> getOwnerPages(Long ownerId, int page, int size);
}
