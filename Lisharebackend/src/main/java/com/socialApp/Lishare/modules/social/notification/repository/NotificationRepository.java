package com.socialApp.Lishare.modules.social.notification.repository;

import com.socialApp.Lishare.modules.social.notification.entity.Notification;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserUserIdOrderByCreatedAtDesc(Long userId);

    List<Notification> findByUserUserIdAndReadFalseOrderByCreatedAtDesc(Long userId);

    Page<Notification> findByUserUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Page<Notification> findByUserUserIdAndReadFalseOrderByCreatedAtDesc(Long userId, Pageable pageable);

    long countByUserUserIdAndReadFalse(Long userId);

    @Transactional
    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.user.userId = :userId")
    void markAllReadByUserId(@Param("userId") Long userId);

    @Transactional
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.user.userId = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);
}
