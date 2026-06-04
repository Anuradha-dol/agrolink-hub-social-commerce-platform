package com.socialApp.Lishare.modules.social.comment.controller;

import com.socialApp.Lishare.modules.social.comment.service.CommentService;
import com.socialApp.Lishare.modules.social.comment.dto.CommentRequest;
import com.socialApp.Lishare.modules.social.comment.dto.CommentResponse;
import com.socialApp.Lishare.modules.social.comment.entity.Comment;
import com.socialApp.Lishare.modules.social.comment.entity.CommentReaction;
import com.socialApp.Lishare.modules.social.comment.repository.CommentReactionRepository;
import com.socialApp.Lishare.modules.social.follow.repository.FollowRepository;
import com.socialApp.Lishare.modules.social.friend.dto.FriendStatus;
import com.socialApp.Lishare.modules.social.friend.entity.Friend;
import com.socialApp.Lishare.modules.social.friend.repository.FriendRepository;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;

import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;
    private final CommentReactionRepository commentReactionRepository;
    private final FriendRepository friendRepository;
    private final FollowRepository followRepository;

    // Add a main comment
    @PostMapping(value = "/{postId}/add", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommentResponse> addComment(
            @AuthenticationPrincipal User user,
            @PathVariable Long postId,
            @Valid @RequestBody CommentRequest request) {

        Comment comment = commentService.addComment(user.getUserId(), postId, request.getContent());

        CommentResponse response = mapToDTO(comment, user);

        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/{postId}/add", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CommentResponse> addCommentWithMedia(
            @AuthenticationPrincipal User user,
            @PathVariable Long postId,
            @RequestParam(value = "content", required = false) String content,
            @RequestPart(value = "media", required = false) MultipartFile media) {

        Comment comment = commentService.addComment(user.getUserId(), postId, content, media);
        return ResponseEntity.ok(mapToDTO(comment, user));
    }

    // Add a reply to a comment
    @PostMapping(value = "/{postId}/reply/{parentCommentId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CommentResponse> addReply(
            @AuthenticationPrincipal User user,
            @PathVariable Long postId,
            @PathVariable Long parentCommentId,
            @Valid @RequestBody CommentRequest request) {

        Comment reply = commentService.addReply(user.getUserId(), postId, parentCommentId, request.getContent());

        CommentResponse response = mapToDTO(reply, user);

        return ResponseEntity.ok(response);
    }

    @PostMapping(value = "/{postId}/reply/{parentCommentId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CommentResponse> addReplyWithMedia(
            @AuthenticationPrincipal User user,
            @PathVariable Long postId,
            @PathVariable Long parentCommentId,
            @RequestParam(value = "content", required = false) String content,
            @RequestPart(value = "media", required = false) MultipartFile media) {

        Comment reply = commentService.addReply(user.getUserId(), postId, parentCommentId, content, media);
        return ResponseEntity.ok(mapToDTO(reply, user));
    }

    // Update comment (only by owner)
    @PutMapping("/{commentId}/update")
    public ResponseEntity<CommentResponse> updateComment(
            @AuthenticationPrincipal User user,
            @PathVariable Long commentId,
            @Valid @RequestBody CommentRequest request) {

        Comment updated = commentService.updateComment(user.getUserId(), commentId, request.getContent());
        return ResponseEntity.ok(mapToDTO(updated, user));
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

    @PostMapping("/{commentId}/react")
    public ResponseEntity<CommentResponse> reactToComment(
            @AuthenticationPrincipal User user,
            @PathVariable Long commentId,
            @RequestParam String type) {

        Comment comment = commentService.reactToComment(user.getUserId(), commentId, type);
        return ResponseEntity.ok(mapToDTO(comment, user));
    }

    @GetMapping("/{commentId}/reactions")
    public ResponseEntity<Map<String, Long>> getCommentReactionCounts(@PathVariable Long commentId) {
        return ResponseEntity.ok(commentService.getCommentReactionCounts(commentId));
    }

    // Get all comments (with nested replies) for a post
    @GetMapping("/{postId}/all")
    public ResponseEntity<List<CommentResponse>> getComments(
            @AuthenticationPrincipal User user,
            @PathVariable Long postId) {
        List<Comment> comments = commentService.getAllCommentsByPost(postId);
        Map<Long, List<Comment>> childrenByParentId = buildChildrenByParentId(comments);

        // Convert each Comment entity to DTO recursively
        List<CommentResponse> responses = comments.stream()
                .filter(comment -> comment.getParentComment() == null)
                .sorted(Comparator.comparing(Comment::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(comment -> mapToDTO(comment, user, childrenByParentId))
                .toList();

        return ResponseEntity.ok(responses);
    }

    // Get total comment count for a post
    @GetMapping("/{postId}/count")
    public ResponseEntity<Long> getCommentCount(@PathVariable Long postId) {
        Long count = commentService.countCommentsByPost(postId);
        return ResponseEntity.ok(count);
    }

    private CommentResponse mapToDTO(Comment comment, User viewer) {
        return mapToDTO(comment, viewer, null);
    }

    private CommentResponse mapToDTO(Comment comment, User viewer, Map<Long, List<Comment>> childrenByParentId) {
        Comment parent = comment.getParentComment();
        List<Comment> childComments = childrenByParentId != null
                ? childrenByParentId.getOrDefault(comment.getCommentId(), List.of())
                : (comment.getReplies() != null ? comment.getReplies() : List.of());
        List<CommentResponse> replies = childComments.stream()
                .map(reply -> mapToDTO(reply, viewer, childrenByParentId))
                .toList();
        Map<String, Long> reactionCounts = commentService.getCommentReactionCounts(comment.getCommentId());
        long reactionCount = reactionCounts.values().stream().mapToLong(Long::longValue).sum();
        String viewerReaction = resolveViewerReaction(comment, viewer);

        return CommentResponse.builder()
                .commentId(comment.getCommentId())
                .content(comment.getContent())
                .authorId(comment.getUser().getUserId())
                .authorName(displayName(comment.getUser()))
                .authorProfileImageUrl(comment.getUser().getImageUrl())
                .parentCommentId(parent != null ? parent.getCommentId() : null)
                .parentAuthorName(parent != null ? displayName(parent.getUser()) : null)
                .mediaUrl(comment.getMediaUrl())
                .mediaType(comment.getMediaType())
                // Convert Date -> LocalDateTime
                .createdAt(comment.getCreatedAt().toInstant()
                        .atZone(ZoneId.systemDefault())
                        .toLocalDateTime())
                .replyCount(replies.size())
                .reactionCounts(reactionCounts)
                .reactionCount(reactionCount)
                .viewerReaction(viewerReaction)
                .relationshipLabel(resolveRelationshipLabel(viewer, comment.getUser()))
                .replies(replies)
                .build();
    }

    private Map<Long, List<Comment>> buildChildrenByParentId(List<Comment> comments) {
        Map<Long, List<Comment>> childrenByParentId = new HashMap<>();
        for (Comment comment : comments) {
            Comment parent = comment.getParentComment();
            if (parent == null || parent.getCommentId() == null) {
                continue;
            }
            childrenByParentId.computeIfAbsent(parent.getCommentId(), ignored -> new ArrayList<>()).add(comment);
        }
        childrenByParentId.values().forEach(children -> children.sort(
                Comparator.comparing(Comment::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder()))
        ));
        return childrenByParentId;
    }

    private String resolveViewerReaction(Comment comment, User viewer) {
        if (comment == null || viewer == null || viewer.getUserId() == null) {
            return null;
        }
        return commentReactionRepository.findByUserAndComment(viewer, comment)
                .map(CommentReaction::getType)
                .orElse(null);
    }

    private String resolveRelationshipLabel(User viewer, User author) {
        if (viewer == null || author == null || viewer.getUserId() == null || author.getUserId() == null) {
            return "Member";
        }
        if (viewer.getUserId().equals(author.getUserId())) {
            return "You";
        }

        boolean friends = friendRepository.findFriendship(viewer, author)
                .map(Friend::getStatus)
                .filter(FriendStatus.ACCEPTED::equals)
                .isPresent();
        if (friends) {
            return "Friend";
        }

        boolean viewerFollowsAuthor = followRepository.existsByFollowerUserIdAndFollowingUserId(
                viewer.getUserId(),
                author.getUserId()
        );
        boolean authorFollowsViewer = followRepository.existsByFollowerUserIdAndFollowingUserId(
                author.getUserId(),
                viewer.getUserId()
        );

        if (viewerFollowsAuthor && authorFollowsViewer) {
            return "Mutual follow";
        }
        if (viewerFollowsAuthor) {
            return "Following";
        }
        if (authorFollowsViewer) {
            return "Follower";
        }
        return "Member";
    }

    private String displayName(User user) {
        if (user == null) {
            return "Unknown";
        }
        String name = ((user.getFirstname() == null ? "" : user.getFirstname()) + " "
                + (user.getLastName() == null ? "" : user.getLastName())).trim();
        return name.isBlank() ? "Unknown" : name;
    }
}
