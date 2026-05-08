package com.socialApp.Lishare.modules.social.post.controller;

import com.socialApp.Lishare.modules.platform.common.response.ApiResponse;
import com.socialApp.Lishare.modules.social.post.dto.PostResponse;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.social.post.dto.PostReportRequest;
import com.socialApp.Lishare.modules.social.post.dto.PostReportResponse;
import com.socialApp.Lishare.modules.social.post.service.PostSafetyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostSafetyController {

    private final PostSafetyService postSafetyService;

    @PostMapping("/{postId}/save")
    public ResponseEntity<ApiResponse<Void>> savePost(
            @AuthenticationPrincipal User user,
            @PathVariable Long postId
    ) {
        postSafetyService.savePost(user.getUserId(), postId);
        return ResponseEntity.ok(ApiResponse.success("Post saved", null));
    }

    @DeleteMapping("/{postId}/save")
    public ResponseEntity<ApiResponse<Void>> unsavePost(
            @AuthenticationPrincipal User user,
            @PathVariable Long postId
    ) {
        postSafetyService.unsavePost(user.getUserId(), postId);
        return ResponseEntity.ok(ApiResponse.success("Post removed from saved", null));
    }

    @GetMapping("/saved")
    public ResponseEntity<ApiResponse<Page<PostResponse>>> savedPosts(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Saved posts fetched",
                postSafetyService.getSavedPosts(user.getUserId(), page, size)
        ));
    }

    @PostMapping("/{postId}/report")
    public ResponseEntity<ApiResponse<PostReportResponse>> reportPost(
            @AuthenticationPrincipal User user,
            @PathVariable Long postId,
            @Valid @RequestBody PostReportRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Post reported",
                postSafetyService.reportPost(user.getUserId(), postId, request)
        ));
    }
}
