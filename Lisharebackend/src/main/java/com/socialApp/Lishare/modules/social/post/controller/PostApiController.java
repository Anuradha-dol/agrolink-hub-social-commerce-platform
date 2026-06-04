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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostApiController {

    private static final Pattern HASHTAG_PATTERN = Pattern.compile("#[A-Za-z0-9_]+");

    private final PostService postService;
    private final CommentService commentService;

    @PostMapping
    public ResponseEntity<ApiResponse<PostResponse>> createPost(
            @AuthenticationPrincipal User user,
            @RequestParam(value = "content", required = false, defaultValue = "") String content,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "feeling", required = false) String feeling,
            @RequestParam(value = "locationName", required = false) String locationName,
            @RequestParam(value = "pollQuestion", required = false) String pollQuestion,
            @RequestParam(value = "pollOptions", required = false) String pollOptions
    ) {
        if (content.isBlank() && (image == null || image.isEmpty()) && (pollQuestion == null || pollQuestion.isBlank())) {
            throw new IllegalArgumentException("Post content or image is required");
        }

        Post post = postService.createPost(user.getUserId(), content, image, category, feeling, locationName, pollQuestion, pollOptions);
        return ResponseEntity.ok(ApiResponse.success("Post created", toPostResponse(post, user.getUserId())));
    }

    @PutMapping("/{postId}")
    public ResponseEntity<ApiResponse<PostResponse>> updatePost(
            @AuthenticationPrincipal User user,
            @PathVariable Long postId,
            @RequestParam(value = "content", required = false) String content,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "removeMedia", required = false, defaultValue = "false") boolean removeMedia,
            @RequestParam(value = "feeling", required = false) String feeling,
            @RequestParam(value = "locationName", required = false) String locationName,
            @RequestParam(value = "pollQuestion", required = false) String pollQuestion,
            @RequestParam(value = "pollOptions", required = false) String pollOptions
    ) {
        Post post = postService.updatePost(user.getUserId(), postId, content, image, removeMedia, feeling, locationName, pollQuestion, pollOptions);
        return ResponseEntity.ok(ApiResponse.success("Post updated", toPostResponse(post, user.getUserId())));
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
                .map(post -> toPostResponse(post, user.getUserId()))
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
                .map(post -> toPostResponse(post, user.getUserId()))
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
                .map(post -> toPostResponse(post, user.getUserId()))
                .toList();
        return ResponseEntity.ok(ApiResponse.success("Reels fetched", paginate(reels, page, size)));
    }

    @PostMapping("/{postId}/reel-view")
    public ResponseEntity<ApiResponse<Long>> markReelView(@PathVariable Long postId) {
        long viewCount = postService.incrementReelView(postId);
        return ResponseEntity.ok(ApiResponse.success("Reel view counted", viewCount));
    }

    @PostMapping("/{postId}/poll/vote")
    public ResponseEntity<ApiResponse<PostResponse>> votePoll(
            @AuthenticationPrincipal User user,
            @PathVariable Long postId,
            @RequestParam Integer optionIndex
    ) {
        Post post = postService.votePoll(user.getUserId(), postId, optionIndex);
        return ResponseEntity.ok(ApiResponse.success("Poll vote saved", toPostResponse(post, user.getUserId())));
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
        return toPostResponse(post, null);
    }

    private PostResponse toPostResponse(Post post, Long viewerUserId) {
        List<Long> pollVotes = postService.getPollVotes(post);
        long pollTotalVotes = pollVotes.stream().mapToLong(Long::longValue).sum();
        return PostResponse.builder()
                .postId(post.getPostId())
                .authorId(post.getUser().getUserId())
                .content(post.getContent())
                .hashtags(extractHashtags(post.getContent()))
                .imageUrl(post.getImageUrl())
                .mediaType(post.getMediaType())
                .category(resolvePostCategory(post))
                .feeling(post.getFeeling())
                .locationName(post.getLocationName())
                .pollQuestion(post.getPollQuestion())
                .pollOptions(postService.getPollOptions(post))
                .pollVotes(pollVotes)
                .pollTotalVotes(pollTotalVotes)
                .viewerPollOptionIndex(postService.getViewerPollOptionIndex(post, viewerUserId))
                .xpAwarded(resolvePostXp(post))
                .authorVerifiedXp(calculateVerifiedXp(post.getUser()))
                .reelViewCount(post.getReelViewCount())
                .authorName(post.getUser().getFirstname() + " " + post.getUser().getLastName())
                .authorProfileImageUrl(post.getUser().getImageUrl())
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

    private List<String> extractHashtags(String content) {
        if (content == null || content.isBlank()) {
            return List.of();
        }
        Matcher matcher = HASHTAG_PATTERN.matcher(content);
        return matcher.results()
                .map(match -> match.group().toLowerCase())
                .distinct()
                .toList();
    }
}
