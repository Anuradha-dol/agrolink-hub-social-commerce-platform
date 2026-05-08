package com.socialApp.Lishare.modules.social.chat.service;

import com.socialApp.Lishare.modules.social.chat.dto.MessageReactionResponse;

import java.util.List;

public interface ChatMessageReactionService {
    MessageReactionResponse upsertReaction(Long userId, Long messageId, String emoji);

    void removeReaction(Long userId, Long messageId);

    List<MessageReactionResponse> getReactions(Long userId, Long messageId);
}
