package com.socialApp.Lishare.modules.social.post.repository;

import com.socialApp.Lishare.modules.social.post.entity.Post;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Set;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    // Use 'user.userId' instead of 'user.id'
    List<Post> findByUser_UserIdInOrderByCreatedAtDesc(Set<Long> userIds);

    List<Post> findByUser(User user);

    @Transactional
    @Modifying
    @Query("DELETE FROM Post p WHERE p.user.userId = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);
}
