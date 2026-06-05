package com.socialApp.Lishare.modules.business.product.repository;

import com.socialApp.Lishare.modules.business.product.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Long> {
    Page<Product> findByAvailableTrue(Pageable pageable);
    Page<Product> findByBusinessPageId(Long pageId, Pageable pageable);
    Page<Product> findByAvailableTrueAndCategoryIgnoreCase(String category, Pageable pageable);
    Page<Product> findByAvailableTrueAndNameContainingIgnoreCase(String name, Pageable pageable);

    @Query("""
            SELECT p FROM Product p
            WHERE p.available = true
               OR p.stock > 0
            ORDER BY p.createdAt DESC
            """)
    Page<Product> findListedMarketplaceProducts(Pageable pageable);

    @Query("""
            SELECT p FROM Product p
            WHERE (p.available = true OR p.stock > 0)
              AND LOWER(p.category) = LOWER(:category)
            ORDER BY p.createdAt DESC
            """)
    Page<Product> findListedMarketplaceProductsByCategory(@Param("category") String category, Pageable pageable);

    @Query("""
            SELECT p FROM Product p
            WHERE (p.available = true OR p.stock > 0)
              AND (
                    LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(p.category) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(p.businessPage.name) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(p.businessPage.description) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(p.businessPage.category) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(p.businessPage.owner.firstname) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(p.businessPage.owner.lastName) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(p.businessPage.owner.email) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(p.businessPage.owner.username) LIKE LOWER(CONCAT('%', :query, '%'))
              )
            ORDER BY p.createdAt DESC
            """)
    Page<Product> searchMarketplace(@Param("query") String query, Pageable pageable);

    @Query("""
            SELECT p FROM Product p
            WHERE (p.available = true OR p.stock > 0)
              AND LOWER(p.category) = LOWER(:category)
              AND (
                    LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(p.category) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(p.businessPage.name) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(p.businessPage.description) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(p.businessPage.category) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(p.businessPage.owner.firstname) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(p.businessPage.owner.lastName) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(p.businessPage.owner.email) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(p.businessPage.owner.username) LIKE LOWER(CONCAT('%', :query, '%'))
              )
            ORDER BY p.createdAt DESC
            """)
    Page<Product> searchMarketplaceByCategory(@Param("category") String category, @Param("query") String query, Pageable pageable);
}
