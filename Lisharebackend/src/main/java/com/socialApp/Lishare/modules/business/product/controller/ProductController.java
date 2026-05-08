package com.socialApp.Lishare.modules.business.product.controller;

import com.socialApp.Lishare.modules.platform.common.response.ApiResponse;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.business.product.dto.ProductRequest;
import com.socialApp.Lishare.modules.business.product.dto.ProductResponse;
import com.socialApp.Lishare.modules.business.product.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService service;

    @PreAuthorize("hasRole('BUSINESS')")
    @PostMapping
    public ResponseEntity<ApiResponse<ProductResponse>> create(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ProductRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Product created", service.createProduct(user.getUserId(), request)));
    }

    @PreAuthorize("hasRole('BUSINESS')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> update(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Product updated", service.updateProduct(user.getUserId(), id, request)));
    }

    @PreAuthorize("hasRole('BUSINESS')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal User user,
            @PathVariable Long id
    ) {
        service.deleteProduct(user.getUserId(), id);
        return ResponseEntity.ok(ApiResponse.success("Product deleted", null));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String q
    ) {
        return ResponseEntity.ok(ApiResponse.success("Products fetched", service.getProducts(page, size, category, q)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Product fetched", service.getProduct(id)));
    }

    @GetMapping("/business/{businessPageId}")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> byPage(
            @PathVariable Long businessPageId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        return ResponseEntity.ok(ApiResponse.success("Products fetched", service.getProductsByBusinessPage(businessPageId, page, size)));
    }
}
