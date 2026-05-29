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
    private Long authorId;
    private String authorName;
    private Long parentCommentId;
    private String parentAuthorName;
    private LocalDateTime createdAt;
    private Integer replyCount;
    private List<CommentResponse> replies;
}
