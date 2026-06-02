package com.socialApp.Lishare.modules.platform.auth.controller;

import com.socialApp.Lishare.modules.platform.auth.service.AuthService;
import com.socialApp.Lishare.modules.platform.auth.dto.AuthResponse;
import com.socialApp.Lishare.modules.platform.auth.dto.LoginRequest;
import com.socialApp.Lishare.modules.platform.user.dto.UserDto;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

@RestController
@RequestMapping({"/auth", "/api/auth"})
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Value("${cookie.secure:false}")
    private boolean cookieSecure;

    @Value("${cookie.same-site:Lax}")
    private String cookieSameSite;

    @Value("${cookie.domain:}")
    private String cookieDomain;

    @Value("${cookie.path:/}")
    private String cookiePath;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody UserDto.RegisterRequest registerRequest,
                                                 HttpServletResponse response) {
        AuthResponse res = authService.signUp(registerRequest);

        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from("userEmail", registerRequest.email())
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path(cookiePath)
                .maxAge(Duration.ofMinutes(30));

        if (cookieDomain != null && !cookieDomain.isBlank()) {
            builder.domain(cookieDomain);
        }

        response.addHeader(HttpHeaders.SET_COOKIE, builder.build().toString());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest loginRequest,
                                              HttpServletResponse response) {
        return ResponseEntity.ok(authService.SignIn(loginRequest, response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(HttpServletRequest request, HttpServletResponse response) {
        AuthResponse authResponse = authService.refreshSession(request, response);
        if (!authResponse.isSuccess()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(authResponse);
        }

        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/logout")
    public ResponseEntity<AuthResponse> logout(HttpServletRequest request, HttpServletResponse response) {
        authService.logout(request, response);
        clearCookie(response, "userEmail");
        clearCookie(response, "forgotEmail");

        return ResponseEntity.ok(AuthResponse.builder()
                .success(true)
                .message("Logged out successfully")
                .build());
    }

    @PostMapping("/verify-code")
    public ResponseEntity<AuthResponse> verifyCode(@Valid @RequestBody UserDto.VerifyCodeDto verifyCodeDto,
                                                   HttpServletRequest request) {

        String email = getCookieValue(request, "userEmail");
        if (email == null) {
            return ResponseEntity.badRequest()
                    .body(AuthResponse.builder()
                            .message("Email not found. Please start the process again.")
                            .success(false)
                            .build());
        }

        return ResponseEntity.ok(authService.verifyCode(email, verifyCodeDto.verifyCode()));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<AuthResponse> resendOtp(HttpServletRequest request) {
        String email = getCookieValue(request, "userEmail");
        if (email == null) {
            return ResponseEntity.badRequest()
                    .body(AuthResponse.builder()
                            .message("Email not found. Please start the process again.")
                            .success(false)
                            .build());
        }

        return ResponseEntity.ok(authService.resendOtp(email));
    }

    private String getCookieValue(HttpServletRequest request, String key) {
        if (request.getCookies() == null) {
            return null;
        }

        for (Cookie cookie : request.getCookies()) {
            if (key.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }

        return null;
    }

    private void clearCookie(HttpServletResponse response, String name) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(name, "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(cookieSameSite)
                .path(cookiePath)
                .maxAge(0);

        if (cookieDomain != null && !cookieDomain.isBlank()) {
            builder.domain(cookieDomain);
        }

        response.addHeader(HttpHeaders.SET_COOKIE, builder.build().toString());
    }
}
