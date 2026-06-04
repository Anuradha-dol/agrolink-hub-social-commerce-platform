package com.socialApp.Lishare.modules.social.comment.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class CommentResponse {
    private Long commentId;
    private String content;
    private Long authorId;
    private String authorName;
    private String authorProfileImageUrl;
    private Long parentCommentId;
    private String parentAuthorName;
    private String mediaUrl;
    private String mediaType;
    private LocalDateTime createdAt;
    private Integer replyCount;
    private Map<String, Long> reactionCounts;
    private Long reactionCount;
    private String viewerReaction;
    private String relationshipLabel;
    private List<CommentResponse> replies;
}
