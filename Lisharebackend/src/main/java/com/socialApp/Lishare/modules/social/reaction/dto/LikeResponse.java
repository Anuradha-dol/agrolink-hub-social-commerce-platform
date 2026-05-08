package com.socialApp.Lishare.modules.social.reaction.dto;

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

