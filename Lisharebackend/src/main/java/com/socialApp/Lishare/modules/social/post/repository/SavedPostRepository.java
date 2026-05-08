package com.socialApp.Lishare.modules.social.post.repository;

import com.socialApp.Lishare.modules.social.post.entity.SavedPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SavedPostRepository extends JpaRepository<SavedPost, Long> {

    Optional<SavedPost> findByUserUserIdAndPostPostId(Long userId, Long postId);

    Page<SavedPost> findByUserUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}
