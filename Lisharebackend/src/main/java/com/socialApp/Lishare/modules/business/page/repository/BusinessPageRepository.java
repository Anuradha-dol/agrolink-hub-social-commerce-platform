package com.socialApp.Lishare.modules.business.page.repository;

import com.socialApp.Lishare.modules.business.page.entity.BusinessPage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BusinessPageRepository extends JpaRepository<BusinessPage, Long> {
    Page<BusinessPage> findByActiveTrue(Pageable pageable);
    Page<BusinessPage> findByOwnerUserId(Long ownerId, Pageable pageable);
}
