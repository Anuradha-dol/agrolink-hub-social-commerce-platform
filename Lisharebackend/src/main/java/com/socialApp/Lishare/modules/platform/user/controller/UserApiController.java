package com.socialApp.Lishare.modules.platform.user.controller;

import com.socialApp.Lishare.modules.platform.user.service.UserProfileService;
import com.socialApp.Lishare.modules.platform.common.response.ApiResponse;
import com.socialApp.Lishare.modules.platform.user.dto.UserDto;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserApiController {

    private final UserProfileService userProfileService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserDto.UserProfileDto>> profile(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                "Profile fetched",
                userProfileService.getProfile(user.getUserId())
        ));
    }

    @GetMapping("/{userId}/profile")
    public ResponseEntity<ApiResponse<UserDto.PublicProfileDto>> publicProfile(@PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Public profile fetched",
                userProfileService.getPublicProfile(userId)
        ));
    }
}
