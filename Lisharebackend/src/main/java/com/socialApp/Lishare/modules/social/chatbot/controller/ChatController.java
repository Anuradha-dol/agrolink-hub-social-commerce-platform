package com.socialApp.Lishare.modules.social.chatbot.controller;

import com.socialApp.Lishare.modules.social.chatbot.dto.ChatRequest;
import com.socialApp.Lishare.modules.social.chatbot.dto.ChatResponse;
import com.socialApp.Lishare.modules.social.chatbot.service.ChatbotKnowledgeService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ChatController {

    private final ChatbotKnowledgeService chatbotKnowledgeService;

    public ChatController(ChatbotKnowledgeService chatbotKnowledgeService) {
        this.chatbotKnowledgeService = chatbotKnowledgeService;
    }

    @PostMapping("/chat")
    public ChatResponse chat(@RequestBody ChatRequest request) {
        if (request == null || request.getMessage() == null || request.getMessage().isBlank()) {
            return new ChatResponse("Ask a question about AgroLink Hub, selling, the marketplace, posts, orders, support, or account help.");
        }

        return new ChatResponse(chatbotKnowledgeService.answer(request.getMessage()));
    }
}
