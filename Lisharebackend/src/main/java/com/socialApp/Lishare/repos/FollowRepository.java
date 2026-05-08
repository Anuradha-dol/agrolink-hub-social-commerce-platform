package com.socialApp.Lishare.repos;

import com.socialApp.Lishare.entities.Follow;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FollowRepository extends JpaRepository<Follow, Long> {

    boolean existsByFollowerUserIdAndFollowingUserId(Long followerId, Long followingId);

    Optional<Follow> findByFollowerUserIdAndFollowingUserId(Long followerId, Long followingId);

    List<Follow> findByFollowerUserIdOrderByFollowedAtDesc(Long followerId);

    List<Follow> findByFollowingUserIdOrderByFollowedAtDesc(Long followingId);

    long countByFollowerUserId(Long followerId);

    long countByFollowingUserId(Long followingId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Follow f WHERE f.follower.userId = :userId OR f.following.userId = :userId")
    void deleteAllUserFollows(@Param("userId") Long userId);
}
