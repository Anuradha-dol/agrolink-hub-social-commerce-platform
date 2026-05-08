package com.socialApp.Lishare.modules.social.story.service;

import com.socialApp.Lishare.modules.social.story.dto.StoryResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface StoryService {
    StoryResponse createStory(Long userId, MultipartFile media, String caption, Long sourcePostId, Integer expiresInHours, Boolean notifyFollowers);

    StoryResponse shareStory(Long userId, Long storyId);

    List<StoryResponse> getStoryFeed(Long userId);

    StoryResponse reactToStory(Long userId, Long storyId, String type);

    StoryResponse markViewed(Long userId, Long storyId);

    void replyToStory(Long userId, Long storyId, String content);

    void deleteStory(Long userId, Long storyId);
}
