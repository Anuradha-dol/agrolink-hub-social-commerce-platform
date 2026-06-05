package com.socialApp.Lishare.modules.business.product.service;

import com.socialApp.Lishare.modules.business.product.dto.ProductRequest;
import com.socialApp.Lishare.modules.business.product.dto.ProductResponse;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

public interface ProductService {
    ProductResponse createProduct(Long userId, ProductRequest request);
    ProductResponse createProduct(Long userId, ProductRequest request, MultipartFile imageFile);
    ProductResponse updateProduct(Long userId, Long productId, ProductRequest request);
    ProductResponse updateProduct(Long userId, Long productId, ProductRequest request, MultipartFile imageFile);
    void deleteProduct(Long userId, Long productId);
    Page<ProductResponse> getProducts(int page, int size, String category, String query);
    Page<ProductResponse> getProductsByBusinessPage(Long pageId, int page, int size);
    ProductResponse getProduct(Long productId);
}
