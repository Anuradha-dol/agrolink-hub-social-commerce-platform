package com.socialApp.Lishare.modules.social.chat.controller;

import com.socialApp.Lishare.modules.social.chat.dto.ChatAttachmentUploadResponse;
import com.socialApp.Lishare.modules.platform.common.response.ApiResponse;
import com.socialApp.Lishare.modules.platform.storage.UploadStorageService;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/chat/attachments")
@Validated
@RequiredArgsConstructor
public class ChatAttachmentController {

    private final UploadStorageService uploadStorageService;

    @PostMapping
    public ResponseEntity<ApiResponse<ChatAttachmentUploadResponse>> upload(
            @NotNull @RequestParam("file") MultipartFile file
    ) throws IOException {
        UploadStorageService.StoredUpload upload = uploadStorageService.saveAttachment(file, "chat_", null);
        ChatAttachmentUploadResponse response = new ChatAttachmentUploadResponse(upload.url(), upload.contentType());
        return ResponseEntity.ok(ApiResponse.success("Attachment uploaded", response));
    }
}
