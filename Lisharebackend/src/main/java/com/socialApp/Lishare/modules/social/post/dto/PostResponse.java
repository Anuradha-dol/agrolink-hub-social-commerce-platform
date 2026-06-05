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
    private List<String> hashtags;
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
    private Integer viewerPollOptionIndex;
    private List<PollVoterResponse> pollVoters;
    private Integer xpAwarded;
    private Long authorVerifiedXp;
    private Long reelViewCount;
    private String authorName;
    private String authorProfileImageUrl;
    private LocalDateTime createdAt;
    private LocalDateTime editedAt;
    private List<CommentResponse> comments; // all comments including replies
}
