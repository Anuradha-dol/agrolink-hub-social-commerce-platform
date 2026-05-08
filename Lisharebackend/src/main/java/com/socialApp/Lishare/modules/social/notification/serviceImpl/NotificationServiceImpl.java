package com.socialApp.Lishare.modules.social.notification.serviceImpl;

import com.socialApp.Lishare.modules.social.notification.entity.Notification;
import com.socialApp.Lishare.modules.social.notification.dto.NotificationResponse;
import com.socialApp.Lishare.modules.social.notification.mapper.NotificationMapper;
import com.socialApp.Lishare.modules.social.notification.service.NotificationService;
import com.socialApp.Lishare.modules.social.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationMapper mapper;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public Notification publish(Notification notification) {
        Notification saved = notificationRepository.save(notification);
        Long userId = saved.getUser() != null ? saved.getUser().getUserId() : null;
        if (userId != null) {
            NotificationResponse payload = mapper.toResponse(saved);
            messagingTemplate.convertAndSend("/topic/notifications/" + userId, payload);
            messagingTemplate.convertAndSendToUser(String.valueOf(userId), "/queue/notifications", payload);
        }
        return saved;
    }

    @Override
    public Page<NotificationResponse> getNotifications(Long userId, int page, int size, boolean unreadOnly) {
        PageRequest pageable = PageRequest.of(page, size);
        Page<Notification> notifications = unreadOnly
                ? notificationRepository.findByUserUserIdAndReadFalseOrderByCreatedAtDesc(userId, pageable)
                : notificationRepository.findByUserUserIdOrderByCreatedAtDesc(userId, pageable);
        return notifications.map(mapper::toResponse);
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (notification.getUser() == null || !notification.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("You are not allowed to update this notification");
        }
        notification.setRead(true);
        return mapper.toResponse(notificationRepository.save(notification));
    }

    @Override
    @Transactional
    public void markAllRead(Long userId) {
        notificationRepository.markAllReadByUserId(userId);
    }

    @Override
    @Transactional
    public void clearAll(Long userId) {
        notificationRepository.deleteAllByUserId(userId);
    }

    @Override
    public long unreadCount(Long userId) {
        return notificationRepository.countByUserUserIdAndReadFalse(userId);
    }
}
