package com.socialApp.Lishare.modules.social.story.controller;

import com.socialApp.Lishare.modules.platform.common.response.ApiResponse;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.social.story.dto.StoryReplyRequest;
import com.socialApp.Lishare.modules.social.story.dto.StoryResponse;
import com.socialApp.Lishare.modules.social.story.service.StoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

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
}
