package com.socialApp.Lishare.controller;

import com.socialApp.Lishare.Service.SupportService;
import com.socialApp.Lishare.dtos.SupportResponseDto;
import com.socialApp.Lishare.entities.SupportQuestion;
import com.socialApp.Lishare.entities.User;
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
    @PreAuthorize("hasRole('USER')")
    @PostMapping
    public ResponseEntity<SupportQuestion> createQuestion(
            @AuthenticationPrincipal User user,
            @RequestBody SupportQuestion question) {

        question.setUserId(user.getUserId());
        question.setUsername(user.getFirstname() + " " + user.getLastName());
        question.setStatus("OPEN");
        return ResponseEntity.ok(supportService.createQuestion(question));
    }

    @PreAuthorize("hasRole('USER')")
    @GetMapping("/my")
    public ResponseEntity<List<SupportQuestion>> getMyQuestions(
            @AuthenticationPrincipal User user) {

        return ResponseEntity.ok(supportService.getUserQuestions(user.getUserId()));
    }

    @PreAuthorize("hasRole('USER')")
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
