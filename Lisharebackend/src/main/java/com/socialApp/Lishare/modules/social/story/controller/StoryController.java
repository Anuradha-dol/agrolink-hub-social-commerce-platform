package com.socialApp.Lishare.modules.social.story.controller;

import com.socialApp.Lishare.modules.platform.common.response.ApiResponse;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.social.story.dto.StoryReplyRequest;
import com.socialApp.Lishare.modules.social.story.dto.StoryGroupResponse;
import com.socialApp.Lishare.modules.social.story.dto.StoryResponse;
import com.socialApp.Lishare.modules.social.story.service.StoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stories")
@RequiredArgsConstructor
public class StoryController {

    private final StoryService storyService;

    @PostMapping
    public ResponseEntity<ApiResponse<StoryResponse>> createStory(
            @AuthenticationPrincipal User user,
            @RequestParam(value = "media", required = false) MultipartFile media,
            @RequestParam(value = "caption", required = false) String caption,
            @RequestParam(value = "sourcePostId", required = false) Long sourcePostId,
            @RequestParam(value = "expiresInHours", required = false) Integer expiresInHours,
            @RequestParam(value = "notifyFollowers", required = false) Boolean notifyFollowers
    ) {
        StoryResponse response = storyService.createStory(user.getUserId(), media, caption, sourcePostId, expiresInHours, notifyFollowers);
        return ResponseEntity.ok(ApiResponse.success("Story created", response));
    }

    @GetMapping("/feed")
    public ResponseEntity<ApiResponse<List<StoryResponse>>> storyFeed(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                "Stories fetched",
                storyService.getStoryFeed(user.getUserId())
        ));
    }

    @GetMapping("/grouped-feed")
    public ResponseEntity<ApiResponse<List<StoryGroupResponse>>> groupedStoryFeed(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                "Grouped stories fetched",
                groupStories(storyService.getStoryFeed(user.getUserId()))
        ));
    }

    @PostMapping("/{storyId}/share")
    public ResponseEntity<ApiResponse<StoryResponse>> shareStory(
            @AuthenticationPrincipal User user,
            @PathVariable Long storyId
    ) {
        StoryResponse response = storyService.shareStory(user.getUserId(), storyId);
        return ResponseEntity.ok(ApiResponse.success("Story reshared", response));
    }

    @PostMapping("/{storyId}/reactions")
    public ResponseEntity<ApiResponse<StoryResponse>> reactToStory(
            @AuthenticationPrincipal User user,
            @PathVariable Long storyId,
            @RequestParam String type
    ) {
        StoryResponse response = storyService.reactToStory(user.getUserId(), storyId, type);
        return ResponseEntity.ok(ApiResponse.success("Story reaction updated", response));
    }

    @PostMapping("/{storyId}/view")
    public ResponseEntity<ApiResponse<StoryResponse>> markViewed(
            @AuthenticationPrincipal User user,
            @PathVariable Long storyId
    ) {
        StoryResponse response = storyService.markViewed(user.getUserId(), storyId);
        return ResponseEntity.ok(ApiResponse.success("Story viewed", response));
    }

    @PostMapping("/{storyId}/reply")
    public ResponseEntity<ApiResponse<Void>> replyToStory(
            @AuthenticationPrincipal User user,
            @PathVariable Long storyId,
            @Valid @RequestBody StoryReplyRequest request
    ) {
        storyService.replyToStory(user.getUserId(), storyId, request.content());
        return ResponseEntity.ok(ApiResponse.success("Reply sent to inbox", null));
    }

    @DeleteMapping("/{storyId}")
    public ResponseEntity<ApiResponse<Void>> deleteStory(
            @AuthenticationPrincipal User user,
            @PathVariable Long storyId
    ) {
        storyService.deleteStory(user.getUserId(), storyId);
        return ResponseEntity.ok(ApiResponse.success("Story deleted", null));
    }

    private List<StoryGroupResponse> groupStories(List<StoryResponse> stories) {
        Map<Long, List<StoryResponse>> storiesByOwner = new LinkedHashMap<>();
        for (StoryResponse story : stories) {
            storiesByOwner.computeIfAbsent(story.ownerUserId(), ignored -> new java.util.ArrayList<>()).add(story);
        }

        return storiesByOwner.entrySet().stream()
                .map(entry -> {
                    List<StoryResponse> sortedStories = entry.getValue().stream()
                            .sorted(Comparator.comparing(StoryResponse::createdAt, Comparator.nullsLast(Comparator.naturalOrder())))
                            .toList();
                    StoryResponse latestStory = sortedStories.stream()
                            .max(Comparator.comparing(StoryResponse::createdAt, Comparator.nullsLast(Comparator.naturalOrder())))
                            .orElse(null);
                    LocalDateTime latestStoryTime = latestStory != null ? latestStory.createdAt() : null;
                    StoryResponse firstStory = sortedStories.isEmpty() ? null : sortedStories.get(0);

                    return StoryGroupResponse.builder()
                            .userId(entry.getKey())
                            .username(firstStory != null ? firstStory.ownerName() : "Unknown")
                            .profileImage(firstStory != null ? firstStory.ownerProfileImageUrl() : null)
                            .latestStoryTime(latestStoryTime)
                            .stories(sortedStories)
                            .build();
                })
                .sorted(Comparator.comparing(
                        StoryGroupResponse::latestStoryTime,
                        Comparator.nullsLast(Comparator.reverseOrder())
                ))
                .toList();
    }
}
