package com.socialApp.Lishare.Service.interfaces;

import com.socialApp.Lishare.entities.Comment;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CommentService {
    Comment addComment(Long userId, Long postId, String content);
    Comment addReply(Long userId, Long postId, Long parentCommentId, String content);
    void deleteComment(Long commentId);
    List<Comment> getCommentsByPost(Long postId);
    Long countCommentsByPost(Long postId);
    Optional<Comment> getCommentById(Long commentId);


}
