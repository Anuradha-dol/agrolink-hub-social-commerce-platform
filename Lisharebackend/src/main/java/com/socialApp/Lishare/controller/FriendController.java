package com.socialApp.Lishare.controller;

import com.socialApp.Lishare.Service.interfaces.FriendService;
import com.socialApp.Lishare.dtos.postdTOs.FriendActionResponse;
import com.socialApp.Lishare.dtos.postdTOs.FriendResponse;
import com.socialApp.Lishare.entities.User;
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

    @PostMapping("/{requestId}/accept")
    public ResponseEntity<FriendActionResponse> acceptRequest(
            @AuthenticationPrincipal User user,
            @PathVariable Long requestId) {

        FriendActionResponse response = friendService.acceptFriendRequest(user.getUserId(), requestId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{requestId}/reject")
    public ResponseEntity<FriendActionResponse> rejectRequest(
            @AuthenticationPrincipal User user,
            @PathVariable Long requestId) {

        FriendActionResponse response = friendService.rejectFriendRequest(user.getUserId(), requestId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{friendId}/unfriend")
    public ResponseEntity<FriendActionResponse> unfriend(
            @AuthenticationPrincipal User user,
            @PathVariable Long friendId) {

        FriendActionResponse response = friendService.unfriend(user.getUserId(), friendId);
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
