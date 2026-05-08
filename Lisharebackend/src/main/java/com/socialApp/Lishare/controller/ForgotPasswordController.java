package com.socialApp.Lishare.controller;

import com.socialApp.Lishare.Service.EmailService;
import com.socialApp.Lishare.dtos.MailBody;
import com.socialApp.Lishare.dtos.RecoveryChannel;
import com.socialApp.Lishare.dtos.Token;
import com.socialApp.Lishare.dtos.UserDto;
import com.socialApp.Lishare.entities.ForgotPassword;
import com.socialApp.Lishare.entities.User;
import com.socialApp.Lishare.repos.ForgotPasswordRepository;
import com.socialApp.Lishare.repos.UserRepo;
import com.socialApp.Lishare.utils.JwtUtils;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Date;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@RestController
@RequestMapping("/forgotpass")
@RequiredArgsConstructor
public class ForgotPasswordController {

    private final JwtUtils jwtUtils;
    private final UserRepo userRepo;
    private final EmailService emailService;
    private final ForgotPasswordRepository forgotPasswordRepository;
    private final PasswordEncoder passwordEncoder;

    // ================= SEND OTP =================
    @PostMapping("/send-otp")
    public ResponseEntity<String> sendOtp(@RequestBody Map<String, String> request,
                                          HttpServletResponse response) {

        String email = request.get("email");
        String tempEmail = request.get("tempEmail");
        String phoneNumber = request.get("phoneNumber");

        // 🔹 At least 2 of 3 must be provided
        int providedCount = 0;
        if (email != null && !email.isEmpty()) providedCount++;
        if (tempEmail != null && !tempEmail.isEmpty()) providedCount++;
        if (phoneNumber != null && !phoneNumber.isEmpty()) providedCount++;

        if (providedCount < 2) {
            return ResponseEntity.badRequest()
                    .body("At least 2 of email, tempEmail, or phoneNumber must be provided.");
        }

        // 🔹 Find user matching at least 2 identifiers
        Optional<User> userOpt = userRepo.findAll().stream()
                .filter(u -> {
                    int match = 0;
                    if (email != null && email.equals(u.getEmail())) match++;
                    if (tempEmail != null && tempEmail.equals(u.getTempEmail())) match++;
                    if (phoneNumber != null && phoneNumber.equals(u.getPhoneNumber())) match++;
                    return match >= 2;
                })
                .findFirst();

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("No user found matching the provided information.");
        }

        User user = userOpt.get();

        // 🔹 Generate OTP
        int otp = generateOtp();
        Date expirationTime = new Date(System.currentTimeMillis() + 5 * 60 * 1000); // 5 min

        ForgotPassword fp = forgotPasswordRepository.findByUser(user)
                .orElse(new ForgotPassword());
        fp.setUser(user);
        fp.setOtp(otp);
        fp.setExpirationTime(expirationTime);
        fp.setLastSentAt(new Date());
        fp.setResendCount(0);
        fp.setFirstResendTime(null);
        fp.setBlockUntil(null);

        // 🔹 Determine recovery channel based on rules
        boolean emailVerified = email != null && email.equals(user.getEmail());
        boolean tempEmailVerified = tempEmail != null && tempEmail.equals(user.getTempEmail());
        boolean phoneVerified = phoneNumber != null && phoneNumber.equals(user.getPhoneNumber());

        RecoveryChannel recoveryChannel;
        if (emailVerified) {
            recoveryChannel = RecoveryChannel.EMAIL;
        } else if (!emailVerified && tempEmailVerified) {
            recoveryChannel = RecoveryChannel.BACKUP_EMAIL;
        } else {
            recoveryChannel = phoneVerified ? RecoveryChannel.PHONE : RecoveryChannel.EMAIL;
        }

        fp.setRecoveryChannel(recoveryChannel);
        forgotPasswordRepository.save(fp);

        // 🔹 Send OTP
        switch (recoveryChannel) {
            case EMAIL -> sendOtpEmail(user.getEmail(), otp);
            case BACKUP_EMAIL -> sendOtpEmail(user.getTempEmail(), otp);
            case PHONE -> sendOtpSms(user.getPhoneNumber(), otp);
        }

        // 🔹 Save email in cookie for OTP verification
        Cookie emailCookie = new Cookie("forgotEmail", user.getEmail());
        emailCookie.setHttpOnly(true);
        emailCookie.setMaxAge(10 * 60); // 10 minutes
        emailCookie.setPath("/");
        response.addCookie(emailCookie);

