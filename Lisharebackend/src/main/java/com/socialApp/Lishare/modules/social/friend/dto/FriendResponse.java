package com.socialApp.Lishare.modules.social.friend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FriendResponse {
    private Long userId;
    private String firstName;
    private String lastName;
    private String username;
    private String email;
    private String role;
    private String profileImageUrl;
}

