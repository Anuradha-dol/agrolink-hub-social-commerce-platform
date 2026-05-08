package com.socialApp.Lishare.modules.social.notification.controller;

import com.socialApp.Lishare.modules.social.follow.service.FollowService;
import com.socialApp.Lishare.modules.social.notification.dto.NotificationDTO;
import com.socialApp.Lishare.modules.social.notification.entity.Notification;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.social.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final FollowService followService;

    @GetMapping
    public ResponseEntity<List<NotificationDTO>> getNotifications(
            @AuthenticationPrincipal User currentUser) {

        List<Notification> notifications =
                notificationRepository
                        .findByUserUserIdOrderByCreatedAtDesc(currentUser.getUserId());

        List<NotificationDTO> response = notifications.stream()
                .map(n -> {
                    User notifUser = n.getActorUser() != null ? n.getActorUser() : n.getUser();

                    boolean isFollowing = false;
                    boolean isFollower = false;

                    if (notifUser != null) {
                        isFollowing = followService.isFollowing(currentUser.getUserId(), notifUser.getUserId());
                        isFollower = followService.isFollowing(notifUser.getUserId(), currentUser.getUserId());
                    }

                    return NotificationDTO.builder()
                            .id(n.getId())
                            .message(n.getMessage())
                            .read(n.isRead())
                            .createdAt(n.getCreatedAt())
                            .userId(notifUser != null ? notifUser.getUserId() : null)
                            .firstName(notifUser != null ? notifUser.getFirstname() : null)
                            .lastName(notifUser != null ? notifUser.getLastName() : null)
                            .isFollowing(isFollowing)
                            .isFollower(isFollower)
                            .build();
                })
                .toList();

        return ResponseEntity.ok(response);
    }
}
