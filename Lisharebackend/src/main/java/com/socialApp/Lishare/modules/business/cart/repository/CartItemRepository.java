package com.socialApp.Lishare.modules.business.cart.repository;

import com.socialApp.Lishare.modules.business.cart.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    List<CartItem> findByUserUserIdOrderByCreatedAtDesc(Long userId);
    Optional<CartItem> findByUserUserIdAndProductId(Long userId, Long productId);
    Optional<CartItem> findByIdAndUserUserId(Long id, Long userId);
    void deleteByUserUserId(Long userId);
}
