package com.socialApp.Lishare.modules.social.chat.serviceImpl;

import com.socialApp.Lishare.modules.social.chat.dto.*;
import com.socialApp.Lishare.modules.social.chat.entity.*;
import com.socialApp.Lishare.modules.social.chat.mapper.ChatMessageMapper;
import com.socialApp.Lishare.modules.social.chat.repository.ChatMessageRepository;
import com.socialApp.Lishare.modules.social.chat.repository.ConversationMemberRepository;
import com.socialApp.Lishare.modules.social.chat.repository.ConversationRepository;
import com.socialApp.Lishare.modules.social.chat.service.ChatConversationService;
import com.socialApp.Lishare.modules.social.chat.service.PresenceService;
import com.socialApp.Lishare.modules.social.notification.entity.Notification;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.social.notification.entity.NotificationType;
import com.socialApp.Lishare.modules.social.notification.service.NotificationService;
import com.socialApp.Lishare.modules.platform.user.repository.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ChatConversationServiceImpl implements ChatConversationService {

    private final ConversationRepository conversationRepository;
    private final ConversationMemberRepository conversationMemberRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepo userRepo;
    private final PresenceService presenceService;
    private final NotificationService notificationService;
    private final ChatMessageMapper chatMessageMapper;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public ConversationSummaryResponse getOrCreateDirectConversation(Long currentUserId, Long otherUserId) {
        if (Objects.equals(currentUserId, otherUserId)) {
            throw new RuntimeException("Cannot create direct chat with yourself");
        }

        User currentUser = getUser(currentUserId);
        User otherUser = getUser(otherUserId);

        Conversation existing = conversationRepository.findDirectConversation(currentUserId, otherUserId)
                .orElse(null);
        if (existing == null) {
            existing = conversationRepository.findDirectConversation(otherUserId, currentUserId).orElse(null);
        }

        if (existing == null) {
            Conversation conversation = Conversation.builder()
                    .type(ConversationType.DIRECT)
                    .createdBy(currentUser)
                    .updatedAt(LocalDateTime.now())
                    .build();
            Conversation savedConversation = conversationRepository.save(conversation);

            conversationMemberRepository.save(ConversationMember.builder()
                    .conversation(savedConversation)
                    .user(currentUser)
                    .lastReadAt(LocalDateTime.now())
                    .build());

            conversationMemberRepository.save(ConversationMember.builder()
                    .conversation(savedConversation)
                    .user(otherUser)
                    .build());

            existing = savedConversation;
        }

        return mapConversation(existing, currentUserId);
    }

    @Override
    @Transactional
    public ConversationSummaryResponse createGroupConversation(Long currentUserId, ConversationCreateRequest request) {
        User creator = getUser(currentUserId);

        Set<Long> memberIds = new LinkedHashSet<>(request.memberIds());
        memberIds.add(currentUserId);

        if (memberIds.size() < 3) {
            throw new RuntimeException("A group chat must have at least 3 members");
        }

        Conversation conversation = Conversation.builder()
                .type(ConversationType.GROUP)
                .title(request.title().trim())
                .createdBy(creator)
                .updatedAt(LocalDateTime.now())
                .build();

        Conversation savedConversation = conversationRepository.save(conversation);

        for (Long memberId : memberIds) {
            User member = getUser(memberId);
            conversationMemberRepository.save(ConversationMember.builder()
                    .conversation(savedConversation)
                    .user(member)
                    .lastReadAt(memberId.equals(currentUserId) ? LocalDateTime.now() : null)
                    .build());
        }

        return mapConversation(savedConversation, currentUserId);
    }

    @Override
    public List<ConversationSummaryResponse> getConversations(Long currentUserId) {
        List<Conversation> conversations = conversationRepository.findAllByUserIdOrderByUpdatedAtDesc(currentUserId);
        return conversations.stream().map(conversation -> mapConversation(conversation, currentUserId)).toList();
    }

    @Override
    public Page<MessageResponse> getMessages(Long currentUserId, Long conversationId, int page, int size) {
        ensureMember(conversationId, currentUserId);
        Page<ChatMessage> messagesPage = chatMessageRepository.findByConversationIdOrderByCreatedAtDesc(
                conversationId,
                PageRequest.of(page, size)
        );

        List<MessageResponse> chronological = new ArrayList<>(
                messagesPage.getContent().stream()
                        .map(chatMessageMapper::toResponse)
                        .toList()
        );
        Collections.reverse(chronological);

        return new PageImpl<>(chronological, messagesPage.getPageable(), messagesPage.getTotalElements());
    }

    @Override
    @Transactional
    public MessageResponse sendMessage(Long currentUserId, Long conversationId, MessageRequest request) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));
        User sender = getUser(currentUserId);

        ensureMember(conversationId, currentUserId);

        boolean hasText = request.content() != null && !request.content().isBlank();
        boolean hasAttachment = request.attachmentUrl() != null && !request.attachmentUrl().isBlank();
        if (!hasText && !hasAttachment) {
            throw new RuntimeException("Message content or attachment is required");
        }

        ChatMessage replyTo = null;
        if (request.replyToMessageId() != null) {
            replyTo = chatMessageRepository.findById(request.replyToMessageId())
                    .orElseThrow(() -> new RuntimeException("Reply-to message not found"));
            if (!replyTo.getConversation().getId().equals(conversationId)) {
                throw new RuntimeException("Reply-to message must belong to same conversation");
            }
        }

        ChatMessage message = ChatMessage.builder()
                .conversation(conversation)
                .sender(sender)
                .content(request.content() != null ? request.content().trim() : null)
                .attachmentUrl(request.attachmentUrl())
                .attachmentType(request.attachmentType())
                .replyToMessage(replyTo)
                .status(MessageStatus.DELIVERED)
                .build();

        ChatMessage savedMessage = chatMessageRepository.save(message);
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);

        List<ConversationMember> members = conversationMemberRepository.findByConversationId(conversationId);
        for (ConversationMember member : members) {
            if (!member.getUser().getUserId().equals(currentUserId)) {
                notificationService.publish(Notification.builder()
                        .user(member.getUser())
                        .actorUser(sender)
                        .type(NotificationType.MESSAGE)
                        .referenceId(savedMessage.getId())
                        .referenceType("CHAT_MESSAGE")
                        .message(sender.getFirstname() + " sent you a message")
                        .read(false)
                        .build());
            }
        }

        MessageResponse response = chatMessageMapper.toResponse(savedMessage);
        messagingTemplate.convertAndSend("/topic/chat/conversations/" + conversationId, response);
        return response;
    }

    @Override
    @Transactional
    public void markConversationSeen(Long currentUserId, Long conversationId) {
        ConversationMember membership = conversationMemberRepository
                .findByConversationIdAndUserUserId(conversationId, currentUserId)
                .orElseThrow(() -> new RuntimeException("Conversation not found for current user"));

        membership.setLastReadAt(LocalDateTime.now());
        conversationMemberRepository.save(membership);
        chatMessageRepository.markConversationMessagesStatus(conversationId, currentUserId, MessageStatus.SEEN);
    }

    @Override
    @Transactional
    public ConversationSummaryResponse addMemberToGroup(Long currentUserId, Long conversationId, Long targetUserId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));
        ensureConversationAdminOrCreator(conversation, currentUserId);

        if (conversation.getType() != ConversationType.GROUP) {
            throw new RuntimeException("Members can only be added to group conversations");
        }

        if (conversationMemberRepository.existsMember(conversationId, targetUserId)) {
            return mapConversation(conversation, currentUserId);
        }

        User targetUser = getUser(targetUserId);
        conversationMemberRepository.save(ConversationMember.builder()
                .conversation(conversation)
                .user(targetUser)
                .build());

        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);
        return mapConversation(conversation, currentUserId);
    }

    @Override
    @Transactional
    public ConversationSummaryResponse removeMemberFromGroup(Long currentUserId, Long conversationId, Long targetUserId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));
        ensureConversationAdminOrCreator(conversation, currentUserId);

        if (conversation.getType() != ConversationType.GROUP) {
            throw new RuntimeException("Members can only be removed from group conversations");
        }

        if (conversation.getCreatedBy() != null && conversation.getCreatedBy().getUserId().equals(targetUserId)) {
            throw new RuntimeException("Group creator cannot be removed");
        }

        conversationMemberRepository.deleteByConversationIdAndUserId(conversationId, targetUserId);
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);
        return mapConversation(conversation, currentUserId);
    }

    private ConversationSummaryResponse mapConversation(Conversation conversation, Long currentUserId) {
        List<ConversationMember> members = conversationMemberRepository.findByConversationId(conversation.getId());

        List<ConversationMemberResponse> memberResponses = members.stream()
                .map(member -> {
                    User u = member.getUser();
                    return new ConversationMemberResponse(
                            u.getUserId(),
                            u.getFirstname() + " " + u.getLastName(),
                            u.getImageUrl(),
                            presenceService.isOnline(u.getUserId())
                    );
                })
                .toList();

        String title = conversation.getTitle();
        if ((title == null || title.isBlank()) && conversation.getType() == ConversationType.DIRECT) {
            title = memberResponses.stream()
                    .filter(m -> !Objects.equals(m.userId(), currentUserId))
                    .map(ConversationMemberResponse::fullName)
                    .findFirst()
                    .orElse("Direct chat");
        }

        ChatMessage lastMessage = chatMessageRepository.findTopByConversationIdOrderByCreatedAtDesc(conversation.getId())
                .orElse(null);

        long unreadCount = conversationMemberRepository.countUnreadMessages(
                conversation.getId(),
                currentUserId,
                LocalDateTime.of(1970, 1, 1, 0, 0)
        );

        return new ConversationSummaryResponse(
                conversation.getId(),
                conversation.getType(),
                title,
                memberResponses,
                lastMessage != null ? lastMessage.getContent() : null,
                lastMessage != null ? lastMessage.getSender().getUserId() : null,
                lastMessage != null ? lastMessage.getCreatedAt() : null,
                unreadCount
        );
    }

    private void ensureMember(Long conversationId, Long userId) {
        if (!conversationMemberRepository.existsMember(conversationId, userId)) {
            throw new RuntimeException("You are not a member of this conversation");
        }
    }

    private User getUser(Long userId) {
        return userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private void ensureConversationAdminOrCreator(Conversation conversation, Long currentUserId) {
        if (!conversationMemberRepository.existsMember(conversation.getId(), currentUserId)) {
            throw new RuntimeException("You are not a member of this conversation");
        }
        if (conversation.getCreatedBy() == null || !conversation.getCreatedBy().getUserId().equals(currentUserId)) {
            throw new RuntimeException("Only group creator can manage members");
        }
    }
}
