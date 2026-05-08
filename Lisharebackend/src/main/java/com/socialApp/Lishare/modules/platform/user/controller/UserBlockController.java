package com.socialApp.Lishare.modules.platform.user.controller;

import com.socialApp.Lishare.modules.platform.common.response.ApiResponse;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.platform.user.dto.UserBlockResponse;
import com.socialApp.Lishare.modules.platform.user.service.UserBlockService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserBlockController {

    private final UserBlockService userBlockService;

    @PostMapping("/{targetUserId}/block")
    public ResponseEntity<ApiResponse<UserBlockResponse>> blockUser(
            @AuthenticationPrincipal User user,
            @PathVariable Long targetUserId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "User blocked",
                userBlockService.blockUser(user.getUserId(), targetUserId)
        ));
    }

    @DeleteMapping("/{targetUserId}/block")
    public ResponseEntity<ApiResponse<Void>> unblockUser(
            @AuthenticationPrincipal User user,
            @PathVariable Long targetUserId
    ) {
        userBlockService.unblockUser(user.getUserId(), targetUserId);
        return ResponseEntity.ok(ApiResponse.success("User unblocked", null));
    }

    @GetMapping("/blocks")
    public ResponseEntity<ApiResponse<List<UserBlockResponse>>> blockedUsers(
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Blocked users fetched",
                userBlockService.getBlockedUsers(user.getUserId())
        ));
    }
}
