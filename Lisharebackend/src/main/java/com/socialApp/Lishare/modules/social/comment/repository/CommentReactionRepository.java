package com.socialApp.Lishare.modules.social.comment.repository;

import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.social.comment.entity.Comment;
import com.socialApp.Lishare.modules.social.comment.entity.CommentReaction;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommentReactionRepository extends JpaRepository<CommentReaction, Long> {

    Optional<CommentReaction> findByUserAndComment(User user, Comment comment);

    long countByComment(Comment comment);

    @Query("SELECT r.type, COUNT(r) FROM CommentReaction r WHERE r.comment.commentId = :commentId GROUP BY r.type")
    List<Object[]> countTypesByCommentId(@Param("commentId") Long commentId);

    @Modifying
    @Transactional
    @Query("DELETE FROM CommentReaction r WHERE r.user.userId = :userId")
    void deleteAllByUserId(@Param("userId") Long userId);
}
