package com.socialApp.Lishare.dtos.postdTOs;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FollowResponse {
    private Long userId;
    private String firstName;
    private String lastName;
    private boolean isFollowing;
}
