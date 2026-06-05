package com.socialApp.Lishare.modules.social.share.service;

import com.socialApp.Lishare.modules.social.share.dto.FeedResponse;
import com.socialApp.Lishare.modules.social.share.entity.Share;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ShareService {
    Share sharePost(Long userId, Long postId, String caption, boolean notifyFollowers, List<Long> mentionedUserIds, String postValue, String audience);

    List<FeedResponse> getFullFeed(Long viewerUserId);

    void deleteShare(Long userId, Long shareId);


}
