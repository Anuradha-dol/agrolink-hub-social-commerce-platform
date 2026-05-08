package com.socialApp.Lishare.controller;

import com.socialApp.Lishare.Service.interfaces.FollowService;
import com.socialApp.Lishare.dtos.postdTOs.NotificationDTO;
import com.socialApp.Lishare.entities.Notification;
import com.socialApp.Lishare.entities.User;
import com.socialApp.Lishare.repos.NotificationRepository;
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
                    User notifUser = n.getUser();

                    boolean isFollowing = notifUser != null &&
                            followService.isFollowing(currentUser.getUserId(), notifUser.getUserId());

                    boolean isFollower = notifUser != null &&
                            followService.isFollowing(notifUser.getUserId(), currentUser.getUserId());

                    return NotificationDTO.builder()
                            .id(n.getId())
                            .message(n.getMessage())
                            .read(n.isRead())
                            .createdAt(n.getCreatedAt())
                            .userId(notifUser != null ? notifUser.getUserId() : null)
                            .firstName(notifUser != null ? notifUser.getFirstname() : null)
                            .lastName(notifUser != null ? notifUser.getLastName() : null)
                            .userId(n.getUser().getUserId())
                            .isFollowing(isFollowing)
                            .isFollower(isFollower)
                            .build();
                })
                .toList();

        return ResponseEntity.ok(response);
    }
}
