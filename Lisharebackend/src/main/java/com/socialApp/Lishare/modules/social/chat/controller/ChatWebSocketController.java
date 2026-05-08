package com.socialApp.Lishare.modules.social.chat.controller;

import com.socialApp.Lishare.modules.social.chat.dto.MessageRequest;
import com.socialApp.Lishare.modules.social.chat.dto.TypingEventPayload;
import com.socialApp.Lishare.modules.social.chat.service.ChatConversationService;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.platform.user.repository.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatConversationService chatConversationService;
    private final UserRepo userRepo;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat/send/{conversationId}")
    public void sendMessage(
            @DestinationVariable Long conversationId,
            @Payload MessageRequest request,
            Principal principal
    ) {
        Long userId = getUserId(principal);
        chatConversationService.sendMessage(userId, conversationId, request);
    }

    @MessageMapping("/chat/typing/{conversationId}")
    public void typing(
            @DestinationVariable Long conversationId,
            @Payload TypingEventPayload payload,
            Principal principal
    ) {
        User user = getUser(principal);
        TypingEventPayload event = new TypingEventPayload(
                conversationId,
                user.getUserId(),
                user.getFirstname() + " " + user.getLastName(),
                payload != null && payload.typing()
        );
        messagingTemplate.convertAndSend("/topic/chat/conversations/" + conversationId + "/typing", event);
    }

    private Long getUserId(Principal principal) {
        return getUser(principal).getUserId();
    }

    private User getUser(Principal principal) {
        if (principal == null || principal.getName() == null) {
            throw new RuntimeException("Unauthenticated websocket session");
        }
        return userRepo.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found for websocket session"));
    }
}
