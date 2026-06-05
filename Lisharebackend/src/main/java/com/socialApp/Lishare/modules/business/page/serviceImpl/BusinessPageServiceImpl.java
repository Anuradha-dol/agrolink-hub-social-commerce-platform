package com.socialApp.Lishare.modules.business.page.serviceImpl;

import com.socialApp.Lishare.modules.business.page.dto.BusinessPageRequest;
import com.socialApp.Lishare.modules.business.page.dto.BusinessPageResponse;
import com.socialApp.Lishare.modules.business.page.entity.BusinessPage;
import com.socialApp.Lishare.modules.business.page.mapper.BusinessPageMapper;
import com.socialApp.Lishare.modules.business.page.repository.BusinessPageRepository;
import com.socialApp.Lishare.modules.business.page.service.BusinessPageService;
import com.socialApp.Lishare.modules.platform.common.enums.Role;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.platform.user.repository.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BusinessPageServiceImpl implements BusinessPageService {

    private final BusinessPageRepository repository;
    private final UserRepo userRepo;
    private final BusinessPageMapper mapper;

    @Override
    public BusinessPageResponse createPage(Long ownerId, BusinessPageRequest request) {
        User owner = getBusinessOwner(ownerId);

        BusinessPage page = BusinessPage.builder()
                .owner(owner)
                .name(request.name())
                .description(request.description())
                .category(request.category())
                .active(true)
                .build();

        return mapper.toResponse(repository.save(page));
    }

    @Override
    public BusinessPageResponse updatePage(Long ownerId, Long pageId, BusinessPageRequest request) {
        BusinessPage page = repository.findById(pageId)
                .orElseThrow(() -> new RuntimeException("Business page not found"));

        if (!page.getOwner().getUserId().equals(ownerId)) {
            throw new RuntimeException("Only owner can update this business page");
        }

        page.setName(request.name());
        page.setDescription(request.description());
        page.setCategory(request.category());
        return mapper.toResponse(repository.save(page));
    }

    @Override
    public void deactivatePage(Long ownerId, Long pageId) {
        BusinessPage page = repository.findById(pageId)
                .orElseThrow(() -> new RuntimeException("Business page not found"));

        if (!page.getOwner().getUserId().equals(ownerId)) {
            throw new RuntimeException("Only owner can deactivate this business page");
        }
        page.setActive(false);
        repository.save(page);
    }

    @Override
    public Page<BusinessPageResponse> getPublicPages(int page, int size, String query) {
        PageRequest pageable = PageRequest.of(page, size);
        if (query != null && !query.isBlank()) {
            return repository.searchPublicPages(query.trim(), pageable).map(mapper::toResponse);
        }
        return repository.findByActiveTrue(pageable).map(mapper::toResponse);
    }

    @Override
    public BusinessPageResponse getPublicPage(Long pageId) {
        BusinessPage page = repository.findById(pageId)
                .orElseThrow(() -> new RuntimeException("Business page not found"));
        if (!page.isActive()) {
            throw new RuntimeException("Business page is not active");
        }
        return mapper.toResponse(page);
    }

    @Override
    public Page<BusinessPageResponse> getOwnerPages(Long ownerId, int page, int size) {
        return repository.findByOwnerUserId(ownerId, PageRequest.of(page, size)).map(mapper::toResponse);
    }

    private User getBusinessOwner(Long ownerId) {
        User owner = userRepo.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (owner.getRole() != Role.ROLE_BUSINESS && owner.getRole() != Role.ROLE_FARMER) {
            throw new RuntimeException("Only business or farmer seller accounts can create business pages");
        }
        return owner;
    }
}
