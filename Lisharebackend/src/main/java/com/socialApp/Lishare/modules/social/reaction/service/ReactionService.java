package com.socialApp.Lishare.modules.social.reaction.service;


import com.socialApp.Lishare.modules.social.reaction.dto.LikeActionResponse;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Map;

public interface ReactionService {
    LikeActionResponse reactToPost(Long userId, Long postId, String type);
    LikeActionResponse removeReaction(Long userId, Long postId);
    Map<String, Long> getReactionCounts(Long postId); // returns counts per type

}
