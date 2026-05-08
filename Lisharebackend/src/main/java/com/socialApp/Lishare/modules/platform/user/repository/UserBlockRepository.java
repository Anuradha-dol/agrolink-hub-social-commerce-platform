package com.socialApp.Lishare.modules.platform.user.repository;

import com.socialApp.Lishare.modules.platform.user.entity.UserBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserBlockRepository extends JpaRepository<UserBlock, Long> {

    boolean existsByBlockerUserIdAndBlockedUserId(Long blockerId, Long blockedId);

    Optional<UserBlock> findByBlockerUserIdAndBlockedUserId(Long blockerId, Long blockedId);

    List<UserBlock> findByBlockerUserId(Long blockerId);

    @Query("""
        SELECT CASE WHEN COUNT(ub) > 0 THEN true ELSE false END
        FROM UserBlock ub
        WHERE (ub.blocker.userId = :firstUserId AND ub.blocked.userId = :secondUserId)
           OR (ub.blocker.userId = :secondUserId AND ub.blocked.userId = :firstUserId)
    """)
    boolean hasBlockBetween(@Param("firstUserId") Long firstUserId, @Param("secondUserId") Long secondUserId);
}
