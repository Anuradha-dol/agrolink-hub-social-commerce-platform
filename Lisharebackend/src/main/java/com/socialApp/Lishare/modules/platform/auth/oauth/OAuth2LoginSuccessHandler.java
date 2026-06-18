package com.socialApp.Lishare.modules.platform.auth.oauth;

import com.socialApp.Lishare.modules.platform.auth.dto.Token;
import com.socialApp.Lishare.modules.platform.common.enums.Role;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.platform.user.repository.UserRepo;
import com.socialApp.Lishare.modules.platform.utils.JwtUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    @Value("${app.oauth2.success-redirect:http://localhost:5173/oauth2/callback}")
    private String successRedirect;

    @Value("${app.oauth2.failure-redirect:http://localhost:5173/login}")
    private String failureRedirect;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        try {
            OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();
            String email = clean(oauthUser.getAttribute("email"));
            if (email == null) {
                redirectFailure(response, "Google account did not return an email address.");
                return;
            }
            final String normalizedEmail = email.toLowerCase();

            User user = userRepo.findByEmailIgnoreCase(normalizedEmail)
                    .map(existing -> updateExistingUser(existing, oauthUser))
                    .orElseGet(() -> createUser(normalizedEmail, oauthUser));

            if (user.getRole() == null) {
                user.setRole(Role.ROLE_USER);
            }

            if (!user.isAccountNonLocked()) {
                redirectFailure(response, "Your account is suspended. Please contact support.");
                return;
            }

            user.setIsVerified(true);
            user.setVerifyCode(null);
            user.setVerifyCodeExpiry(null);

            Map<String, Object> claims = new HashMap<>();
            claims.put("name", user.getFirstname());
            claims.put("email", user.getEmail());

            String refreshToken = jwtUtils.generateToken(claims, user, response, Token.REFRESH);
            jwtUtils.generateToken(claims, user, response, Token.ACCESS);
            user.setRefreshToken(refreshToken);

            User savedUser = userRepo.save(user);
            response.sendRedirect(UriComponentsBuilder.fromUriString(successRedirect)
                    .queryParam("oauth2", "success")
                    .queryParam("role", savedUser.getRole().name())
                    .build()
                    .toUriString());
        } catch (Exception ex) {
            log.error("Google OAuth2 sign in failed while creating local session", ex);
            redirectFailure(response, "Google sign in failed.");
        }
    }

    private User updateExistingUser(User user, OAuth2User oauthUser) {
        if (isBlank(user.getFirstname())) {
            user.setFirstname(firstName(oauthUser));
        }
        if (isBlank(user.getLastName())) {
            user.setLastName(lastName(oauthUser));
        }
        if (isBlank(user.getImageUrl())) {
            user.setImageUrl(clean(oauthUser.getAttribute("picture")));
        }
        return user;
    }

    private User createUser(String email, OAuth2User oauthUser) {
        User user = new User();
        user.setFirstname(firstName(oauthUser));
        user.setLastName(lastName(oauthUser));
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode("oauth2-google-" + UUID.randomUUID()));
        user.setImageUrl(clean(oauthUser.getAttribute("picture")));
        user.setRole(Role.ROLE_USER);
        user.setIsVerified(true);
        user.setLastOtpSentAt(new Date());
        return user;
    }

    private String firstName(OAuth2User oauthUser) {
        String givenName = clean(oauthUser.getAttribute("given_name"));
        if (givenName != null) {
            return givenName;
        }

        String name = clean(oauthUser.getAttribute("name"));
        if (name == null) {
            return "Google";
        }

        String[] parts = name.split("\\s+", 2);
        return clean(parts[0]) == null ? "Google" : parts[0];
    }

    private String lastName(OAuth2User oauthUser) {
        String familyName = clean(oauthUser.getAttribute("family_name"));
        if (familyName != null) {
            return familyName;
        }

        String name = clean(oauthUser.getAttribute("name"));
        if (name != null) {
            String[] parts = name.split("\\s+", 2);
            if (parts.length > 1 && clean(parts[1]) != null) {
                return parts[1];
            }
        }

        return "User";
    }

    private void redirectFailure(HttpServletResponse response, String message) throws IOException {
        response.sendRedirect(UriComponentsBuilder.fromUriString(failureRedirect)
                .queryParam("oauth2", "failed")
                .queryParam("message", message)
                .build()
                .toUriString());
    }

    private String clean(Object value) {
        if (value == null) {
            return null;
        }
        String cleaned = String.valueOf(value).trim();
        return cleaned.isEmpty() ? null : cleaned;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
