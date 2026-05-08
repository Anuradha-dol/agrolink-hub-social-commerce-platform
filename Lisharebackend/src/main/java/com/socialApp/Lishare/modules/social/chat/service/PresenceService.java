package com.socialApp.Lishare.modules.social.chat.service;

public interface PresenceService {
    void markOnline(Long userId);

    void markOffline(Long userId);

    boolean isOnline(Long userId);
}
