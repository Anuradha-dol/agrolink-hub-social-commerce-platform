package com.socialApp.Lishare.dtos.postdTOs;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FollowActionResponse {
    private boolean success;
    private String message;
}
