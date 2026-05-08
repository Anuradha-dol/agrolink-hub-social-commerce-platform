package com.socialApp.Lishare.modules.social.story.repository;

import com.socialApp.Lishare.modules.social.story.entity.Story;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

public interface StoryRepository extends JpaRepository<Story, Long> {
    List<Story> findByUserUserIdInAndExpiresAtAfterOrderByCreatedAtDesc(Set<Long> userIds, LocalDateTime now);
}
