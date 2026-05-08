package com.socialApp.Lishare.modules.social.chat.repository;

import com.socialApp.Lishare.modules.social.chat.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    @Query("""
        SELECT c
        FROM Conversation c
        JOIN c.members m
        WHERE m.user.userId = :userId
        ORDER BY c.updatedAt DESC
    """)
    List<Conversation> findAllByUserIdOrderByUpdatedAtDesc(@Param("userId") Long userId);

    @Query("""
        SELECT c
        FROM Conversation c
        JOIN c.members m1
        JOIN c.members m2
        WHERE c.type = com.socialApp.Lishare.modules.social.chat.entity.ConversationType.DIRECT
          AND m1.user.userId = :firstUserId
          AND m2.user.userId = :secondUserId
    """)
    Optional<Conversation> findDirectConversation(
            @Param("firstUserId") Long firstUserId,
            @Param("secondUserId") Long secondUserId
    );
}