        return ResponseEntity.ok("OTP sent successfully.");
    }

    // ================= RESEND OTP =================
    @PostMapping("/resend-otp")
    public ResponseEntity<String> resendOtp(HttpServletRequest request,
                                            HttpServletResponse response) {

        String email = getEmailFromCookie(request);
        if (email == null) {
            return ResponseEntity.badRequest()
                    .body("Email not found. Please start forgot password process again.");
        }

        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Invalid email"));

        ForgotPassword fp = forgotPasswordRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("OTP not requested yet"));

        Date now = new Date();

        // 🔹 Block check
        if (fp.getBlockUntil() != null && now.before(fp.getBlockUntil())) {
            long remaining = (fp.getBlockUntil().getTime() - now.getTime()) / 1000;
            return ResponseEntity.badRequest()
                    .body("Maximum resend attempts reached. Wait " + remaining + " seconds.");
        }

        // 🔹 Reset resend count every 60s
        if (fp.getFirstResendTime() == null || now.getTime() - fp.getFirstResendTime().getTime() > 60 * 1000) {
            fp.setFirstResendTime(now);
            fp.setResendCount(0);
        }

        fp.setResendCount(fp.getResendCount() == null ? 1 : fp.getResendCount() + 1);

        if (fp.getResendCount() > 3) {
            fp.setBlockUntil(new Date(now.getTime() + 30 * 60 * 1000)); // 30 min block
            forgotPasswordRepository.save(fp);
            return ResponseEntity.badRequest()
                    .body("Maximum resend attempts reached. Blocked for 30 minutes.");
        }

        // 🔹 Generate new OTP and update expiration
        int newOtp = generateOtp();
        fp.setOtp(newOtp);
        fp.setExpirationTime(new Date(System.currentTimeMillis() + 5 * 60 * 1000)); // 5 min
        forgotPasswordRepository.save(fp);

        // 🔹 Resend using the same channel
        RecoveryChannel recoveryChannel = fp.getRecoveryChannel();
        switch (recoveryChannel) {
            case EMAIL -> sendOtpEmail(user.getEmail(), newOtp);
            case BACKUP_EMAIL -> sendOtpEmail(user.getTempEmail(), newOtp);
            case PHONE -> sendOtpSms(user.getPhoneNumber(), newOtp);
        }

        // 🔹 Keep email cookie valid
        Cookie emailCookie = new Cookie("forgotEmail", user.getEmail());
        emailCookie.setHttpOnly(true);
        emailCookie.setMaxAge(10 * 60); // 10 minutes
        emailCookie.setPath("/");
        response.addCookie(emailCookie);

        return ResponseEntity.ok("OTP resent successfully (" + fp.getResendCount() + "/3)");
    }

    // ================= VERIFY OTP =================
    @PostMapping("/verify-otp")
    public ResponseEntity<String> verifyOtp(@RequestBody Map<String, String> request,
                                            HttpServletRequest httpRequest,
                                            HttpServletResponse response) {
        Integer otp = Integer.valueOf(request.get("otp"));

        String email = getEmailFromCookie(httpRequest);
        if (email == null) {
            return ResponseEntity.badRequest()
                    .body("Email not found. Please start forgot password process again.");
        }

        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Invalid email"));

        ForgotPassword fp = forgotPasswordRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("No OTP request found"));

        if (!fp.getOtp().equals(otp)) {
            return ResponseEntity.badRequest().body("Invalid OTP");
        }

        if (fp.getExpirationTime().before(new Date())) {
            forgotPasswordRepository.delete(fp);
            return ResponseEntity.status(HttpStatus.EXPECTATION_FAILED)
                    .body("OTP expired");
        }

        // ✅ generate VERIFY token in cookie
        jwtUtils.generateToken(Map.of(), user, response, Token.VERIFY);

        return ResponseEntity.ok("OTP verified successfully");
    }

    // ================= CHANGE PASSWORD =================
    @PostMapping("/change-password")
    public ResponseEntity<String> changePassword(HttpServletRequest request,
                                                 HttpServletResponse response,
                                                 @RequestBody UserDto.ChangePassword dto) {

        String token = jwtUtils.getTokenFromCookie(request, Token.VERIFY);
        if (token == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Reset token missing");
        }

        String email = jwtUtils.extractUsername(token);
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Invalid token"));

        if (!dto.password().equals(dto.repeatPassword())) {
            return ResponseEntity.badRequest().body("Passwords do not match");
        }

        user.setPassword(passwordEncoder.encode(dto.password()));
        userRepo.save(user);

        forgotPasswordRepository.findByUser(user)
                .ifPresent(forgotPasswordRepository::delete);

        jwtUtils.removeToken(response, Token.VERIFY);

        return ResponseEntity.ok("Password changed successfully");
    }

    // ================= HELPERS =================
    private int generateOtp() {
        return new Random().nextInt(100_000, 999_999);
    }

    private void sendOtpEmail(String email, int otp) {
        emailService.sendSimpleMessasge(
                new MailBody(email, "OTP for Forgot Password",
                        "Your OTP is: " + otp + " (valid for 5 minutes)")
        );
    }

    private void sendOtpSms(String phoneNumber, int otp) {
        // Implement your SMS provider logic here
        System.out.println("Send OTP " + otp + " to phone " + phoneNumber);
    }

    private String getEmailFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        for (Cookie c : request.getCookies()) {
            if ("forgotEmail".equals(c.getName())) return c.getValue();
        }
        return null;
    }
}