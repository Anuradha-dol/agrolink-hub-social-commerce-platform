package com.socialApp.Lishare.modules.platform.auth.service;

import com.socialApp.Lishare.modules.platform.auth.dto.AuthResponse;
import com.socialApp.Lishare.modules.platform.auth.dto.LoginRequest;
import com.socialApp.Lishare.modules.platform.auth.dto.MailBody;
import com.socialApp.Lishare.modules.platform.auth.dto.Token;
import com.socialApp.Lishare.modules.platform.common.enums.Role;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.platform.user.dto.UserDto;
import com.socialApp.Lishare.modules.platform.user.repository.UserRepo;
import com.socialApp.Lishare.modules.platform.utils.EmailUtils;
import com.socialApp.Lishare.modules.platform.utils.JwtUtils;
import com.socialApp.Lishare.modules.platform.utils.OtpUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.mail.MessagingException;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.MailException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthServiceimpl implements AuthService {

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;
    private final EmailUtils emailUtils;
    private  final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;

    @Override
    public AuthResponse signUp(UserDto.RegisterRequest registerRequest) {

        //  Check if a user with this email already exists
        Optional<User> optionalUser = userRepo.findByEmail(registerRequest.email());
        User user;

        if (optionalUser.isPresent()) {
            user = optionalUser.get();

            // Block only verified accounts. Unverified accounts can retry signup to receive a fresh OTP.
            if (user.getIsVerified()) {
                return AuthResponse.builder()
                        .message("Email already exists!")
                        .success(false)
                        .build();
            }

            // Reuse unverified user
            user.setFirstname(registerRequest.firstname());
            user.setLastName(registerRequest.lastName());
            user.setUsername(clean(registerRequest.username()));
            user.setPassword(passwordEncoder.encode(registerRequest.password()));
            user.setPhoneNumber(clean(registerRequest.phoneNumber()));
            user.setBackupEmail(clean(registerRequest.tempEmail()));
            applyOptionalProfileFields(user, registerRequest);
            user.setRole(resolveSignupRole(registerRequest.role()));

            user.setIsVerified(false);

        } else {
            // Create new user
            user = new User();
            user.setFirstname(registerRequest.firstname());
            user.setLastName(registerRequest.lastName());
            user.setUsername(clean(registerRequest.username()));
            user.setEmail(registerRequest.email());
            user.setPassword(passwordEncoder.encode(registerRequest.password()));
            user.setPhoneNumber(clean(registerRequest.phoneNumber()));
            user.setBackupEmail(clean(registerRequest.tempEmail()));
            applyOptionalProfileFields(user, registerRequest);
            user.setRole(resolveSignupRole(registerRequest.role()));

            user.setIsVerified(false);
        }

        //  Validate optional username and phone uniqueness
        if (user.getUsername() != null && !user.getUsername().isBlank()) {
            Optional<User> usernameExists = userRepo.findByUsernameIgnoreCase(user.getUsername());
            if (usernameExists.isPresent() && !usernameExists.get().getEmail().equals(user.getEmail())) {
                throw new RuntimeException("Username already in use");
            }
        }
        if (user.getPhoneNumber() != null && !user.getPhoneNumber().isBlank()) {
            Optional<User> phoneExists = userRepo.findByPhoneNumber(user.getPhoneNumber());
            if (phoneExists.isPresent() && !phoneExists.get().getEmail().equals(user.getEmail())) {
                throw new RuntimeException("Phone number already registered");
            }
        }

        //  Generate 6-digit verification code
        int verificationCode = OtpUtils.sixDigitOtp();
        user.setVerifyCode(String.valueOf(verificationCode));
        user.setVerifyCodeExpiry(new Date(System.currentTimeMillis() + 2 * 60 * 1000)); // 2 min expiry
        user.setLastOtpSentAt(new Date());

        //  Prepare verification email
        final String subject = "Verify your account";
        final String EMAIL_TEMPLATE = """
        <html>
            <body>
                <h1>Welcome, %s!</h1>
                <p>You have successfully registered to our application.</p>
                <p>Verification code is <b>%s</b>.</p>
                <p>Please click the link to verify your account:</p>
                <a href="http://localhost:5173/verify?email=%s&code=%s">Verify Email</a>
                <p>This link will expire in 2 minutes.</p>
            </body>
        </html>
        """.formatted(user.getFirstname(), user.getVerifyCode(), user.getEmail(), user.getVerifyCode());

        // Send email before saving the signup state so a mail failure does not leave a stuck unverified account.
        try {
            MailBody mailBody = new MailBody(user.getEmail(), subject, EMAIL_TEMPLATE);
            emailUtils.sendMail(mailBody);
        } catch (MessagingException | MailException e) {
            e.printStackTrace();
            return AuthResponse.builder()
                    .message("Failed to send verification email!")
                    .success(false)
                    .build();
        }

        //  Save user to DB after email succeeds
        User savedUser = userRepo.save(user);

        //  Return response
        return AuthResponse.builder()
                .firstname(savedUser.getFirstname())
                .email(savedUser.getEmail())
                .phoneNumber(savedUser.getPhoneNumber())
                .tempEmail(savedUser.getBackupEmail())
                .role(savedUser.getRole())
                .message("User registered successfully! Verification email sent.")
                .success(true)
                .build();
    }

    private String clean(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void applyOptionalProfileFields(User user, UserDto.RegisterRequest registerRequest) {
        user.setBio(clean(registerRequest.bio()));
        user.setLocation(clean(registerRequest.location()));
        user.setPreferredLanguage(clean(registerRequest.preferredLanguage()));
        user.setWebsite(clean(registerRequest.website()));
        user.setInterests(clean(registerRequest.interests()));
        user.setHobbies(clean(registerRequest.hobbies()));
    }

    private Role resolveSignupRole(Role requestedRole) {
        if (requestedRole == null) {
            return Role.ROLE_USER;
        }
        return switch (requestedRole) {
            case ROLE_USER, ROLE_BUSINESS, ROLE_FARMER, ROLE_CREATOR -> requestedRole;
            case ROLE_ADMIN -> throw new RuntimeException("Admin accounts cannot be created from public signup");
        };
    }


    @Override
    public AuthResponse SignIn(LoginRequest loginRequest, HttpServletResponse response) {
        Optional<User> optionalUser = userRepo.findByEmail(loginRequest.email());
        if (optionalUser.isEmpty()) {
            return AuthResponse.builder()
                    .message("Invalid email or password!")
                    .success(false)
                    .build();
        }

        User user = optionalUser.get();

        if (!user.getIsVerified()) {
            return AuthResponse.builder()
                    .message("Email not verified! Please verify first.")
                    .success(false)
                    .build();
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.email(), loginRequest.password())
            );
        } catch (org.springframework.security.authentication.BadCredentialsException e) {
            return AuthResponse.builder()
                    .message("Invalid email or password!")
                    .success(false)
                    .build();
        } catch (org.springframework.security.authentication.DisabledException e) {
            return AuthResponse.builder()
                    .message("User account is disabled!")
                    .success(false)
                    .build();
        }


        // Generate tokens
        Map<String, Object> claims = new HashMap<>();
        claims.put("name", user.getFirstname());
        claims.put("email", user.getEmail());

        jwtUtils.generateToken(claims, user, response, Token.ACCESS);
        String refreshToken = jwtUtils.generateToken(claims, user, response, Token.REFRESH);

        // You just set cookies in JwtUtils, but saved refresh token in DB
        user.setRefreshToken(refreshToken);
        User savedUser = userRepo.save(user);

        return AuthResponse.builder()
                .firstname(savedUser.getFirstname())
                .lastName(savedUser.getLastName())
                .email(savedUser.getEmail())
                .isVerified(Boolean.TRUE)
                .role(savedUser.getRole()) // pass the Set<Role>

                .success(Boolean.TRUE)
                .message("Login successful!")
                .build();


    }



    @Override
    public AuthResponse verifyCode(String email, String verifyCode) {
        Optional<User> optionalUser = userRepo.findByEmail(email);

        User user;
        if (optionalUser.isEmpty()) {
            return AuthResponse.builder()
                    .message("User not found!")
                    .success(false)
                    .build();
        }

        user = optionalUser.get();

        if (user.getIsVerified()) {
            return AuthResponse.builder()
                    .message("User already verified!")
                    .success(false)
                    .build();
        }

        if (!user.getVerifyCode().equals(verifyCode)) {
            return AuthResponse.builder()
                    .message("Invalid verification code!")
                    .success(false)
                    .build();
        }



        if (user.getVerifyCodeExpiry().before(new Date())) {
            return AuthResponse.builder()
                    .message("Verification code expired! Please request a new one.")
                    .success(false)
                    .build();
        }

        user.setIsVerified(true);
        user.setVerifyCode(null); // remove code after verification
        user.setVerifyCodeExpiry(null);
        userRepo.save(user);

        return AuthResponse.builder()
                .firstname(user.getFirstname())
                .email(user.getEmail())
                .message("User verified successfully!")
                .success(true)
                .build();
    }

    @Override
    public AuthResponse resendOtp(String email) {

        Optional<User> optionalUser = userRepo.findByEmail(email);
        if (optionalUser.isEmpty()) {
            return AuthResponse.builder()
                    .message("User not found!")
                    .success(false)
                    .build();
        }

        User user = optionalUser.get();

        if (user.getIsVerified()) {
            return AuthResponse.builder()
                    .message("User already verified!")
                    .success(false)
                    .build();
        }

        Date now = new Date();

        //  Check if user is currently blocked
        if (user.getOtpBlockUntil() != null && now.before(user.getOtpBlockUntil())) {
            long remainingSec = (user.getOtpBlockUntil().getTime() - now.getTime()) / 1000;
            return AuthResponse.builder()
                    .message("Maximum resend attempts reached. Please wait " + remainingSec + " seconds.")
                    .success(false)
                    .build();
        }

        //  Reset window if firstResendTime is null or >1 minute passed
        if (user.getOtpFirstResendTime() == null ||
                now.getTime() - user.getOtpFirstResendTime().getTime() > 60 * 1000) {
            user.setOtpFirstResendTime(now);
            user.setOtpResendCount(0);
        }

        //  Increment resend count
        user.setOtpResendCount(user.getOtpResendCount() == null ? 1 : user.getOtpResendCount() + 1);

        //  If resend count >3 in 1-minute window → block 30 minutes
        if (user.getOtpResendCount() > 3) {
            user.setOtpBlockUntil(new Date(now.getTime() + 30 * 60 * 1000)); // block 30 minutes
            userRepo.save(user);
            return AuthResponse.builder()
                    .message("Maximum resend attempts reached. You are blocked for 30 minutes.")
                    .success(false)
                    .build();
        }

        //  Generate new OTP
        int verificationCode = OtpUtils.sixDigitOtp();
        user.setVerifyCode(String.valueOf(verificationCode));
        user.setVerifyCodeExpiry(new Date(System.currentTimeMillis() + 2 * 60 * 1000));
        user.setLastOtpSentAt(now);

        // Send email before saving the new OTP so a mail failure does not replace the user's usable code.
        try {
            MailBody mailBody = new MailBody(
                    user.getEmail(),
                    "Resend: Verify your account",
                    "Your verification code is: " + verificationCode + " (valid 2 minutes)"
            );
            emailUtils.sendMail(mailBody);
        } catch (MessagingException | MailException e) {
            e.printStackTrace();
            return AuthResponse.builder()
                    .message("Failed to send verification email!")
                    .success(false)
                    .build();
        }

        userRepo.save(user);

        return AuthResponse.builder()
                .message("Verification code resent successfully! (" + user.getOtpResendCount() + "/3)")
                .success(true)
                .build();
    }

    @Override
    public AuthResponse refreshSession(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = jwtUtils.getTokenFromCookie(request, Token.REFRESH);

        if (refreshToken == null || refreshToken.isBlank()) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Refresh token is missing")
                    .build();
        }

        final String email;
        try {
            email = jwtUtils.extractUsername(refreshToken);
        } catch (Exception ex) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Invalid refresh token")
                    .build();
        }

        Optional<User> optionalUser = userRepo.findByEmail(email);
        if (optionalUser.isEmpty()) {
            return AuthResponse.builder()
                    .success(false)
                    .message("User not found")
                    .build();
        }

        User user = optionalUser.get();

        if (user.getRefreshToken() == null || !user.getRefreshToken().equals(refreshToken)) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Refresh token does not match server session")
                    .build();
        }

        if (!jwtUtils.validateToken(refreshToken, user)) {
            return AuthResponse.builder()
                    .success(false)
                    .message("Refresh token expired or invalid")
                    .build();
        }

        Map<String, Object> claims = new HashMap<>();
        claims.put("name", user.getFirstname());
        claims.put("email", user.getEmail());

        jwtUtils.generateToken(claims, user, response, Token.ACCESS);

        return AuthResponse.builder()
                .success(true)
                .message("Token refreshed successfully")
                .firstname(user.getFirstname())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    @Override
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = jwtUtils.getTokenFromCookie(request, Token.REFRESH);
        if (refreshToken != null && !refreshToken.isBlank()) {
            userRepo.findByRefreshToken(refreshToken).ifPresent(user -> {
                user.setRefreshToken(null);
                userRepo.save(user);
            });
        }

        jwtUtils.removeToken(response, Token.ACCESS);
        jwtUtils.removeToken(response, Token.REFRESH);
        jwtUtils.removeToken(response, Token.VERIFY);
    }







}
