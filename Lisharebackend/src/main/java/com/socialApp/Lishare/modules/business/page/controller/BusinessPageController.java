package com.socialApp.Lishare.modules.business.page.controller;

import com.socialApp.Lishare.modules.business.page.dto.BusinessPageRequest;
import com.socialApp.Lishare.modules.business.page.dto.BusinessPageResponse;
import com.socialApp.Lishare.modules.business.page.service.BusinessPageService;
import com.socialApp.Lishare.modules.platform.common.response.ApiResponse;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/business/pages")
@RequiredArgsConstructor
public class BusinessPageController {

    private final BusinessPageService service;

    @PreAuthorize("hasRole('BUSINESS')")
    @PostMapping
    public ResponseEntity<ApiResponse<BusinessPageResponse>> createPage(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody BusinessPageRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Business page created", service.createPage(user.getUserId(), request)));
    }

    @PreAuthorize("hasRole('BUSINESS')")
    @PutMapping("/{pageId}")
    public ResponseEntity<ApiResponse<BusinessPageResponse>> updatePage(
            @AuthenticationPrincipal User user,
            @PathVariable Long pageId,
            @Valid @RequestBody BusinessPageRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Business page updated", service.updatePage(user.getUserId(), pageId, request)));
    }

    @PreAuthorize("hasRole('BUSINESS')")
    @DeleteMapping("/{pageId}")
    public ResponseEntity<ApiResponse<Void>> deactivatePage(
            @AuthenticationPrincipal User user,
            @PathVariable Long pageId
    ) {
        service.deactivatePage(user.getUserId(), pageId);
        return ResponseEntity.ok(ApiResponse.success("Business page deactivated", null));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<BusinessPageResponse>>> listPages(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(ApiResponse.success("Business pages fetched", service.getPublicPages(page, size)));
    }

    @PreAuthorize("hasRole('BUSINESS')")
    @GetMapping("/mine")
    public ResponseEntity<ApiResponse<Page<BusinessPageResponse>>> myPages(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(ApiResponse.success("My business pages fetched", service.getOwnerPages(user.getUserId(), page, size)));
    }
}
