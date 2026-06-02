package com.socialApp.Lishare.modules.platform.user.dto;

import com.socialApp.Lishare.modules.platform.common.enums.AccountModerationStatus;
import com.socialApp.Lishare.modules.platform.common.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class UserDto {



    public record RegisterRequest(@NotBlank(message = "First name is required") String firstname,
                                  @NotBlank(message = "last name required") String lastName,
                                  String username,
                                  @NotBlank(message = "email is required")
                                  @Email(message = "please provide valid email! ")
                                  String  email,
                                  String tempEmail,
                                  String phoneNumber,
                                  Role role,
                                  String bio,
                                  String location,
                                  String preferredLanguage,
                                  String website,
                                  String interests,
                                  String hobbies,

                                  @NotBlank(message = "password is required") String password) {

    }

    public record ChangePassword(String password, String repeatPassword) {


    }


    // Delete account by confirming current password
    public record DeleteAccountDto(
            @NotBlank(message = "Current password is required")
            String currentPassword
    ) {}


    public record DeleteAccountForgotRequest(
            @NotBlank(message = "Email is required")
            String email
    ) {}


    // Verify OTP to actually delete account
    public record DeleteAccountForgotVerifyDto(
            @NotBlank(message = "OTP is required")
            String otp
    ) {}


    public record UpdateEmailDto(
            @NotBlank(message = "Email cannot be blank")
            @Email(message = "Provide a valid email")
            String newEmail
    ) {}



    public record UpdateNameDto(
            @NotBlank(message = "Name cannot be blank")
            String name,
            @NotBlank(message = "Last name cannot be blank")
            String lastName
    ) {}


    public record UpdateProfileDetailsDto(
            @Size(max = 80, message = "Username must be at most 80 characters")
            String username,

            @Size(max = 20, message = "Phone number must be at most 20 characters")
            String phoneNumber,

            @Email(message = "Provide a valid backup email")
            @Size(max = 150, message = "Backup email must be at most 150 characters")
            String backupEmail,

            @Size(max = 280, message = "Bio must be at most 280 characters")
            String bio,

            @Size(max = 120, message = "Location must be at most 120 characters")
            String location,

            @Size(max = 80, message = "Preferred language must be at most 80 characters")
            String preferredLanguage,

            @Size(max = 180, message = "Website must be at most 180 characters")
            String website,

            @Size(max = 500, message = "Interests must be at most 500 characters")
            String interests,

            @Size(max = 500, message = "Hobbies must be at most 500 characters")
            String hobbies
    ) {}


    public record UpdatePasswordDto(
            @NotBlank(message = "Current password is required")
            String currentPassword,

            @NotBlank(message = "New password is required")
            @Size(min = 6, message = "Password must be at least 6 characters")
            String newPassword,

            @NotBlank(message = "Confirm password is required")
            String confirmPassword
    ) {}


    public record UserHomeDto(String welcomeMessage, int notifications, int tasks) {}



    public record UserProfileDto(Long id, String name, String email, String lastName, Role role, String phoneNumber, String tempEmail, String profileImageUrl, String coverImageUrl, long verifiedXp, AccountModerationStatus moderationStatus, String moderationMessage, String username, String backupEmail, String bio, String location, String preferredLanguage, String website, String interests, String hobbies) {}   // new

    public record PublicProfileDto(Long id, String name, String lastName, String profileImageUrl, String coverImageUrl, long verifiedXp, String username, String bio, String location, String preferredLanguage, String website, String interests, String hobbies) {}



    public record VerifyCodeDto(


            @NotBlank(message = "Verification code is required")
            String verifyCode
    ) {}




































}

