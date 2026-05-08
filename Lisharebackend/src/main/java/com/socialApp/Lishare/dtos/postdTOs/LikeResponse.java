package com.socialApp.Lishare.dtos.postdTOs;

import lombok.*;

import java.util.Date;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LikeResponse {
    private Long postId;
    private String likedByName;
    private Date likedAt;



}

