package com.socialApp.Lishare.controller;

import com.socialApp.Lishare.Service.interfaces.PostService;
import com.socialApp.Lishare.dtos.postdTOs.PostResponse;
import com.socialApp.Lishare.entities.Post;
import com.socialApp.Lishare.entities.User;
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
            @RequestParam(value = "image", required = false) MultipartFile image) {

        if (user == null) {
            return ResponseEntity.status(401).body(null);
        }

        if (content.isBlank() && (image == null || image.isEmpty())) {
            return ResponseEntity.badRequest().body(null);
        }

        Post post = postService.createPost(user.getUserId(), content, image);

        PostResponse response = PostResponse.builder()
                .postId(post.getPostId())
                .content(post.getContent())
                .imageUrl(post.getImageUrl())
                .authorName(post.getUser().getFirstname() + " " + post.getUser().getLastName())
                .createdAt(post.getCreatedAt())
                .build();

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/delete/{postId}")
    public ResponseEntity<String> deletePost(
            @AuthenticationPrincipal User user,
            @PathVariable Long postId) {

        if (user == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Post post = postService.getPostById(postId);

        if (!post.getUser().getUserId().equals(user.getUserId())) {
            return ResponseEntity.status(403).body("Cannot delete others' posts");
        }

        try {
            // delete post (cascade removes comments/likes/shares)
            postService.deletePost(postId);
            return ResponseEntity.ok("Post deleted successfully");
        } catch (Exception e) {
            e.printStackTrace(); // see exact DB error
            return ResponseEntity.badRequest().body("Cannot delete post: " + e.getMessage());
        }
    }

    @GetMapping("/my")
    public ResponseEntity<List<PostResponse>> getMyPosts(@AuthenticationPrincipal User user) {
        List<Post> posts = postService.getPostsByUser(user.getUserId());

        List<PostResponse> responses = posts.stream()
                .map(p -> PostResponse.builder()
                        .postId(p.getPostId())
                        .content(p.getContent())
                        .imageUrl(p.getImageUrl())
                        .authorName(p.getUser().getFirstname() + " " + p.getUser().getLastName())
                        .createdAt(p.getCreatedAt())
                        .build())
                .toList();

        return ResponseEntity.ok(responses);
    }



    @GetMapping("/feed")
    public ResponseEntity<List<PostResponse>> getFeedPosts(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(null);
        }

        // Call service method to get feed posts
        List<Post> feedPosts = postService.getFeedPosts(user.getUserId());

        List<PostResponse> responses = feedPosts.stream()
                .map(p -> PostResponse.builder()
                        .postId(p.getPostId())
                        .content(p.getContent())
                        .imageUrl(p.getImageUrl())
                        .authorName(p.getUser().getFirstname() + " " + p.getUser().getLastName())
                        .createdAt(p.getCreatedAt())
                        .build())
                .toList();

        return ResponseEntity.ok(responses);
    }
}