package com.socialApp.Lishare.modules.social.chat.mapper;

import com.socialApp.Lishare.modules.social.chat.dto.MessageResponse;
import com.socialApp.Lishare.modules.social.chat.entity.ChatMessage;
import org.springframework.stereotype.Component;

@Component
public class ChatMessageMapper {

    public MessageResponse toResponse(ChatMessage message) {
        return new MessageResponse(
                message.getId(),
                message.getConversation().getId(),
                message.getSender().getUserId(),
                message.getSender().getFirstname() + " " + message.getSender().getLastName(),
                message.getContent(),
                message.getAttachmentUrl(),
                message.getAttachmentType(),
                message.getReplyToMessage() != null ? message.getReplyToMessage().getId() : null,
                message.getStatus(),
                message.getCreatedAt()
        );
    }
}
