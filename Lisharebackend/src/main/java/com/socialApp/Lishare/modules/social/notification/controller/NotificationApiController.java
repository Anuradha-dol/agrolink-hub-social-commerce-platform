package com.socialApp.Lishare.modules.social.notification.controller;

import com.socialApp.Lishare.modules.platform.common.response.ApiResponse;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.social.notification.dto.NotificationResponse;
import com.socialApp.Lishare.modules.social.notification.dto.NotificationUnreadCountResponse;
import com.socialApp.Lishare.modules.social.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationApiController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<NotificationResponse>>> notifications(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "false") boolean unreadOnly
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Notifications fetched",
                notificationService.getNotifications(user.getUserId(), page, size, unreadOnly)
        ));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<NotificationUnreadCountResponse>> unreadCount(@AuthenticationPrincipal User user) {
        long count = notificationService.unreadCount(user.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Unread count fetched", new NotificationUnreadCountResponse(count)));
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<ApiResponse<NotificationResponse>> markRead(
            @AuthenticationPrincipal User user,
            @PathVariable Long notificationId
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Notification marked as read",
                notificationService.markAsRead(user.getUserId(), notificationId)
        ));
    }

    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllRead(@AuthenticationPrincipal User user) {
        notificationService.markAllRead(user.getUserId());
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read", null));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> clear(@AuthenticationPrincipal User user) {
        notificationService.clearAll(user.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Notifications cleared", null));
    }
}
