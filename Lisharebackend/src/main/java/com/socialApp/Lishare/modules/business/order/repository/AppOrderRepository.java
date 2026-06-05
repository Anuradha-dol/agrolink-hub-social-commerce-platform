package com.socialApp.Lishare.modules.business.order.repository;

import com.socialApp.Lishare.modules.business.order.entity.AppOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface AppOrderRepository extends JpaRepository<AppOrder, Long> {
    @Query("SELECT o FROM AppOrder o WHERE o.buyer.userId = :buyerId ORDER BY o.createdAt DESC")
    Page<AppOrder> findBuyerOrders(@Param("buyerId") Long buyerId, Pageable pageable);

    @Query("SELECT o FROM AppOrder o WHERE o.seller.userId = :sellerId ORDER BY o.createdAt DESC")
    Page<AppOrder> findSellerOrders(@Param("sellerId") Long sellerId, Pageable pageable);

    @Query("SELECT o FROM AppOrder o WHERE o.id = :orderId AND o.buyer.userId = :buyerId")
    Optional<AppOrder> findByIdForBuyer(@Param("orderId") Long orderId, @Param("buyerId") Long buyerId);

    @Query("SELECT o FROM AppOrder o WHERE o.id = :orderId AND o.seller.userId = :sellerId")
    Optional<AppOrder> findByIdForSeller(@Param("orderId") Long orderId, @Param("sellerId") Long sellerId);

    boolean existsByProductId(Long productId);

    boolean existsByBuyerUserIdAndProductBusinessPageId(Long buyerId, Long businessPageId);
}
