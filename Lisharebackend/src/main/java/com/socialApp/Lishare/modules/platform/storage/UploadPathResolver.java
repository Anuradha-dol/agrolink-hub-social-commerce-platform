package com.socialApp.Lishare.modules.platform.storage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Component
public class UploadPathResolver {

    private final String uploadDir;

    public UploadPathResolver(@Value("${file.upload-dir:uploads}") String uploadDir) {
        this.uploadDir = uploadDir;
    }

    public Path primaryUploadPath() {
        Path configuredPath = Paths.get(uploadDir);
        if (configuredPath.isAbsolute()) {
            return configuredPath.normalize();
        }
        return backendRoot().resolve(configuredPath).normalize();
    }

    public List<Path> readableUploadPaths() {
        Set<Path> paths = new LinkedHashSet<>();
        Path primary = primaryUploadPath();
        paths.add(primary);

        Path backendRoot = backendRoot();
        Path projectRoot = backendRoot.getParent();
        if (projectRoot != null) {
            paths.add(projectRoot.resolve("uploads").normalize());
        }

        paths.add(Paths.get("uploads").toAbsolutePath().normalize());
        return new ArrayList<>(paths);
    }

    public String[] resourceLocations() {
        return readableUploadPaths().stream()
                .map(path -> {
                    String location = path.toUri().toString();
                    return location.endsWith("/") ? location : location + "/";
                })
                .toArray(String[]::new);
    }

    public Path ensurePrimaryUploadPath() {
        Path path = primaryUploadPath();
        try {
            Files.createDirectories(path);
        } catch (Exception exception) {
            throw new RuntimeException("Failed to prepare upload directory", exception);
        }
        return path;
    }

    private Path backendRoot() {
        Path fromCodeSource = findBackendRootFromCodeSource();
        if (fromCodeSource != null) return fromCodeSource;

        Path current = Paths.get("").toAbsolutePath().normalize();
        if (Files.exists(current.resolve("pom.xml")) && current.getFileName() != null
                && "Lisharebackend".equalsIgnoreCase(current.getFileName().toString())) {
            return current;
        }
        Path childBackend = current.resolve("Lisharebackend").normalize();
        if (Files.exists(childBackend.resolve("pom.xml"))) {
            return childBackend;
        }
        return current;
    }

    private Path findBackendRootFromCodeSource() {
        try {
            URI uri = UploadPathResolver.class.getProtectionDomain().getCodeSource().getLocation().toURI();
            Path path = Paths.get(uri).toAbsolutePath().normalize();
            if (Files.isRegularFile(path)) {
                path = path.getParent();
            }
            while (path != null) {
                if (Files.exists(path.resolve("pom.xml")) && Files.exists(path.resolve("src/main/resources/application.yaml"))) {
                    return path;
                }
                path = path.getParent();
            }
        } catch (Exception ignored) {
            // Fallback to current working directory detection.
        }
        return null;
    }
}
