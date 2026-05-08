package com.socialApp.Lishare.modules.social.chat.service;

import com.socialApp.Lishare.modules.social.chat.dto.*;
import org.springframework.data.domain.Page;

import java.util.List;

public interface ChatConversationService {
    ConversationSummaryResponse getOrCreateDirectConversation(Long currentUserId, Long otherUserId);

    ConversationSummaryResponse createGroupConversation(Long currentUserId, ConversationCreateRequest request);

    List<ConversationSummaryResponse> getConversations(Long currentUserId);

    Page<MessageResponse> getMessages(Long currentUserId, Long conversationId, int page, int size);

    MessageResponse sendMessage(Long currentUserId, Long conversationId, MessageRequest request);

    void markConversationSeen(Long currentUserId, Long conversationId);

    ConversationSummaryResponse addMemberToGroup(Long currentUserId, Long conversationId, Long targetUserId);

    ConversationSummaryResponse removeMemberFromGroup(Long currentUserId, Long conversationId, Long targetUserId);
}
