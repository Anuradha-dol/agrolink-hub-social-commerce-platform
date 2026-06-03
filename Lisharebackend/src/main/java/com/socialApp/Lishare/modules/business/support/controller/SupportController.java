package com.socialApp.Lishare.modules.business.support.controller;

import com.socialApp.Lishare.modules.business.support.service.SupportService;
import com.socialApp.Lishare.modules.business.support.dto.SupportResponseDto;
import com.socialApp.Lishare.modules.business.support.entity.SupportQuestion;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/support")
@RequiredArgsConstructor
public class SupportController {

    private final SupportService supportService;

    // ================= USER =================
    @PreAuthorize("hasAnyRole('USER','BUSINESS','FARMER','CREATOR')")
    @PostMapping
    public ResponseEntity<SupportQuestion> createQuestion(
            @AuthenticationPrincipal User user,
            @RequestBody SupportQuestion question) {

        question.setUserId(user.getUserId());
        question.setUsername(user.getFirstname() + " " + user.getLastName());
        question.setStatus("OPEN");
        return ResponseEntity.ok(supportService.createQuestion(question));
    }

    @PreAuthorize("hasAnyRole('USER','BUSINESS','FARMER','CREATOR')")
    @GetMapping("/my")
    public ResponseEntity<List<SupportQuestion>> getMyQuestions(
            @AuthenticationPrincipal User user) {

        return ResponseEntity.ok(supportService.getUserQuestions(user.getUserId()));
    }

    @PreAuthorize("hasAnyRole('USER','BUSINESS','FARMER','CREATOR')")
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteQuestion(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {

        supportService.deleteQuestion(id, user.getUserId());
        return ResponseEntity.ok("Deleted successfully");
    }

    // ================= ADMIN =================
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<List<SupportQuestion>> getAllQuestions() {
        return ResponseEntity.ok(supportService.getAllQuestions());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/respond")
    public ResponseEntity<SupportQuestion> respond(
            @PathVariable Long id,
            @Valid @RequestBody SupportResponseDto dto) {

        return ResponseEntity.ok(supportService.respondToQuestion(id, dto.response()));
    }
}
