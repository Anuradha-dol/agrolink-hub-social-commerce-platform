package com.socialApp.Lishare.controller;

import com.socialApp.Lishare.Service.interfaces.ShareService;

import com.socialApp.Lishare.dtos.postdTOs.FeedResponse;
import com.socialApp.Lishare.dtos.postdTOs.ShareRequest;
import com.socialApp.Lishare.dtos.postdTOs.ShareResponse;
import com.socialApp.Lishare.entities.Share;
import com.socialApp.Lishare.entities.User;
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
            @RequestBody(required = false) ShareRequest request) {

        Share share = shareService.sharePost(
                user.getUserId(),
                postId,
                request != null ? request.getCaption() : null
        );

        ShareResponse response = ShareResponse.builder()
                .postId(share.getShareId()) // unique id
                .sharedByName(
                        user.getFirstname() + " " +
                                user.getLastName()
                )
                .caption(share.getCaption())

                .originalPostId(share.getPost().getPostId())
                .originalContent(share.getPost().getContent())
                .originalImageUrl(share.getPost().getImageUrl())
                .originalAuthorName(share.getPost().getAuthorName())
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
