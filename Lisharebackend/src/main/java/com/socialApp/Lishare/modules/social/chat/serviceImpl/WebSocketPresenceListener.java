package com.socialApp.Lishare.modules.social.chat.serviceImpl;

import com.socialApp.Lishare.modules.social.chat.service.PresenceService;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.platform.user.repository.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;

@Component
@RequiredArgsConstructor
public class WebSocketPresenceListener {

    private final PresenceService presenceService;
    private final UserRepo userRepo;

    @EventListener
    public void onConnected(SessionConnectedEvent event) {
        Principal principal = StompHeaderAccessor.wrap(event.getMessage()).getUser();
        markPresence(principal, true);
    }

    @EventListener
    public void onDisconnected(SessionDisconnectEvent event) {
        Principal principal = StompHeaderAccessor.wrap(event.getMessage()).getUser();
        markPresence(principal, false);
    }

    private void markPresence(Principal principal, boolean online) {
        if (principal == null || principal.getName() == null) {
            return;
        }

        User user = userRepo.findByEmail(principal.getName()).orElse(null);
        if (user == null) {
            return;
        }

        if (online) {
            presenceService.markOnline(user.getUserId());
        } else {
            presenceService.markOffline(user.getUserId());
        }
    }
}
