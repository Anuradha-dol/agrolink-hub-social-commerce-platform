package com.socialApp.Lishare.modules.social.share.dto;



import com.socialApp.Lishare.modules.social.post.dto.PollVoterResponse;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

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
    private List<String> mediaUrls;
    private List<String> mediaTypes;
    private String category;
    private String audience;
    private String feeling;
    private String locationName;
    private String pollQuestion;
    private List<String> pollOptions;
    private List<Long> pollVotes;
    private Long pollTotalVotes;
    private Boolean allowMultipleVotes;
    private Integer viewerPollOptionIndex;
    private List<Integer> viewerPollOptionIndexes;
    private List<PollVoterResponse> pollVoters;
    private Integer xpAwarded;
    private Long authorVerifiedXp;
    private Long sharedByVerifiedXp;
    private Long reelViewCount;
    private LocalDateTime createdAt;
    private String authorProfileImageUrl;

    // For SHARE
    private Long shareId;
    private Long originalPostId;
    private Boolean originalPostDeleted;
    private String sharedByName;
    private Long sharedById;
    private String sharedByProfileImageUrl;
    private String shareCaption;
    private String postValue;
    private String shareAudience;
    private LocalDateTime sharedAt;
}
