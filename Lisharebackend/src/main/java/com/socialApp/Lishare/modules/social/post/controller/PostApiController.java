package com.socialApp.Lishare.modules.social.post.controller;

import com.socialApp.Lishare.modules.social.comment.service.CommentService;
import com.socialApp.Lishare.modules.social.post.service.PostService;
import com.socialApp.Lishare.modules.platform.common.response.ApiResponse;
import com.socialApp.Lishare.modules.social.comment.dto.CommentRequest;
import com.socialApp.Lishare.modules.social.comment.dto.CommentResponse;
import com.socialApp.Lishare.modules.social.post.dto.PostResponse;
import com.socialApp.Lishare.modules.social.comment.entity.Comment;
import com.socialApp.Lishare.modules.social.post.entity.Post;
import com.socialApp.Lishare.modules.social.post.support.PostXpPolicy;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.ZoneId;
import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostApiController {

    private final PostService postService;
    private final CommentService commentService;

    @PostMapping
    public ResponseEntity<ApiResponse<PostResponse>> createPost(
            @AuthenticationPrincipal User user,
            @RequestParam(value = "content", required = false, defaultValue = "") String content,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "category", required = false) String category
    ) {
        if (content.isBlank() && (image == null || image.isEmpty())) {
            throw new IllegalArgumentException("Post content or image is required");
        }

        Post post = postService.createPost(user.getUserId(), content, image, category);
        return ResponseEntity.ok(ApiResponse.success("Post created", toPostResponse(post)));
    }

    @PutMapping("/{postId}")
    public ResponseEntity<ApiResponse<PostResponse>> updatePost(
            @AuthenticationPrincipal User user,
            @PathVariable Long postId,
            @RequestParam(value = "content", required = false) String content,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "removeMedia", required = false, defaultValue = "false") boolean removeMedia
    ) {
        Post post = postService.updatePost(user.getUserId(), postId, content, image, removeMedia);
        return ResponseEntity.ok(ApiResponse.success("Post updated", toPostResponse(post)));
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<ApiResponse<Void>> deletePost(
            @AuthenticationPrincipal User user,
            @PathVariable Long postId
    ) {
        Post post = postService.getPostById(postId);
        if (!post.getUser().getUserId().equals(user.getUserId())) {
            throw new RuntimeException("Cannot delete others' posts");
        }
        postService.deletePost(postId);
        return ResponseEntity.ok(ApiResponse.success("Post deleted", null));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<Page<PostResponse>>> myPosts(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        List<PostResponse> posts = postService.getPostsByUser(user.getUserId()).stream()
                .map(this::toPostResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success("My posts fetched", paginate(posts, page, size)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<PostResponse>>> feed(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        List<PostResponse> feed = postService.getFeedPosts(user.getUserId()).stream()
                .map(this::toPostResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success("Feed posts fetched", paginate(feed, page, size)));
    }

    @GetMapping("/reels")
    public ResponseEntity<ApiResponse<Page<PostResponse>>> reels(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        List<PostResponse> reels = postService.getFeedPosts(user.getUserId()).stream()
                .filter(post -> "VIDEO".equalsIgnoreCase(post.getMediaType()))
                .map(this::toPostResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success("Reels fetched", paginate(reels, page, size)));
    }

    @PostMapping("/{postId}/reel-view")
    public ResponseEntity<ApiResponse<Long>> markReelView(@PathVariable Long postId) {
        long viewCount = postService.incrementReelView(postId);
        return ResponseEntity.ok(ApiResponse.success("Reel view counted", viewCount));
    }

    @GetMapping("/{postId}/comments")
    public ResponseEntity<ApiResponse<Page<CommentResponse>>> listComments(
            @PathVariable Long postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        List<CommentResponse> comments = commentService.getCommentsByPost(postId).stream()
                .map(this::mapComment)
                .toList();
        return ResponseEntity.ok(ApiResponse.success("Comments fetched", paginate(comments, page, size)));
    }

    @PostMapping("/{postId}/comments")
    public ResponseEntity<ApiResponse<CommentResponse>> addComment(
            @AuthenticationPrincipal User user,
            @PathVariable Long postId,
            @Valid @RequestBody CommentRequest request
    ) {
        Comment comment = commentService.addComment(user.getUserId(), postId, request.getContent());
        return ResponseEntity.ok(ApiResponse.success("Comment added", mapComment(comment)));
    }

    @DeleteMapping("/{postId}/comments/{commentId}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @AuthenticationPrincipal User user,
            @PathVariable Long postId,
            @PathVariable Long commentId
    ) {
        Comment comment = commentService.getCommentById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        if (!comment.getPost().getPostId().equals(postId)) {
            throw new RuntimeException("Comment does not belong to this post");
        }
        if (!comment.getUser().getUserId().equals(user.getUserId())) {
            throw new RuntimeException("Cannot delete others' comments");
        }

        commentService.deleteComment(commentId);
        return ResponseEntity.ok(ApiResponse.success("Comment deleted", null));
    }

    private PostResponse toPostResponse(Post post) {
        return PostResponse.builder()
                .postId(post.getPostId())
                .authorId(post.getUser().getUserId())
                .content(post.getContent())
                .imageUrl(post.getImageUrl())
                .mediaType(post.getMediaType())
                .category(resolvePostCategory(post))
                .xpAwarded(resolvePostXp(post))
                .authorVerifiedXp(calculateVerifiedXp(post.getUser()))
                .reelViewCount(post.getReelViewCount())
                .authorName(post.getUser().getFirstname() + " " + post.getUser().getLastName())
                .createdAt(post.getCreatedAt())
                .editedAt(post.getEditedAt())
                .build();
    }

    private long calculateVerifiedXp(User user) {
        return postService.getPostsByUser(user.getUserId()).stream()
                .mapToLong(this::resolvePostXp)
                .sum();
    }

    private int resolvePostXp(Post post) {
        if (post.getXpAwarded() != null && post.getXpAwarded() > 0) {
            return post.getXpAwarded();
        }
        return PostXpPolicy.xpForCategory(post.getCategory());
    }

    private String resolvePostCategory(Post post) {
        return post.getCategory() == null || post.getCategory().isBlank() ? "GENERAL" : post.getCategory();
    }

    private CommentResponse mapComment(Comment comment) {
        return CommentResponse.builder()
                .commentId(comment.getCommentId())
                .content(comment.getContent())
                .authorName(comment.getUser().getFirstname() + " " + comment.getUser().getLastName())
                .createdAt(comment.getCreatedAt().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime())
                .replies(comment.getReplies() != null ? comment.getReplies().stream().map(this::mapComment).toList() : List.of())
                .build();
    }

    private <T> Page<T> paginate(List<T> list, int page, int size) {
        if (size <= 0) {
            throw new IllegalArgumentException("Size must be greater than 0");
        }
        int start = page * size;
        if (start >= list.size()) {
            return new PageImpl<>(List.of(), PageRequest.of(page, size), list.size());
        }
        int end = Math.min(start + size, list.size());
        return new PageImpl<>(list.subList(start, end), PageRequest.of(page, size), list.size());
    }
}
