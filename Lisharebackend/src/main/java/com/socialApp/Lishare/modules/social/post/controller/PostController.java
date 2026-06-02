package com.socialApp.Lishare.modules.social.post.controller;

import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.social.post.dto.PostResponse;
import com.socialApp.Lishare.modules.social.post.entity.Post;
import com.socialApp.Lishare.modules.social.post.service.PostService;
import com.socialApp.Lishare.modules.social.post.support.PostXpPolicy;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @PostMapping("/create")
    public ResponseEntity<PostResponse> createPost(
            @AuthenticationPrincipal User user,
            @RequestParam(value = "content", required = false, defaultValue = "") String content,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "category", required = false) String category
    ) {
        if (user == null) {
            return ResponseEntity.status(401).body(null);
        }
        if (content.isBlank() && (image == null || image.isEmpty())) {
            return ResponseEntity.badRequest().body(null);
        }

        Post post = postService.createPost(user.getUserId(), content, image, category);
        return ResponseEntity.ok(toResponse(post));
    }

    @PutMapping("/update/{postId}")
    public ResponseEntity<PostResponse> updatePost(
            @AuthenticationPrincipal User user,
            @PathVariable Long postId,
            @RequestParam(value = "content", required = false) String content,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "removeMedia", required = false, defaultValue = "false") boolean removeMedia
    ) {
        if (user == null) {
            return ResponseEntity.status(401).body(null);
        }
        Post post = postService.updatePost(user.getUserId(), postId, content, image, removeMedia);
        return ResponseEntity.ok(toResponse(post));
    }

    @PostMapping("/{postId}/reel-view")
    public ResponseEntity<Long> incrementReelView(@PathVariable Long postId) {
        return ResponseEntity.ok(postService.incrementReelView(postId));
    }

    @DeleteMapping("/delete/{postId}")
    public ResponseEntity<String> deletePost(
            @AuthenticationPrincipal User user,
            @PathVariable Long postId
    ) {
        if (user == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Post post = postService.getPostById(postId);
        if (!post.getUser().getUserId().equals(user.getUserId())) {
            return ResponseEntity.status(403).body("Cannot delete others' posts");
        }

        postService.deletePost(postId);
        return ResponseEntity.ok("Post deleted successfully");
    }

    @GetMapping("/my")
    public ResponseEntity<List<PostResponse>> getMyPosts(@AuthenticationPrincipal User user) {
        List<Post> posts = postService.getPostsByUser(user.getUserId());
        List<PostResponse> responses = posts.stream().map(this::toResponse).toList();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/feed")
    public ResponseEntity<List<PostResponse>> getFeedPosts(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(null);
        }
        List<Post> feedPosts = postService.getFeedPosts(user.getUserId());
        List<PostResponse> responses = feedPosts.stream().map(this::toResponse).toList();
        return ResponseEntity.ok(responses);
    }

    private PostResponse toResponse(Post post) {
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
}
