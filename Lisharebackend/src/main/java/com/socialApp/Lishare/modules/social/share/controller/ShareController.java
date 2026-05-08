package com.socialApp.Lishare.modules.social.share.controller;

import com.socialApp.Lishare.modules.social.share.service.ShareService;

import com.socialApp.Lishare.modules.social.share.dto.FeedResponse;
import com.socialApp.Lishare.modules.social.share.dto.ShareRequest;
import com.socialApp.Lishare.modules.social.share.dto.ShareResponse;
import com.socialApp.Lishare.modules.social.share.entity.Share;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/shares")
@RequiredArgsConstructor
public class ShareController {

    private final ShareService shareService;

    @PostMapping("/{postId}/share")
    public ResponseEntity<ShareResponse> sharePost(
            @AuthenticationPrincipal User user,
            @PathVariable Long postId,
            @Valid @RequestBody(required = false) ShareRequest request) {

        Share share = shareService.sharePost(
                user.getUserId(),
                postId,
                request != null ? request.getCaption() : null,
                request == null || request.getNotifyFollowers() == null || request.getNotifyFollowers(),
                request != null ? request.getMentionedUserIds() : null,
                request != null ? request.getPostValue() : null
        );

        ShareResponse response = ShareResponse.builder()
                .postId(share.getShareId()) // unique id
                .sharedByName(
                        user.getFirstname() + " " +
                                user.getLastName()
                )
                .caption(share.getCaption())

                .originalPostId(share.getOriginalPostId())
                .originalContent(share.getOriginalContent())
                .originalImageUrl(share.getOriginalImageUrl())
                .originalAuthorName(share.getOriginalAuthorName())
                .postValue(share.getPostValue())
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/feed")
    public ResponseEntity<List<FeedResponse>> getFeed() {
        return ResponseEntity.ok(shareService.getFullFeed());
    }


    @DeleteMapping("/{shareId}")
    public ResponseEntity<?> deleteShare(
            @AuthenticationPrincipal User user,
            @PathVariable Long shareId) {

        shareService.deleteShare(user.getUserId(), shareId);

        return ResponseEntity.ok("Share deleted successfully");
    }
}
