package com.socialApp.Lishare.modules.business.page.repository;

import com.socialApp.Lishare.modules.business.page.entity.BusinessPage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BusinessPageRepository extends JpaRepository<BusinessPage, Long> {
    Page<BusinessPage> findByActiveTrue(Pageable pageable);
    Page<BusinessPage> findByActiveTrueAndNameContainingIgnoreCase(String name, Pageable pageable);
    Page<BusinessPage> findByOwnerUserId(Long ownerId, Pageable pageable);

    @Query("""
            SELECT p FROM BusinessPage p
            WHERE p.active = true
              AND (
                    :query IS NULL
                    OR LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(p.category) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(p.owner.firstname) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(p.owner.lastName) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(p.owner.email) LIKE LOWER(CONCAT('%', :query, '%'))
                    OR LOWER(p.owner.username) LIKE LOWER(CONCAT('%', :query, '%'))
              )
            ORDER BY p.createdAt DESC
            """)
    Page<BusinessPage> searchPublicPages(@Param("query") String query, Pageable pageable);
}
