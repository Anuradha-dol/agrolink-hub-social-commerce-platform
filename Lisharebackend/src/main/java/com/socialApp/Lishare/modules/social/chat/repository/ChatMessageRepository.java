package com.socialApp.Lishare.modules.social.chat.repository;

import com.socialApp.Lishare.modules.social.chat.entity.ChatMessage;
import com.socialApp.Lishare.modules.social.chat.entity.MessageStatus;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    Page<ChatMessage> findByConversationIdOrderByCreatedAtDesc(Long conversationId, Pageable pageable);

    @Query("""
        SELECT m
        FROM ChatMessage m
        WHERE m.conversation.id = :conversationId
        ORDER BY m.createdAt DESC
    """)
    Page<ChatMessage> findRecentByConversation(@Param("conversationId") Long conversationId, Pageable pageable);

    Optional<ChatMessage> findTopByConversationIdOrderByCreatedAtDesc(Long conversationId);

    @Modifying
    @Query("""
        UPDATE ChatMessage m
        SET m.status = :status
        WHERE m.conversation.id = :conversationId
          AND m.sender.userId <> :viewerUserId
          AND m.status <> :status
    """)
    void markConversationMessagesStatus(
            @Param("conversationId") Long conversationId,
            @Param("viewerUserId") Long viewerUserId,
            @Param("status") MessageStatus status
    );
}
