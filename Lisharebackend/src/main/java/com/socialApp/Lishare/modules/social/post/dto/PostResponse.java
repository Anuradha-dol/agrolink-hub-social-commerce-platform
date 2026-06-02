package com.socialApp.Lishare.modules.social.post.dto;

import com.socialApp.Lishare.modules.social.comment.dto.CommentResponse;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PostResponse {
    private Long postId;
    private Long authorId;
    private String content;
    private String imageUrl;
    private String mediaType;
    private String category;
    private Integer xpAwarded;
    private Long authorVerifiedXp;
    private Long reelViewCount;
    private String authorName;
    private LocalDateTime createdAt;
    private LocalDateTime editedAt;
    private List<CommentResponse> comments; // all comments including replies
}
