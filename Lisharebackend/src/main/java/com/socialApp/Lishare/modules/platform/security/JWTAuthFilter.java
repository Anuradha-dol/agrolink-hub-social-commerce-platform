package com.socialApp.Lishare.modules.platform.security;


import com.socialApp.Lishare.modules.platform.auth.dto.Token;
import com.socialApp.Lishare.modules.platform.utils.JwtUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Slf4j
public class JWTAuthFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String jwtToken = null;

        //  Try Authorization header first
        final String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            jwtToken = authHeader.substring(7);
        }

        //  Fallback: try cookie
        if (jwtToken == null) {
            jwtToken = jwtUtils.getTokenFromCookie(request, Token.ACCESS);
        }

        Authentication currentAuthentication = SecurityContextHolder.getContext().getAuthentication();

        // If token is missing, still normalize an OAuth2 session principal when present.
        if (jwtToken == null || jwtToken.isBlank()) {
            authenticateOAuth2UserIfPresent(currentAuthentication, request);
            filterChain.doFilter(request, response);
            return;
        }

        String userEmail = null;

        //Extract username from token
        try {
            userEmail = jwtUtils.extractUsername(jwtToken);
        } catch (Exception e) {
            log.warn("JWT parsing failed: {}", e.getMessage());
            authenticateOAuth2UserIfPresent(currentAuthentication, request);
        }

        // OAuth2 login leaves an OAuth2User in the security context. Controllers in
        // this app expect our UserDetails principal, so a valid JWT must take over.
        if (userEmail != null && shouldUseJwtAuthentication(currentAuthentication, userEmail)) {
            UserDetails userDetails = loadUserDetails(userEmail, "JWT");
            if (userDetails == null) {
                filterChain.doFilter(request, response);
                return;
            }

            if (jwtUtils.validateToken(jwtToken, userDetails)) {
                setUserDetailsAuthentication(userDetails, request);
                log.debug("JWT authenticated user: {}", userEmail);
            } else {
                log.warn("JWT validation failed for user: {}", userEmail);
            }
        }

        // Continue filter chain
        filterChain.doFilter(request, response);
    }

    private boolean shouldUseJwtAuthentication(Authentication currentAuthentication, String userEmail) {
        if (currentAuthentication == null) {
            return true;
        }

        Object principal = currentAuthentication.getPrincipal();
        if (!(principal instanceof UserDetails userDetails)) {
            return true;
        }

        return !userEmail.equalsIgnoreCase(userDetails.getUsername());
    }

    private void authenticateOAuth2UserIfPresent(Authentication currentAuthentication, HttpServletRequest request) {
        if (currentAuthentication == null || currentAuthentication.getPrincipal() instanceof UserDetails) {
            return;
        }

        if (!(currentAuthentication.getPrincipal() instanceof OAuth2User oauth2User)) {
            return;
        }

        String email = clean(oauth2User.getAttribute("email"));
        if (email == null) {
            return;
        }

        UserDetails userDetails = loadUserDetails(email, "OAuth2 session");
        if (userDetails == null) {
            return;
        }

        setUserDetailsAuthentication(userDetails, request);
        log.debug("OAuth2 session normalized to application user: {}", email);
    }

    private UserDetails loadUserDetails(String email, String source) {
        try {
            return userDetailsService.loadUserByUsername(email);
        } catch (Exception e) {
            log.warn("User not found for {}: {}", source, email);
            return null;
        }
    }

    private void setUserDetailsAuthentication(UserDetails userDetails, HttpServletRequest request) {
        UsernamePasswordAuthenticationToken authToken =
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authToken);
    }

    private String clean(Object value) {
        if (value == null) {
            return null;
        }
        String cleaned = String.valueOf(value).trim();
        return cleaned.isEmpty() ? null : cleaned;
    }
}

