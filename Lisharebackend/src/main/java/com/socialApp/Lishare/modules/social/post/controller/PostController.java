package com.socialApp.Lishare.modules.social.post.controller;

import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.social.post.dto.PollVoterResponse;
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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/posts")
@RequiredArgsConstructor
public class PostController {

    private static final Pattern HASHTAG_PATTERN = Pattern.compile("#[A-Za-z0-9_]+");

    private final PostService postService;

    @PostMapping("/create")
    public ResponseEntity<PostResponse> createPost(
            @AuthenticationPrincipal User user,
            @RequestParam(value = "content", required = false, defaultValue = "") String content,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "feeling", required = false) String feeling,
            @RequestParam(value = "locationName", required = false) String locationName,
            @RequestParam(value = "pollQuestion", required = false) String pollQuestion,
            @RequestParam(value = "pollOptions", required = false) String pollOptions,
            @RequestParam(value = "audience", required = false) String audience
    ) {
        if (user == null) {
            return ResponseEntity.status(401).body(null);
        }
        if (content.isBlank() && noMedia(image) && (pollQuestion == null || pollQuestion.isBlank())) {
            return ResponseEntity.badRequest().body(null);
        }

        Post post = postService.createPost(user.getUserId(), content, image, List.of(), category, feeling, locationName, pollQuestion, pollOptions, audience);
        return ResponseEntity.ok(toResponse(post, user.getUserId()));
    }

    @PutMapping("/update/{postId}")
    public ResponseEntity<PostResponse> updatePost(
            @AuthenticationPrincipal User user,
            @PathVariable Long postId,
            @RequestParam(value = "content", required = false) String content,
            @RequestParam(value = "image", required = false) MultipartFile image,
            @RequestParam(value = "removeMedia", required = false, defaultValue = "false") boolean removeMedia,
            @RequestParam(value = "feeling", required = false) String feeling,
            @RequestParam(value = "locationName", required = false) String locationName,
            @RequestParam(value = "pollQuestion", required = false) String pollQuestion,
            @RequestParam(value = "pollOptions", required = false) String pollOptions,
            @RequestParam(value = "audience", required = false) String audience
    ) {
        if (user == null) {
            return ResponseEntity.status(401).body(null);
        }
        Post post = postService.updatePost(user.getUserId(), postId, content, image, List.of(), removeMedia, feeling, locationName, pollQuestion, pollOptions, audience);
        return ResponseEntity.ok(toResponse(post, user.getUserId()));
    }

    @PostMapping("/{postId}/reel-view")
    public ResponseEntity<Long> incrementReelView(@PathVariable Long postId) {
        return ResponseEntity.ok(postService.incrementReelView(postId));
    }

    @PostMapping("/{postId}/poll/vote")
    public ResponseEntity<PostResponse> votePoll(
            @AuthenticationPrincipal User user,
            @PathVariable Long postId,
            @RequestParam Integer optionIndex
    ) {
        if (user == null) {
            return ResponseEntity.status(401).body(null);
        }
        Post post = postService.votePoll(user.getUserId(), postId, optionIndex);
        return ResponseEntity.ok(toResponse(post, user.getUserId()));
    }

    @GetMapping("/{postId}/poll/voters")
    public ResponseEntity<List<PollVoterResponse>> pollVoters(
            @AuthenticationPrincipal User user,
            @PathVariable Long postId
    ) {
        if (user == null) {
            return ResponseEntity.status(401).body(null);
        }
        Post post = postService.getPostById(postId);
        return ResponseEntity.ok(postService.getPollVoters(post));
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
        List<PostResponse> responses = posts.stream().map(post -> toResponse(post, user.getUserId())).toList();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/feed")
    public ResponseEntity<List<PostResponse>> getFeedPosts(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(null);
        }
        List<Post> feedPosts = postService.getFeedPosts(user.getUserId());
        List<PostResponse> responses = feedPosts.stream().map(post -> toResponse(post, user.getUserId())).toList();
        return ResponseEntity.ok(responses);
    }

    private PostResponse toResponse(Post post) {
        return toResponse(post, null);
    }

    private PostResponse toResponse(Post post, Long viewerUserId) {
        List<Long> pollVotes = postService.getPollVotes(post);
        long pollTotalVotes = pollVotes.stream().mapToLong(Long::longValue).sum();
        return PostResponse.builder()
                .postId(post.getPostId())
                .authorId(post.getUser().getUserId())
                .content(post.getContent())
                .hashtags(extractHashtags(post.getContent()))
                .imageUrl(post.getImageUrl())
                .mediaType(post.getMediaType())
                .mediaUrls(postService.getMediaUrls(post))
                .mediaTypes(postService.getMediaTypes(post))
                .category(resolvePostCategory(post))
                .audience(post.getAudience())
                .feeling(post.getFeeling())
                .locationName(post.getLocationName())
                .pollQuestion(post.getPollQuestion())
                .pollOptions(postService.getPollOptions(post))
                .pollVotes(pollVotes)
                .pollTotalVotes(pollTotalVotes)
                .viewerPollOptionIndex(postService.getViewerPollOptionIndex(post, viewerUserId))
                .pollVoters(postService.getPollVoters(post))
                .xpAwarded(resolvePostXp(post))
                .authorVerifiedXp(calculateVerifiedXp(post.getUser()))
                .reelViewCount(post.getReelViewCount())
                .authorName(post.getUser().getFirstname() + " " + post.getUser().getLastName())
                .authorProfileImageUrl(post.getUser().getImageUrl())
                .createdAt(post.getCreatedAt())
                .editedAt(post.getEditedAt())
                .build();
    }

    private boolean noMedia(MultipartFile image) {
        return image == null || image.isEmpty();
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
