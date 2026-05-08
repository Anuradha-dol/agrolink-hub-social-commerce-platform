package com.socialApp.Lishare.Service.interfaces;

import com.socialApp.Lishare.dtos.postdTOs.FeedResponse;
import com.socialApp.Lishare.entities.Share;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ShareService {
    Share sharePost(Long userId, Long postId, String caption);

    List<FeedResponse> getFullFeed();

    void deleteShare(Long userId, Long shareId);


}