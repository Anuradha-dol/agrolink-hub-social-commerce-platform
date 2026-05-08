package com.socialApp.Lishare.controller;

import com.socialApp.Lishare.Service.interfaces.CommentService;
import com.socialApp.Lishare.dtos.postdTOs.CommentRequest;
import com.socialApp.Lishare.dtos.postdTOs.CommentResponse;
import com.socialApp.Lishare.entities.Comment;
import com.socialApp.Lishare.entities.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.ZoneId;
import java.util.List;

@RestController
@RequestMapping("/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    // Add a main comment
    @PostMapping("/{postId}/add")
    public ResponseEntity<CommentResponse> addComment(
            @AuthenticationPrincipal User user,
            @PathVariable Long postId,
            @RequestBody CommentRequest request) {

        Comment comment = commentService.addComment(user.getUserId(), postId, request.getContent());

        CommentResponse response = mapToDTO(comment);

        return ResponseEntity.ok(response);
    }

    // Add a reply to a comment
    @PostMapping("/{postId}/reply/{parentCommentId}")
    public ResponseEntity<CommentResponse> addReply(
            @AuthenticationPrincipal User user,
            @PathVariable Long postId,
            @PathVariable Long parentCommentId,
            @RequestBody CommentRequest request) {

        Comment reply = commentService.addReply(user.getUserId(), postId, parentCommentId, request.getContent());

        CommentResponse response = mapToDTO(reply);

        return ResponseEntity.ok(response);
    }

    // Delete comment (only by owner)
    @DeleteMapping("/{commentId}/delete")
    public ResponseEntity<String> deleteComment(
            @AuthenticationPrincipal User user,
            @PathVariable Long commentId) {

        Comment comment = commentService.getCommentById(commentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Comment not found"));

        if (!comment.getUser().getUserId().equals(user.getUserId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Cannot delete others' comments");
        }

        commentService.deleteComment(commentId);
        return ResponseEntity.ok("Comment deleted successfully");
    }

    // Get all comments (with nested replies) for a post
    @GetMapping("/{postId}/all")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable Long postId) {
        List<Comment> comments = commentService.getCommentsByPost(postId);

        // Convert each Comment entity to DTO recursively
        List<CommentResponse> responses = comments.stream()
                .map(this::mapToDTO)
                .toList();

        return ResponseEntity.ok(responses);
    }

    // Get total comment count for a post
    @GetMapping("/{postId}/count")
    public ResponseEntity<Long> getCommentCount(@PathVariable Long postId) {
        Long count = commentService.countCommentsByPost(postId);
        return ResponseEntity.ok(count);
    }

    private CommentResponse mapToDTO(Comment comment) {
        return CommentResponse.builder()
                .commentId(comment.getCommentId())
                .content(comment.getContent())
                .authorName(comment.getUser().getFirstname() + " " + comment.getUser().getLastName())
                // Convert Date -> LocalDateTime
                .createdAt(comment.getCreatedAt().toInstant()
                        .atZone(ZoneId.systemDefault())
                        .toLocalDateTime())
                .replies(comment.getReplies() != null ?
                        comment.getReplies().stream().map(this::mapToDTO).toList()
                        : List.of())
                .build();
    }
}