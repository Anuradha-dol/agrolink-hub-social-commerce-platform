package com.socialApp.Lishare.modules.social.follow.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FollowResponse {
    private Long userId;
    private String firstName;
    private String lastName;
    private String email;
    private boolean isFollowing;
}
