package com.socialApp.Lishare.modules.social.story.repository;

import com.socialApp.Lishare.modules.social.story.entity.StoryView;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoryViewRepository extends JpaRepository<StoryView, Long> {
    boolean existsByStoryIdAndUserUserId(Long storyId, Long userId);
}
