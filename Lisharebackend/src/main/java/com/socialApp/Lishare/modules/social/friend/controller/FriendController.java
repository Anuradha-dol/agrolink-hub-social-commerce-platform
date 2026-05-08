package com.socialApp.Lishare.modules.social.friend.controller;

import com.socialApp.Lishare.modules.social.friend.service.FriendService;
import com.socialApp.Lishare.modules.social.friend.dto.FriendActionResponse;
import com.socialApp.Lishare.modules.social.friend.dto.FriendResponse;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendController {

    private final FriendService friendService;

    @PostMapping("/{receiverId}/request")
    public ResponseEntity<FriendActionResponse> sendRequest(
            @AuthenticationPrincipal User user,
            @PathVariable Long receiverId) {

        FriendActionResponse response = friendService.sendFriendRequest(user.getUserId(), receiverId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{senderId}/accept")
    public ResponseEntity<FriendActionResponse> acceptRequest(
            @AuthenticationPrincipal User user,
            @PathVariable Long senderId) {

        FriendActionResponse response = friendService.acceptFriendRequest(user.getUserId(), senderId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{senderId}/reject")
    public ResponseEntity<FriendActionResponse> rejectRequest(
            @AuthenticationPrincipal User user,
            @PathVariable Long senderId) {

        FriendActionResponse response = friendService.rejectFriendRequest(user.getUserId(), senderId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{otherUserId}/unfriend")
    public ResponseEntity<FriendActionResponse> unfriend(
            @AuthenticationPrincipal User user,
            @PathVariable Long otherUserId) {

        FriendActionResponse response = friendService.unfriend(user.getUserId(), otherUserId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/all")
    public ResponseEntity<List<FriendResponse>> getFriends(@AuthenticationPrincipal User user) {

        List<User> friends = friendService.getFriends(user.getUserId());

        List<FriendResponse> responses = friends.stream()
                .map(f -> FriendResponse.builder()
                        .userId(f.getUserId())
                        .firstName(f.getFirstname())
                        .lastName(f.getLastName())
                        .build())
                .toList();

        return ResponseEntity.ok(responses);
    }

    @GetMapping("/pending")
    public ResponseEntity<List<FriendResponse>> getPending(@AuthenticationPrincipal User user) {

        List<User> pending = friendService.getPendingRequests(user.getUserId());

        List<FriendResponse> responses = pending.stream()
                .map(f -> FriendResponse.builder()
                        .userId(f.getUserId())
                        .firstName(f.getFirstname())
                        .lastName(f.getLastName())
                        .build())
                .toList();

        return ResponseEntity.ok(responses);
    }
}
