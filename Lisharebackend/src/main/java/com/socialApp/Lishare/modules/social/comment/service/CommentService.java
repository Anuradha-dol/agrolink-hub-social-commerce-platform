package com.socialApp.Lishare.modules.social.comment.service;

import com.socialApp.Lishare.modules.social.comment.entity.Comment;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface CommentService {
    Comment addComment(Long userId, Long postId, String content);
    Comment addComment(Long userId, Long postId, String content, MultipartFile mediaFile);
    Comment addReply(Long userId, Long postId, Long parentCommentId, String content);
    Comment addReply(Long userId, Long postId, Long parentCommentId, String content, MultipartFile mediaFile);
    Comment updateComment(Long userId, Long commentId, String content);
    void deleteComment(Long commentId);
    List<Comment> getCommentsByPost(Long postId);
    List<Comment> getAllCommentsByPost(Long postId);
    Long countCommentsByPost(Long postId);
    Optional<Comment> getCommentById(Long commentId);
    Comment reactToComment(Long userId, Long commentId, String type);
    Map<String, Long> getCommentReactionCounts(Long commentId);


}
