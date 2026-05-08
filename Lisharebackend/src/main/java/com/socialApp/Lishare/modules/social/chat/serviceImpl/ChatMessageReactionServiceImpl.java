package com.socialApp.Lishare.modules.social.chat.serviceImpl;

import com.socialApp.Lishare.modules.social.chat.dto.MessageReactionResponse;
import com.socialApp.Lishare.modules.social.chat.entity.ChatMessage;
import com.socialApp.Lishare.modules.social.chat.entity.ChatMessageReaction;
import com.socialApp.Lishare.modules.social.chat.entity.ConversationMember;
import com.socialApp.Lishare.modules.social.chat.repository.ChatMessageReactionRepository;
import com.socialApp.Lishare.modules.social.chat.repository.ChatMessageRepository;
import com.socialApp.Lishare.modules.social.chat.repository.ConversationMemberRepository;
import com.socialApp.Lishare.modules.social.chat.service.ChatMessageReactionService;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.platform.user.repository.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatMessageReactionServiceImpl implements ChatMessageReactionService {

    private final ChatMessageReactionRepository reactionRepository;
    private final ChatMessageRepository messageRepository;
    private final UserRepo userRepo;
    private final ConversationMemberRepository conversationMemberRepository;

    @Override
    @Transactional
    public MessageReactionResponse upsertReaction(Long userId, Long messageId, String emoji) {
        ChatMessage message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        ensureConversationMember(userId, message.getConversation().getId());

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        ChatMessageReaction reaction = reactionRepository.findByMessageIdAndUserUserId(messageId, userId)
                .orElseGet(() -> ChatMessageReaction.builder()
                        .message(message)
                        .user(user)
                        .build());

        reaction.setEmoji(emoji.trim());
        ChatMessageReaction saved = reactionRepository.save(reaction);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void removeReaction(Long userId, Long messageId) {
        ChatMessage message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        ensureConversationMember(userId, message.getConversation().getId());

        reactionRepository.findByMessageIdAndUserUserId(messageId, userId)
                .ifPresent(reactionRepository::delete);
    }

    @Override
    public List<MessageReactionResponse> getReactions(Long userId, Long messageId) {
        ChatMessage message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        ensureConversationMember(userId, message.getConversation().getId());

        return reactionRepository.findByMessageId(messageId).stream()
                .map(this::toResponse)
                .toList();
    }

    private MessageReactionResponse toResponse(ChatMessageReaction reaction) {
        User user = reaction.getUser();
        return new MessageReactionResponse(
                reaction.getId(),
                reaction.getMessage().getId(),
                user.getUserId(),
                user.getFirstname() + " " + user.getLastName(),
                reaction.getEmoji(),
                reaction.getCreatedAt()
        );
    }

    private void ensureConversationMember(Long userId, Long conversationId) {
        ConversationMember membership = conversationMemberRepository
                .findByConversationIdAndUserUserId(conversationId, userId)
                .orElseThrow(() -> new RuntimeException("You are not a member of this conversation"));

        if (membership.getId() == null) {
            throw new RuntimeException("Invalid conversation membership");
        }
    }
}
