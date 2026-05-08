package com.socialApp.Lishare.controller;

import com.socialApp.Lishare.Service.interfaces.FollowService;
import com.socialApp.Lishare.dtos.postdTOs.FollowActionResponse;
import com.socialApp.Lishare.dtos.postdTOs.FollowResponse;
import com.socialApp.Lishare.entities.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/follow")
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;

    @PostMapping("/{followingId}/follow")
    public ResponseEntity<FollowActionResponse> follow(
            @AuthenticationPrincipal User user,
            @PathVariable Long followingId) {

        FollowActionResponse response = followService.followUser(user.getUserId(), followingId);
        if (!response.isSuccess()) return ResponseEntity.badRequest().body(response);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{followingId}/unfollow")
    public ResponseEntity<FollowActionResponse> unfollow(
            @AuthenticationPrincipal User user,
            @PathVariable Long followingId) {

        FollowActionResponse response = followService.unfollowUser(user.getUserId(), followingId);
        if (!response.isSuccess()) return ResponseEntity.badRequest().body(response);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/followers")
    public ResponseEntity<List<FollowResponse>> getFollowers(@AuthenticationPrincipal User user) {
        List<FollowResponse> response = followService.getFollowers(user.getUserId())
                .stream()
                .map(u -> FollowResponse.builder()
                        .userId(u.getUserId())
                        .firstName(u.getFirstname())
                        .lastName(u.getLastName())
                        .isFollowing(followService.isFollowing(user.getUserId(), u.getUserId()))
                        .build())
                .toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/following")
    public ResponseEntity<List<FollowResponse>> getFollowing(@AuthenticationPrincipal User user) {
        List<FollowResponse> response = followService.getFollowing(user.getUserId())
                .stream()
                .map(u -> FollowResponse.builder()
                        .userId(u.getUserId())
                        .firstName(u.getFirstname())
                        .lastName(u.getLastName())
                        .isFollowing(true)
                        .build())
                .toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/followers/count")
    public ResponseEntity<Long> getFollowersCount(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(followService.getFollowersCount(user.getUserId()));
    }

    @GetMapping("/following/count")
    public ResponseEntity<Long> getFollowingCount(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(followService.getFollowingCount(user.getUserId()));
    }

    @GetMapping("/search")
    public ResponseEntity<List<FollowResponse>> searchUsers(
            @RequestParam String query,
            @AuthenticationPrincipal User user) {

        List<User> users = followService.searchUsers(query, user.getUserId());

        // Map to FollowResponse so frontend can use isFollowing
        List<FollowResponse> response = users.stream()
                .map(u -> FollowResponse.builder()
                        .userId(u.getUserId())
                        .firstName(u.getFirstname())
                        .lastName(u.getLastName())
                        .isFollowing(followService.isFollowing(user.getUserId(), u.getUserId()))
                        .build())
                .toList();

        return ResponseEntity.ok(response);
    }

}
