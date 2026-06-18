package com.socialApp.Lishare.modules.social.chatbot.service;

import com.socialApp.Lishare.modules.social.chatbot.entity.Concept;
import com.socialApp.Lishare.modules.social.chatbot.repository.ConceptRepository;
import org.apache.commons.text.similarity.FuzzyScore;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

@Service
public class ChatbotKnowledgeService {

    private static final Pattern NON_WORD_PATTERN = Pattern.compile("[^a-z0-9]+");
    private static final Set<String> STOP_WORDS = Set.of(
            "a", "an", "and", "are", "can", "do", "does", "for", "from", "how", "i", "in", "is", "it", "me",
            "my", "of", "on", "or", "please", "tell", "the", "this", "to", "what", "when", "where", "with",
            "about", "agrolink", "hub", "eka", "wage", "mata", "kiyanna"
    );

    private final ConceptRepository conceptRepository;
    private final FuzzyScore fuzzyScore = new FuzzyScore(Locale.ENGLISH);

    public ChatbotKnowledgeService(ConceptRepository conceptRepository) {
        this.conceptRepository = conceptRepository;
    }

    public String answer(String message) {
        String query = normalize(message);
        if (query.isBlank()) {
            return "Ask a question about AgroLink Hub, selling, the marketplace, posts, orders, support, or account help.";
        }

        List<String> queryTokens = tokens(query);
        return conceptRepository.findAll().stream()
                .filter((concept) -> concept.getTopic() != null && concept.getDescription() != null)
                .map((concept) -> new ScoredConcept(concept, score(concept, query, queryTokens)))
                .max(Comparator.comparingInt(ScoredConcept::score))
                .filter((match) -> match.score() >= 24)
                .map((match) -> match.concept().getDescription())
                .orElse("I could not find a close answer in the AgroLink knowledge base. Try asking about signup, login, marketplace, selling products, posts, stories, orders, cart, reviews, support, calendar, or admin safety.");
    }

    private int score(Concept concept, String query, List<String> queryTokens) {
        String topic = normalize(concept.getTopic());
        String keywords = normalize(concept.getKeywords());
        String description = normalize(concept.getDescription());

        int score = 0;
        if (!topic.isBlank()) {
            if (query.equals(topic)) score += 160;
            if (query.contains(topic)) score += 130;
            if (topic.contains(query) && query.length() > 3) score += 85;
            score += Math.max(
                    fuzzyScore.fuzzyScore(query, topic),
                    fuzzyScore.fuzzyScore(topic, query)
            ) * 2;
        }

        for (String keyword : keywordPhrases(concept.getKeywords())) {
            String phrase = normalize(keyword);
            if (phrase.isBlank()) continue;
            if (query.contains(phrase)) score += phrase.contains(" ") ? 72 : 42;
            if (phrase.contains(query) && query.length() > 3) score += 32;
        }

        for (String token : queryTokens) {
            if (topic.contains(token)) score += 30;
            if (keywords.contains(token)) score += 18;
            if (description.contains(token)) score += 5;
        }

        return score;
    }

    private List<String> keywordPhrases(String keywords) {
        if (keywords == null || keywords.isBlank()) {
            return List.of();
        }
        return Arrays.stream(keywords.split("[,;|]"))
                .map(String::trim)
                .filter((value) -> !value.isBlank())
                .toList();
    }

    private List<String> tokens(String value) {
        return Arrays.stream(value.split("\\s+"))
                .map(String::trim)
                .filter((token) -> token.length() > 1)
                .filter((token) -> !STOP_WORDS.contains(token))
                .distinct()
                .toList();
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }
        String ascii = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return NON_WORD_PATTERN.matcher(ascii.toLowerCase(Locale.ROOT)).replaceAll(" ").trim();
    }

    private record ScoredConcept(Concept concept, int score) {}
}
