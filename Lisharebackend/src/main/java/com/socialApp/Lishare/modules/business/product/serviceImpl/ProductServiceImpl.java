package com.socialApp.Lishare.modules.business.product.serviceImpl;

import com.socialApp.Lishare.modules.business.page.entity.BusinessPage;
import com.socialApp.Lishare.modules.business.page.repository.BusinessPageRepository;
import com.socialApp.Lishare.modules.business.order.repository.AppOrderRepository;
import com.socialApp.Lishare.modules.business.product.dto.ProductRequest;
import com.socialApp.Lishare.modules.business.product.dto.ProductResponse;
import com.socialApp.Lishare.modules.business.product.entity.Product;
import com.socialApp.Lishare.modules.business.product.mapper.ProductMapper;
import com.socialApp.Lishare.modules.business.product.repository.ProductRepository;
import com.socialApp.Lishare.modules.business.product.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository repository;
    private final BusinessPageRepository businessPageRepository;
    private final AppOrderRepository appOrderRepository;
    private final ProductMapper mapper;

    @Override
    public ProductResponse createProduct(Long userId, ProductRequest request) {
        BusinessPage page = businessPageRepository.findById(request.businessPageId())
                .orElseThrow(() -> new RuntimeException("Business page not found"));

        ensureOwner(userId, page);

        Product product = Product.builder()
                .businessPage(page)
                .name(request.name())
                .description(request.description())
                .price(request.price())
                .stock(request.stock())
                .category(request.category())
                .imageUrl(request.imageUrl())
                .available(request.stock() != null && request.stock() > 0)
                .build();

        return mapper.toResponse(repository.save(product));
    }

    @Override
    public ProductResponse updateProduct(Long userId, Long productId, ProductRequest request) {
        Product product = repository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        ensureOwner(userId, product.getBusinessPage());

        if (!product.getBusinessPage().getId().equals(request.businessPageId())) {
            BusinessPage newPage = businessPageRepository.findById(request.businessPageId())
                    .orElseThrow(() -> new RuntimeException("Business page not found"));
            ensureOwner(userId, newPage);
            product.setBusinessPage(newPage);
        }

        product.setName(request.name());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setStock(request.stock());
        product.setCategory(request.category());
        product.setImageUrl(request.imageUrl());
        product.setAvailable(request.stock() != null && request.stock() > 0);

        return mapper.toResponse(repository.save(product));
    }

    @Override
    public void deleteProduct(Long userId, Long productId) {
        Product product = repository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        ensureOwner(userId, product.getBusinessPage());

        // Soft-disable product if there are existing order references.
        if (appOrderRepository.existsByProductId(productId)) {
            product.setAvailable(false);
            product.setStock(0);
            repository.save(product);
            return;
        }

        repository.delete(product);
    }

    @Override
    public Page<ProductResponse> getProducts(int page, int size, String category, String query) {
        PageRequest pageable = PageRequest.of(page, size);
        Page<Product> products;

        if (query != null && !query.isBlank()) {
            products = repository.findByAvailableTrueAndNameContainingIgnoreCase(query, pageable);
        } else if (category != null && !category.isBlank()) {
            products = repository.findByAvailableTrueAndCategoryIgnoreCase(category, pageable);
        } else {
            products = repository.findByAvailableTrue(pageable);
        }
        return products.map(mapper::toResponse);
    }

    @Override
    public Page<ProductResponse> getProductsByBusinessPage(Long pageId, int page, int size) {
        return repository.findByBusinessPageId(pageId, PageRequest.of(page, size)).map(mapper::toResponse);
    }

    @Override
    public ProductResponse getProduct(Long productId) {
        Product product = repository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        return mapper.toResponse(product);
    }

    private void ensureOwner(Long userId, BusinessPage page) {
        if (!page.getOwner().getUserId().equals(userId)) {
            throw new RuntimeException("Only business page owner can manage products");
        }
    }
}
