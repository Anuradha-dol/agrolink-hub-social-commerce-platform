package com.socialApp.Lishare.modules.social.chat.serviceImpl;

import com.socialApp.Lishare.modules.social.chat.service.PresenceService;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PresenceServiceImpl implements PresenceService {

    private final Set<Long> onlineUsers = ConcurrentHashMap.newKeySet();

    @Override
    public void markOnline(Long userId) {
        if (userId != null) {
            onlineUsers.add(userId);
        }
    }

    @Override
    public void markOffline(Long userId) {
        if (userId != null) {
            onlineUsers.remove(userId);
        }
    }

    @Override
    public boolean isOnline(Long userId) {
        return userId != null && onlineUsers.contains(userId);
    }
}
