package com.socialApp.Lishare.controller;

import com.socialApp.Lishare.dtos.ChatRequest;
import com.socialApp.Lishare.dtos.ChatResponse;
import com.socialApp.Lishare.entities.Concept;
import com.socialApp.Lishare.repos.ConceptRepository;
import org.apache.commons.text.similarity.FuzzyScore;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api")
public class ChatController {

    private final ConceptRepository conceptRepository;

    public ChatController(ConceptRepository conceptRepository) {
        this.conceptRepository = conceptRepository;
    }

    @PostMapping("/chat")
    public ChatResponse chat(@RequestBody ChatRequest request) {

        if (request == null || request.getMessage() == null) {
            return new ChatResponse("Please enter a valid message.");
        }

        String userMessage = request.getMessage().toLowerCase().trim();

        // ================================
        // 1️⃣ RULE-BASED FIXED RESPONSES
        // ================================

        if (userMessage.contains("uni learn hub")) {
            return new ChatResponse(
                    "Uni Learn Hub is an online learning platform for frontend, backend, and fullstack development."
            );
        }

        if (userMessage.contains("deep learning")) {
            return new ChatResponse(
                    "Deep Learning is a subset of machine learning using neural networks to learn complex patterns."
            );
        }

        if (userMessage.contains("how to learn")) {
            return new ChatResponse(
                    "You can start by choosing a course you are interested in, then follow its modules step by step."
            );
        }

        // ================================
        // 2️⃣ DATABASE CONCEPT MATCHING
        // ================================

        List<Concept> allConcepts = conceptRepository.findAll();
        FuzzyScore fuzzyScore = new FuzzyScore(Locale.ENGLISH);

        Concept bestMatch = null;
        int highestScore = 0;

        for (Concept concept : allConcepts) {

            String topic = concept.getTopic().toLowerCase().trim();

            // 2️⃣.1 Exact match (strongest)
            if (userMessage.contains(topic) || topic.contains(userMessage)) {
                return new ChatResponse(concept.getDescription());
            }

            // 2️⃣.2 Word-level matching
            String[] words = userMessage.split(" ");
            for (String word : words) {
                if (word.length() > 3 && topic.contains(word)) {
                    return new ChatResponse(concept.getDescription());
                }
            }

            // 2️⃣.3 Fuzzy matching (both directions)
            int score1 = fuzzyScore.fuzzyScore(userMessage, topic);
            int score2 = fuzzyScore.fuzzyScore(topic, userMessage);

            int finalScore = Math.max(score1, score2);

            if (finalScore > highestScore) {
                highestScore = finalScore;
                bestMatch = concept;
            }
        }

        // 2️⃣.4 Apply threshold
        if (bestMatch != null && highestScore > 5) {
            return new ChatResponse(bestMatch.getDescription());
        }

        // ================================
        // 3️⃣ FALLBACK RESPONSE
        // ================================

        return new ChatResponse(
                "Sorry, I didn’t understand that. You can ask about Bondly"
        );
    }
}

