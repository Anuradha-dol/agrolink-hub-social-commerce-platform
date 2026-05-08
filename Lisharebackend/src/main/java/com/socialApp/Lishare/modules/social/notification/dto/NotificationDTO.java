package com.socialApp.Lishare.modules.social.notification.dto;


import lombok.*;

import java.time.LocalDateTime;

// NotificationDTO.java
@Data
@Builder
public class NotificationDTO {
    private Long id;
    private String message;
    private boolean read;
    private LocalDateTime createdAt;
    private Long userId;
    private String firstName;
    private String lastName;
    private Boolean isFollowing; // me -> them
    private Boolean isFollower;  // them -> me
}


