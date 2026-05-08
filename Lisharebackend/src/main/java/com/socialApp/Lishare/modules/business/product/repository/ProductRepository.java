package com.socialApp.Lishare.modules.business.product.repository;

import com.socialApp.Lishare.modules.business.product.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {
    Page<Product> findByAvailableTrue(Pageable pageable);
    Page<Product> findByBusinessPageId(Long pageId, Pageable pageable);
    Page<Product> findByAvailableTrueAndCategoryIgnoreCase(String category, Pageable pageable);
    Page<Product> findByAvailableTrueAndNameContainingIgnoreCase(String name, Pageable pageable);
}
