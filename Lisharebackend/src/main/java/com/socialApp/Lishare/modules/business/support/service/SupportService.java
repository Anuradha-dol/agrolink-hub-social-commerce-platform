package com.socialApp.Lishare.modules.business.support.service;

import com.socialApp.Lishare.modules.business.support.entity.SupportQuestion;
import com.socialApp.Lishare.modules.business.support.repository.SupportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SupportService {

    private final SupportRepository supportRepository;

    // Create question
    public SupportQuestion createQuestion(SupportQuestion q) {
        return supportRepository.save(q);
    }

    // Get own questions
    public List<SupportQuestion> getUserQuestions(Long userId) {
        return supportRepository.findByUserId(userId);
    }

    // Delete own question
    public void deleteQuestion(Long id, Long userId) {
        SupportQuestion q = supportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Question not found"));

        if (!q.getUserId().equals(userId)) throw new RuntimeException("Not allowed");
        supportRepository.delete(q);
    }

    // Admin: get all
    public List<SupportQuestion> getAllQuestions() {
        return supportRepository.findAll();
    }

    // Admin: respond
    public SupportQuestion respondToQuestion(Long id, String response) {
        SupportQuestion q = supportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Question not found"));

        q.setAdminResponse(response);
        q.setStatus("ANSWERED");
        return supportRepository.save(q);
    }
}
