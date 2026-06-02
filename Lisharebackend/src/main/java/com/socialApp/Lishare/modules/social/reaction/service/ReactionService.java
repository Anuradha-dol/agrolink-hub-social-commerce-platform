package com.socialApp.Lishare.modules.social.reaction.service;


import com.socialApp.Lishare.modules.social.reaction.dto.LikeActionResponse;
import com.socialApp.Lishare.modules.social.reaction.dto.ReactionUserResponse;

import java.util.List;
import java.util.Map;

public interface ReactionService {
    LikeActionResponse reactToPost(Long userId, Long postId, String type);
    LikeActionResponse removeReaction(Long userId, Long postId);
    Map<String, Long> getReactionCounts(Long postId); // returns counts per type
    List<ReactionUserResponse> getReactionUsers(Long postId);

}
