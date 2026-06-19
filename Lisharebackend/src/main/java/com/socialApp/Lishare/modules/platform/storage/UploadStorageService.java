package com.socialApp.Lishare.modules.platform.storage;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UploadStorageService {

    private static final int HEADER_BYTES = 64;
    private static final Set<String> ISO_BASE_MEDIA_EXTENSIONS = Set.of(".mp4", ".m4v", ".mov");

    private final UploadPathResolver uploadPathResolver;

    @Value("${app.upload.max-image-bytes:15728640}")
    private long maxImageBytes;

    @Value("${app.upload.max-media-bytes:104857600}")
    private long maxMediaBytes;

    @Value("${app.upload.max-attachment-bytes:52428800}")
    private long maxAttachmentBytes;

    public String saveImage(MultipartFile file, String filenamePrefix, String subdirectory) {
        return save(file, filenamePrefix, subdirectory, UploadPolicy.IMAGE).url();
    }

    public String saveMedia(MultipartFile file, String filenamePrefix, String subdirectory) {
        return save(file, filenamePrefix, subdirectory, UploadPolicy.MEDIA).url();
    }

    public String saveCommentMedia(MultipartFile file, String filenamePrefix, String subdirectory) {
        return save(file, filenamePrefix, subdirectory, UploadPolicy.COMMENT_MEDIA).url();
    }

    public StoredUpload saveAttachment(MultipartFile file, String filenamePrefix, String subdirectory) {
        return save(file, filenamePrefix, subdirectory, UploadPolicy.ATTACHMENT);
    }

    private StoredUpload save(MultipartFile file, String filenamePrefix, String subdirectory, UploadPolicy policy) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Upload file is required");
        }

        DetectedFileType detected = detectFileType(file);
        validatePolicy(policy, detected);
        validateSize(file, detected);

        Path basePath = uploadPathResolver.ensurePrimaryUploadPath();
        Path storagePath = subdirectory == null || subdirectory.isBlank()
                ? basePath
                : basePath.resolve(subdirectory).normalize();

        if (!storagePath.startsWith(basePath)) {
            throw new IllegalArgumentException("Invalid upload path");
        }

        try {
            Files.createDirectories(storagePath);
            String filename = buildFilename(filenamePrefix, detected.extension());
            Path targetPath = storagePath.resolve(filename).normalize();
            if (!targetPath.startsWith(storagePath)) {
                throw new IllegalArgumentException("Invalid upload path");
            }

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);
            }

            String urlPrefix = subdirectory == null || subdirectory.isBlank()
                    ? "/uploads/"
                    : "/uploads/" + subdirectory.replace("\\", "/").replaceAll("^/+|/+$", "") + "/";
            return new StoredUpload(urlPrefix + filename, detected.contentType());
        } catch (IOException exception) {
            throw new RuntimeException("Failed to save uploaded file", exception);
        }
    }

    private DetectedFileType detectFileType(MultipartFile file) {
        byte[] header;
        try (InputStream inputStream = file.getInputStream()) {
            header = inputStream.readNBytes(HEADER_BYTES);
        } catch (IOException exception) {
            throw new RuntimeException("Failed to inspect uploaded file", exception);
        }

        String extension = extension(file.getOriginalFilename());
        if (isJpeg(header)) return new DetectedFileType(preferredExtension(extension, ".jpg", ".jpeg"), "image/jpeg", true, false, false, false);
        if (isPng(header)) return new DetectedFileType(".png", "image/png", true, false, false, false);
        if (isGif(header)) return new DetectedFileType(".gif", "image/gif", true, false, false, false);
        if (isWebp(header)) return new DetectedFileType(".webp", "image/webp", true, false, false, false);
        if (isPdf(header)) return new DetectedFileType(".pdf", "application/pdf", false, false, true, false);
        if (isWebm(header)) return new DetectedFileType(".webm", "video/webm", false, true, false, false);
        if (isOgg(header)) return new DetectedFileType(".ogg", "video/ogg", false, true, false, false);
        if (isAvi(header)) return new DetectedFileType(".avi", "video/x-msvideo", false, true, false, false);
        if (isIsoBaseMedia(header)) {
            String normalizedExtension = ISO_BASE_MEDIA_EXTENSIONS.contains(extension) ? extension : ".mp4";
            String contentType = ".mov".equals(normalizedExtension) ? "video/quicktime" : "video/mp4";
            return new DetectedFileType(normalizedExtension, contentType, false, true, false, false);
        }
        if (isPlainText(header, extension, file.getContentType())) {
            return new DetectedFileType(".txt", "text/plain", false, false, false, true);
        }

        throw new IllegalArgumentException("Unsupported upload file type");
    }

    private void validatePolicy(UploadPolicy policy, DetectedFileType detected) {
        boolean allowed = switch (policy) {
            case IMAGE -> detected.image();
            case MEDIA -> detected.image() || detected.video();
            case COMMENT_MEDIA -> detected.image() || detected.video() || detected.pdf();
            case ATTACHMENT -> detected.image() || detected.video() || detected.pdf() || detected.text();
        };

        if (!allowed) {
            throw new IllegalArgumentException("Unsupported upload file type");
        }
    }

    private void validateSize(MultipartFile file, DetectedFileType detected) {
        long maxBytes = detected.image()
                ? maxImageBytes
                : detected.video()
                ? maxMediaBytes
                : maxAttachmentBytes;

        if (file.getSize() > maxBytes) {
            throw new IllegalArgumentException("Upload file is too large");
        }
    }

    private String buildFilename(String filenamePrefix, String extension) {
        String cleanedPrefix = filenamePrefix == null ? "" : filenamePrefix.replaceAll("[^A-Za-z0-9._-]", "_");
        if (cleanedPrefix.isBlank()) {
            return UUID.randomUUID() + extension;
        }
        String separator = cleanedPrefix.endsWith("_") || cleanedPrefix.endsWith("-") ? "" : "_";
        return cleanedPrefix + separator + UUID.randomUUID() + extension;
    }

    private String extension(String originalFilename) {
        if (originalFilename == null || originalFilename.isBlank()) {
            return "";
        }
        String normalized = Path.of(originalFilename).getFileName().toString().toLowerCase(Locale.ROOT);
        int dotIndex = normalized.lastIndexOf('.');
        return dotIndex >= 0 ? normalized.substring(dotIndex) : "";
    }

    private String preferredExtension(String actual, String primary, String alternative) {
        return alternative.equals(actual) ? alternative : primary;
    }

    private boolean isJpeg(byte[] header) {
        return header.length >= 3
                && (header[0] & 0xFF) == 0xFF
                && (header[1] & 0xFF) == 0xD8
                && (header[2] & 0xFF) == 0xFF;
    }

    private boolean isPng(byte[] header) {
        return startsWith(header, new byte[]{(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A});
    }

    private boolean isGif(byte[] header) {
        return startsWith(header, "GIF87a".getBytes(StandardCharsets.US_ASCII))
                || startsWith(header, "GIF89a".getBytes(StandardCharsets.US_ASCII));
    }

    private boolean isWebp(byte[] header) {
        return header.length >= 12
                && startsWith(header, "RIFF".getBytes(StandardCharsets.US_ASCII))
                && header[8] == 'W'
                && header[9] == 'E'
                && header[10] == 'B'
                && header[11] == 'P';
    }

    private boolean isPdf(byte[] header) {
        return startsWith(header, "%PDF-".getBytes(StandardCharsets.US_ASCII));
    }

    private boolean isWebm(byte[] header) {
        return startsWith(header, new byte[]{0x1A, 0x45, (byte) 0xDF, (byte) 0xA3});
    }

    private boolean isOgg(byte[] header) {
        return startsWith(header, "OggS".getBytes(StandardCharsets.US_ASCII));
    }

    private boolean isAvi(byte[] header) {
        return header.length >= 12
                && startsWith(header, "RIFF".getBytes(StandardCharsets.US_ASCII))
                && header[8] == 'A'
                && header[9] == 'V'
                && header[10] == 'I'
                && header[11] == ' ';
    }

    private boolean isIsoBaseMedia(byte[] header) {
        return header.length >= 12
                && header[4] == 'f'
                && header[5] == 't'
                && header[6] == 'y'
                && header[7] == 'p';
    }

    private boolean isPlainText(byte[] header, String extension, String contentType) {
        if (!".txt".equals(extension) || contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("text/plain")) {
            return false;
        }
        for (byte value : header) {
            int current = value & 0xFF;
            boolean allowedControl = current == 0x09 || current == 0x0A || current == 0x0D;
            if (current < 0x20 && !allowedControl) {
                return false;
            }
        }
        return true;
    }

    private boolean startsWith(byte[] source, byte[] prefix) {
        if (source.length < prefix.length) {
            return false;
        }
        for (int i = 0; i < prefix.length; i++) {
            if (source[i] != prefix[i]) {
                return false;
            }
        }
        return true;
    }

    public record StoredUpload(String url, String contentType) {
    }

    private record DetectedFileType(String extension, String contentType, boolean image, boolean video, boolean pdf, boolean text) {
    }

    private enum UploadPolicy {
        IMAGE,
        MEDIA,
        COMMENT_MEDIA,
        ATTACHMENT
    }
}
