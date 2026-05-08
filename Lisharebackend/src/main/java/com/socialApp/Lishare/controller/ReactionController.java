package com.socialApp.Lishare.controller;

import com.socialApp.Lishare.Service.interfaces.ReactionService;
import com.socialApp.Lishare.dtos.postdTOs.LikeActionResponse;
import com.socialApp.Lishare.entities.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/reactions")
@RequiredArgsConstructor
public class ReactionController {

    private final ReactionService reactionService;

    @PostMapping("/{postId}")
    public ResponseEntity<LikeActionResponse> react(
            @AuthenticationPrincipal User user,
            @PathVariable Long postId,
            @RequestParam String type) {

        return ResponseEntity.ok(reactionService.reactToPost(user.getUserId(), postId, type));
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<LikeActionResponse> removeReaction(
            @AuthenticationPrincipal User user,
            @PathVariable Long postId) {

        return ResponseEntity.ok(reactionService.removeReaction(user.getUserId(), postId));
    }

    @GetMapping("/{postId}/counts")
    public ResponseEntity<Map<String, Long>> getReactionCounts(@PathVariable Long postId) {
        return ResponseEntity.ok(reactionService.getReactionCounts(postId));
    }
}
