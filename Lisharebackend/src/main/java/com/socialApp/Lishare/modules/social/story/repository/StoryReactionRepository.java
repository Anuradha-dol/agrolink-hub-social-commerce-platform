package com.socialApp.Lishare.modules.social.story.repository;

import com.socialApp.Lishare.modules.social.story.entity.StoryReaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StoryReactionRepository extends JpaRepository<StoryReaction, Long> {
    Optional<StoryReaction> findByStoryIdAndUserUserId(Long storyId, Long userId);

    List<StoryReaction> findByStoryIdIn(List<Long> storyIds);
}
