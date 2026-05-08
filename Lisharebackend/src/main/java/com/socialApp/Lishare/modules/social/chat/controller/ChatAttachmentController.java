package com.socialApp.Lishare.modules.social.chat.controller;

import com.socialApp.Lishare.modules.social.chat.dto.ChatAttachmentUploadResponse;
import com.socialApp.Lishare.modules.platform.common.response.ApiResponse;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@RestController
@RequestMapping("/api/chat/attachments")
@Validated
public class ChatAttachmentController {

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    @PostMapping
    public ResponseEntity<ApiResponse<ChatAttachmentUploadResponse>> upload(
            @NotNull @RequestParam("file") MultipartFile file
    ) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Attachment file is required");
        }

        String original = StringUtils.cleanPath(file.getOriginalFilename() == null ? "" : file.getOriginalFilename());
        String extension = "";
        int dotIndex = original.lastIndexOf(".");
        if (dotIndex >= 0) {
            extension = original.substring(dotIndex);
        }

        String attachmentType = file.getContentType() == null ? "application/octet-stream" : file.getContentType();
        String filename = "chat_" + UUID.randomUUID() + extension;

        Path basePath = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(basePath);
        Path targetPath = basePath.resolve(filename).normalize();
        if (!targetPath.startsWith(basePath)) {
            throw new IllegalArgumentException("Invalid attachment path");
        }

        Files.write(targetPath, file.getBytes());

        ChatAttachmentUploadResponse response = new ChatAttachmentUploadResponse("/uploads/" + filename, attachmentType);
        return ResponseEntity.ok(ApiResponse.success("Attachment uploaded", response));
    }
}
