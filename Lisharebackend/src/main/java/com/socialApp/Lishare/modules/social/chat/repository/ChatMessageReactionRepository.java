package com.socialApp.Lishare.modules.social.chat.repository;

import com.socialApp.Lishare.modules.social.chat.entity.ChatMessageReaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatMessageReactionRepository extends JpaRepository<ChatMessageReaction, Long> {

    Optional<ChatMessageReaction> findByMessageIdAndUserUserId(Long messageId, Long userId);

    List<ChatMessageReaction> findByMessageId(Long messageId);
}
