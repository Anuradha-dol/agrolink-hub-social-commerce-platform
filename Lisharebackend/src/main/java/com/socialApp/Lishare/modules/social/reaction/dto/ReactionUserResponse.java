package com.socialApp.Lishare.modules.social.reaction.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.Date;

@Getter
@Builder
public class ReactionUserResponse {
    private Long reactionId;
    private Long userId;
    private String name;
    private String email;
    private String profileImageUrl;
    private String type;
    private Date createdAt;
}
