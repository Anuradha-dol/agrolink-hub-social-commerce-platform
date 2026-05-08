package com.socialApp.Lishare.dtos.postdTOs;

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
}

