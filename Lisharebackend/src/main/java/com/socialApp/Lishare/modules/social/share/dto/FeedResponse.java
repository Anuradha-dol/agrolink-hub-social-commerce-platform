package com.socialApp.Lishare.modules.social.share.dto;



import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class FeedResponse {

    private String type; // "Post"  "share"

    private Long postId;
    private Long authorId;
    private String authorName;
    private String content;
    private String imageUrl;
    private String mediaType;
    private Long reelViewCount;
    private LocalDateTime createdAt;

    // For SHARE
    private Long shareId;
    private Long originalPostId;
    private Boolean originalPostDeleted;
    private String sharedByName;
    private Long sharedById;
    private String shareCaption;
    private String postValue;
    private LocalDateTime sharedAt;
}
