package com.socialApp.Lishare.modules.social.notification.mapper;

import com.socialApp.Lishare.modules.social.notification.entity.Notification;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.social.notification.dto.NotificationResponse;
import org.springframework.stereotype.Component;

@Component
public class NotificationMapper {

    public NotificationResponse toResponse(Notification notification) {
        User actor = notification.getActorUser();
        String actorName = null;
        Long actorId = null;
        if (actor != null) {
            actorId = actor.getUserId();
            actorName = actor.getFirstname() + " " + actor.getLastName();
        }

        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getMessage(),
                notification.isRead(),
                notification.getCreatedAt(),
                actorId,
                actorName,
                notification.getReferenceId(),
                notification.getReferenceType()
        );
    }
}
