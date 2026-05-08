package com.socialApp.Lishare.modules.social.chat.repository;

import com.socialApp.Lishare.modules.social.chat.entity.ConversationMember;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ConversationMemberRepository extends JpaRepository<ConversationMember, Long> {

    Optional<ConversationMember> findByConversationIdAndUserUserId(Long conversationId, Long userId);

    List<ConversationMember> findByConversationId(Long conversationId);

    @Query("""
        SELECT CASE WHEN COUNT(cm) > 0 THEN true ELSE false END
        FROM ConversationMember cm
        WHERE cm.conversation.id = :conversationId
          AND cm.user.userId = :userId
    """)
    boolean existsMember(@Param("conversationId") Long conversationId, @Param("userId") Long userId);

    @Query("""
        SELECT COUNT(m)
        FROM ChatMessage m
        WHERE m.conversation.id = :conversationId
          AND m.sender.userId <> :userId
          AND m.createdAt > COALESCE((
              SELECT cm.lastReadAt
              FROM ConversationMember cm
              WHERE cm.conversation.id = :conversationId
                AND cm.user.userId = :userId
          ), :defaultOldTime)
    """)
    long countUnreadMessages(
            @Param("conversationId") Long conversationId,
            @Param("userId") Long userId,
            @Param("defaultOldTime") LocalDateTime defaultOldTime
    );

    @Modifying
    @Query("""
        DELETE FROM ConversationMember cm
        WHERE cm.conversation.id = :conversationId
          AND cm.user.userId = :userId
    """)
    void deleteByConversationIdAndUserId(@Param("conversationId") Long conversationId, @Param("userId") Long userId);
}
