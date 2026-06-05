package com.socialApp.Lishare.modules.business.product.controller;

import com.socialApp.Lishare.modules.platform.common.response.ApiResponse;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.business.product.dto.ProductRequest;
import com.socialApp.Lishare.modules.business.product.dto.ProductResponse;
import com.socialApp.Lishare.modules.business.product.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService service;

    @PreAuthorize("hasAnyRole('BUSINESS','FARMER')")
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<ProductResponse>> create(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ProductRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Product created", service.createProduct(user.getUserId(), request)));
    }

    @PreAuthorize("hasAnyRole('BUSINESS','FARMER')")
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ProductResponse>> createMultipart(
            @AuthenticationPrincipal User user,
            @RequestParam Long businessPageId,
            @RequestParam String name,
            @RequestParam(required = false) String description,
            @RequestParam BigDecimal price,
            @RequestParam Integer stock,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String imageUrl,
            @RequestParam(required = false) String deliveryMethod,
            @RequestParam(value = "image", required = false) MultipartFile image
    ) {
        ProductRequest request = productRequest(businessPageId, name, description, price, stock, category, imageUrl, deliveryMethod);
        return ResponseEntity.ok(ApiResponse.success("Product created", service.createProduct(user.getUserId(), request, image)));
    }

    @PreAuthorize("hasAnyRole('BUSINESS','FARMER')")
    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<ProductResponse>> update(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Product updated", service.updateProduct(user.getUserId(), id, request)));
    }

    @PreAuthorize("hasAnyRole('BUSINESS','FARMER')")
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ProductResponse>> updateMultipart(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestParam Long businessPageId,
            @RequestParam String name,
            @RequestParam(required = false) String description,
            @RequestParam BigDecimal price,
            @RequestParam Integer stock,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String imageUrl,
            @RequestParam(required = false) String deliveryMethod,
            @RequestParam(value = "image", required = false) MultipartFile image
    ) {
        ProductRequest request = productRequest(businessPageId, name, description, price, stock, category, imageUrl, deliveryMethod);
        return ResponseEntity.ok(ApiResponse.success("Product updated", service.updateProduct(user.getUserId(), id, request, image)));
    }

    @PreAuthorize("hasAnyRole('BUSINESS','FARMER')")
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

    private ProductRequest productRequest(
            Long businessPageId,
            String name,
            String description,
            BigDecimal price,
            Integer stock,
            String category,
            String imageUrl,
            String deliveryMethod
    ) {
        return new ProductRequest(businessPageId, name, description, price, stock, category, imageUrl, deliveryMethod);
    }
}
