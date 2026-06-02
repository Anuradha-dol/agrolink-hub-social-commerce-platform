package com.socialApp.Lishare.modules.social.chatbot.controller;

import com.socialApp.Lishare.modules.social.chatbot.dto.ChatRequest;
import com.socialApp.Lishare.modules.social.chatbot.dto.ChatResponse;
import com.socialApp.Lishare.modules.social.chatbot.entity.Concept;
import com.socialApp.Lishare.modules.social.chatbot.repository.ConceptRepository;
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
        if (request == null || request.getMessage() == null || request.getMessage().isBlank()) {
            return new ChatResponse("Please enter a valid message.");
        }

        String userMessage = request.getMessage().toLowerCase(Locale.ROOT).trim();
        List<Concept> allConcepts = conceptRepository.findAll();
        FuzzyScore fuzzyScore = new FuzzyScore(Locale.ENGLISH);

        Concept bestMatch = null;
        int highestScore = 0;

        for (Concept concept : allConcepts) {
            if (concept.getTopic() == null || concept.getDescription() == null) {
                continue;
            }

            String topic = concept.getTopic().toLowerCase(Locale.ROOT).trim();

            if (userMessage.contains(topic) || topic.contains(userMessage)) {
                return new ChatResponse(concept.getDescription());
            }

            for (String word : userMessage.split("\\s+")) {
                if (word.length() > 3 && topic.contains(word)) {
                    return new ChatResponse(concept.getDescription());
                }
            }

            int score = Math.max(
                    fuzzyScore.fuzzyScore(userMessage, topic),
                    fuzzyScore.fuzzyScore(topic, userMessage)
            );

            if (score > highestScore) {
                highestScore = score;
                bestMatch = concept;
            }
        }

        if (bestMatch != null && highestScore > 5) {
            return new ChatResponse(bestMatch.getDescription());
        }

        return new ChatResponse("Sorry, I did not find a matching answer in the knowledge base.");
    }
}
