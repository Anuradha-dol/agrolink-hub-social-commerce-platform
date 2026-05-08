package com.socialApp.Lishare.modules.social.chat.dto;

import jakarta.validation.constraints.Size;

public record MessageRequest(
        @Size(max = 3000, message = "Message content too long")
        String content,
        @Size(max = 500, message = "Attachment URL too long")
        String attachmentUrl,
        @Size(max = 50, message = "Attachment type too long")
        String attachmentType,
        Long replyToMessageId
) {}
