package com.socialApp.Lishare.modules.social.comment.repository;

import com.socialApp.Lishare.modules.social.comment.entity.Comment;
import com.socialApp.Lishare.modules.social.post.entity.Post;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    // Fetch top-level comments for a post
    List<Comment> findByPostAndParentCommentIsNull(Post post);

    // Count all comments including replies
    Long countByPost(Post post);

    @Query("SELECT DISTINCT c FROM Comment c " +
            "LEFT JOIN FETCH c.replies r " +
            "WHERE c.post.postId = :postId AND c.parentComment IS NULL " +
            "ORDER BY c.createdAt DESC")
    List<Comment> findTopLevelCommentsWithReplies(@Param("postId") Long postId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Comment c WHERE c.user.userId = :userId OR c.parentComment.user.userId = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Comment c WHERE c.post.postId = :postId AND c.parentComment IS NOT NULL")
    void deleteRepliesByPostId(@Param("postId") Long postId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Comment c WHERE c.post.postId = :postId AND c.parentComment IS NULL")
    void deleteTopLevelByPostId(@Param("postId") Long postId);
}
