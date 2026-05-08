package com.socialApp.Lishare.modules.social.comment.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class CommentResponse {
    private Long commentId;
    private String content;
    private String authorName;
    private LocalDateTime createdAt;
    private List<CommentResponse> replies;
}