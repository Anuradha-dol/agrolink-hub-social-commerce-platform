package com.socialApp.Lishare.dtos.postdTOs;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationResponse {
    private Long id; // notification id
    private String message;
    private boolean read;
    private LocalDateTime createdAt;

    private Long userId;      // ID of the user who triggered the notification
    private String firstName; // their first name
    private String lastName;  // their last name
}

