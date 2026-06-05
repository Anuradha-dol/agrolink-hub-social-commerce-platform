package com.socialApp.Lishare.modules.platform.user.controller;

import com.socialApp.Lishare.modules.platform.user.service.UserProfileService;
import com.socialApp.Lishare.modules.platform.user.dto.UserDto;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.platform.user.repository.UserRepo;
import com.socialApp.Lishare.modules.platform.storage.UploadPathResolver;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class UserController {

    private final UserProfileService userProfileService;
    private final UserRepo userRepo;
    private final UploadPathResolver uploadPathResolver;

    // Update name
    @PutMapping("/update-name")
    public ResponseEntity<String> updateName(
            @AuthenticationPrincipal User loggedUser,
            @Valid @RequestBody UserDto.UpdateNameDto dto) {

        userProfileService.updateName(loggedUser, dto);
        return ResponseEntity.ok("Name updated successfully");
    }

    @PutMapping("/profile-details")
    public ResponseEntity<UserDto.UserProfileDto> updateProfileDetails(
            @AuthenticationPrincipal User loggedUser,
            @Valid @RequestBody UserDto.UpdateProfileDetailsDto dto) {

        return ResponseEntity.ok(userProfileService.updateProfileDetails(loggedUser, dto));
    }

    // Update email (send OTP)
    @PutMapping("/update-email")
    public ResponseEntity<String> updateEmail(
            @AuthenticationPrincipal User loggedUser,
            @Valid @RequestBody UserDto.UpdateEmailDto dto) {

        userProfileService.updateEmail(loggedUser, dto);
        return ResponseEntity.ok("OTP sent to new email for verification");
    }

    // Verify new email
    @PostMapping("/verify-new-email")
    public ResponseEntity<String> verifyNewEmail(
            @AuthenticationPrincipal User loggedUser,
            @RequestParam String otp) {

        userProfileService.verifyNewEmail(loggedUser, otp);
        return ResponseEntity.ok("Email updated successfully");
    }

    // Update password
    @PutMapping("/update-password")
    public ResponseEntity<String> updatePassword(
            @AuthenticationPrincipal User loggedUser,
            @Valid @RequestBody UserDto.UpdatePasswordDto dto) {

        userProfileService.updatePassword(loggedUser, dto);
        return ResponseEntity.ok("Password updated successfully");
    }

    // Get logged-in user's profile
    @GetMapping("/me")
    public ResponseEntity<UserDto.UserProfileDto> getProfile(
            @AuthenticationPrincipal User loggedUser) {

        return ResponseEntity.ok(
                userProfileService.getProfile(loggedUser.getUserId())
        );
    }

    // Get home/dashboard
    @PreAuthorize("hasAnyRole('USER','BUSINESS','FARMER','CREATOR')")
    @GetMapping("/home")
    public ResponseEntity<UserDto.UserHomeDto> getHome(
            @AuthenticationPrincipal User loggedUser) {

        return ResponseEntity.ok(userProfileService.getUserHome(loggedUser.getUserId()));
    }

    @RequestMapping(path = "/delete", method = {RequestMethod.POST, RequestMethod.DELETE})
    public ResponseEntity<String> deleteAccount(
            @AuthenticationPrincipal User loggedUser,
            @Valid @RequestBody UserDto.DeleteAccountDto dto) {

        userProfileService.deleteAccount(loggedUser, dto);
        return ResponseEntity.ok("Account deleted successfully");
    }

    // Request account deletion via OTP
    @PostMapping("/delete-forgot-request")
    public ResponseEntity<String> deleteForgotRequest(
            @AuthenticationPrincipal User loggedUser) {

        userProfileService.requestDeletion(loggedUser);
        return ResponseEntity.ok("OTP sent to your registered email. Verify to delete your account.");
    }

    // Verify OTP and delete account
    @PostMapping("/delete-forgot-verify")
    public ResponseEntity<String> deleteForgotVerify(
            @AuthenticationPrincipal User loggedUser,
            @Valid @RequestBody UserDto.DeleteAccountForgotVerifyDto dto) {

        userProfileService.verifyAndDelete(loggedUser, dto);
        return ResponseEntity.ok("Account deleted successfully.");
    }


    @PostMapping("/upload-profile-image")
    public ResponseEntity<String> uploadProfileImage(
            @AuthenticationPrincipal User user,
            @RequestParam("file") MultipartFile file) throws IOException {

        String imageUrl = saveImage(file, "profile", user.getUserId());
        user.setImageUrl(imageUrl);
        userRepo.save(user);  //  save correctly
        return ResponseEntity.ok(user.getImageUrl());
    }

    @PostMapping("/upload-cover-image")
    public ResponseEntity<String> uploadCoverImage(
            @AuthenticationPrincipal User user,
            @RequestParam("file") MultipartFile file) throws IOException {

        String imageUrl = saveImage(file, "cover", user.getUserId());
        user.setCoverImageUrl(imageUrl);
        userRepo.save(user);  //  save correctly
        return ResponseEntity.ok(user.getCoverImageUrl());
    }

    @DeleteMapping("/profile-image")
    public ResponseEntity<String> removeProfileImage(@AuthenticationPrincipal User user) {
        user.setImageUrl(null);
        userRepo.save(user);
        return ResponseEntity.ok("Profile image removed");
    }

    @DeleteMapping("/cover-image")
    public ResponseEntity<String> removeCoverImage(@AuthenticationPrincipal User user) {
        user.setCoverImageUrl(null);
        userRepo.save(user);
        return ResponseEntity.ok("Cover image removed");
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/dashboard")
    public ResponseEntity<UserDto.UserHomeDto> getAdminHome(@AuthenticationPrincipal User loggedUser) {
        // loggedUser is automatically injected by Spring Security
        return ResponseEntity.ok(userProfileService.getUserHome(loggedUser.getUserId()));
    }

    private String saveImage(MultipartFile file, String prefix, Long userId) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Image file is required");
        }
        if (file.getContentType() == null || !file.getContentType().startsWith("image/")) {
            throw new IllegalArgumentException("Only image uploads are allowed");
        }

        String original = StringUtils.cleanPath(file.getOriginalFilename() == null ? "" : file.getOriginalFilename());
        String extension = "";
        int dotIndex = original.lastIndexOf(".");
        if (dotIndex >= 0) {
            extension = original.substring(dotIndex);
        }

        String filename = prefix + "_" + userId + "_" + UUID.randomUUID() + extension;

        Path uploadBase = uploadPathResolver.ensurePrimaryUploadPath();
        Path uploadPath = uploadBase.resolve(filename).normalize();

        if (!uploadPath.startsWith(uploadBase)) {
            throw new IllegalArgumentException("Invalid upload path");
        }

        Files.write(uploadPath, file.getBytes());
        return "/uploads/" + filename;
    }
}


