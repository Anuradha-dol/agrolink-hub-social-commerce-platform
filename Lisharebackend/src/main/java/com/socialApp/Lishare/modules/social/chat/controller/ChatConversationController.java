package com.socialApp.Lishare.modules.social.chat.controller;

import com.socialApp.Lishare.modules.social.chat.dto.*;
import com.socialApp.Lishare.modules.social.chat.service.ChatConversationService;
import com.socialApp.Lishare.modules.platform.common.response.ApiResponse;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat/conversations")
@RequiredArgsConstructor
public class ChatConversationController {

    private final ChatConversationService chatConversationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ConversationSummaryResponse>>> getConversations(
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Conversations fetched",
                chatConversationService.getConversations(user.getUserId())
        ));
    }

    @PostMapping("/direct/{otherUserId}")
    public ResponseEntity<ApiResponse<ConversationSummaryResponse>> getOrCreateDirect(
            @AuthenticationPrincipal User user,
            @PathVariable Long otherUserId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Direct conversation ready",
                chatConversationService.getOrCreateDirectConversation(user.getUserId(), otherUserId)
        ));
    }

    @PostMapping("/group")
    public ResponseEntity<ApiResponse<ConversationSummaryResponse>> createGroup(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ConversationCreateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Group conversation created",
                chatConversationService.createGroupConversation(user.getUserId(), request)
        ));
    }

    @GetMapping("/{conversationId}/messages")
    public ResponseEntity<ApiResponse<Page<MessageResponse>>> getMessages(
            @AuthenticationPrincipal User user,
            @PathVariable Long conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Messages fetched",
                chatConversationService.getMessages(user.getUserId(), conversationId, page, size)
        ));
    }

    @PostMapping("/{conversationId}/messages")
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
            @AuthenticationPrincipal User user,
            @PathVariable Long conversationId,
            @Valid @RequestBody MessageRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Message sent",
                chatConversationService.sendMessage(user.getUserId(), conversationId, request)
        ));
    }

    @PutMapping("/{conversationId}/seen")
    public ResponseEntity<ApiResponse<Void>> markSeen(
            @AuthenticationPrincipal User user,
            @PathVariable Long conversationId
    ) {
        chatConversationService.markConversationSeen(user.getUserId(), conversationId);
        return ResponseEntity.ok(ApiResponse.success("Conversation marked as seen", null));
    }

    @PostMapping("/{conversationId}/members")
    public ResponseEntity<ApiResponse<ConversationSummaryResponse>> addMember(
            @AuthenticationPrincipal User user,
            @PathVariable Long conversationId,
            @Valid @RequestBody ConversationMemberManageRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Member added to conversation",
                chatConversationService.addMemberToGroup(user.getUserId(), conversationId, request.userId())
        ));
    }

    @DeleteMapping("/{conversationId}/members/{targetUserId}")
    public ResponseEntity<ApiResponse<ConversationSummaryResponse>> removeMember(
            @AuthenticationPrincipal User user,
            @PathVariable Long conversationId,
            @PathVariable Long targetUserId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Member removed from conversation",
                chatConversationService.removeMemberFromGroup(user.getUserId(), conversationId, targetUserId)
        ));
    }
}
