package com.socialApp.Lishare.modules.social.chat.serviceImpl;

import com.socialApp.Lishare.modules.social.chat.service.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class PresenceServiceImpl implements PresenceService {

    private final Set<Long> onlineUsers = ConcurrentHashMap.newKeySet();
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public void markOnline(Long userId) {
        if (userId != null) {
            onlineUsers.add(userId);
            broadcastStatus(userId, true);
        }
    }

    @Override
    public void markOffline(Long userId) {
        if (userId != null) {
            onlineUsers.remove(userId);
            broadcastStatus(userId, false);
        }
    }

    @Override
    public boolean isOnline(Long userId) {
        return userId != null && onlineUsers.contains(userId);
    }

    private void broadcastStatus(Long userId, boolean online) {
        messagingTemplate.convertAndSend("/topic/presence", (Object) Map.of(
            "userId", userId,
            "status", online ? "ONLINE" : "OFFLINE"
        ));
    }
}
