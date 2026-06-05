package com.socialApp.Lishare.modules.social.post.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PollVoterResponse {
    private Long voteId;
    private Long userId;
    private String name;
    private String email;
    private String username;
    private String profileImageUrl;
    private Integer optionIndex;
    private String optionText;
    private LocalDateTime votedAt;
}
