package com.socialApp.Lishare.modules.social.comment.service;

import com.socialApp.Lishare.modules.social.comment.entity.Comment;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CommentService {
    Comment addComment(Long userId, Long postId, String content);
    Comment addReply(Long userId, Long postId, Long parentCommentId, String content);
    Comment updateComment(Long userId, Long commentId, String content);
    void deleteComment(Long commentId);
    List<Comment> getCommentsByPost(Long postId);
    Long countCommentsByPost(Long postId);
    Optional<Comment> getCommentById(Long commentId);


}
