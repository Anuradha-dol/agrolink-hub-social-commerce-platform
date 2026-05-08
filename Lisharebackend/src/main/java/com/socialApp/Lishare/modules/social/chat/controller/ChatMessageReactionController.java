package com.socialApp.Lishare.modules.social.chat.controller;

import com.socialApp.Lishare.modules.social.chat.dto.MessageReactionRequest;
import com.socialApp.Lishare.modules.social.chat.dto.MessageReactionResponse;
import com.socialApp.Lishare.modules.social.chat.service.ChatMessageReactionService;
import com.socialApp.Lishare.modules.platform.common.response.ApiResponse;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat/messages")
@RequiredArgsConstructor
public class ChatMessageReactionController {

    private final ChatMessageReactionService reactionService;

    @GetMapping("/{messageId}/reactions")
    public ResponseEntity<ApiResponse<List<MessageReactionResponse>>> listReactions(
            @AuthenticationPrincipal User user,
            @PathVariable Long messageId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Message reactions fetched",
                reactionService.getReactions(user.getUserId(), messageId)
        ));
    }

    @PutMapping("/{messageId}/reaction")
    public ResponseEntity<ApiResponse<MessageReactionResponse>> upsertReaction(
            @AuthenticationPrincipal User user,
            @PathVariable Long messageId,
            @Valid @RequestBody MessageReactionRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Reaction updated",
                reactionService.upsertReaction(user.getUserId(), messageId, request.emoji())
        ));
    }

    @DeleteMapping("/{messageId}/reaction")
    public ResponseEntity<ApiResponse<Void>> removeReaction(
            @AuthenticationPrincipal User user,
            @PathVariable Long messageId
    ) {
        reactionService.removeReaction(user.getUserId(), messageId);
        return ResponseEntity.ok(ApiResponse.success("Reaction removed", null));
    }
}
