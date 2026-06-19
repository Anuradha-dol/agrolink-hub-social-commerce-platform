package com.socialApp.Lishare.modules.social.notification.service;

import com.socialApp.Lishare.modules.social.notification.entity.Notification;
import com.socialApp.Lishare.modules.social.notification.dto.NotificationResponse;
import org.springframework.data.domain.Page;

public interface NotificationService {
    Notification publish(Notification notification);

    Page<NotificationResponse> getNotifications(Long userId, int page, int size, boolean unreadOnly);

    NotificationResponse markAsRead(Long userId, Long notificationId);

    void markAllRead(Long userId);

    void deleteNotification(Long userId, Long notificationId);

    void clearAll(Long userId);

    long unreadCount(Long userId);
}
