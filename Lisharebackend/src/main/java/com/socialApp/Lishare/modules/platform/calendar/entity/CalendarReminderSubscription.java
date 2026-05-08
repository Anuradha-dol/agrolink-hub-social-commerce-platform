package com.socialApp.Lishare.modules.platform.calendar.entity;

import com.socialApp.Lishare.modules.platform.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "calendar_reminder_subscriptions",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_calendar_reminder_event_user", columnNames = {"event_id", "user_id"})
        },
        indexes = {
                @Index(name = "idx_calendar_reminder_event_id", columnList = "event_id"),
                @Index(name = "idx_calendar_reminder_user_id", columnList = "user_id"),
                @Index(name = "idx_calendar_reminder_remind_at", columnList = "remind_at"),
                @Index(name = "idx_calendar_reminder_notified_at", columnList = "notified_at"),
                @Index(name = "idx_calendar_reminder_active", columnList = "active")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalendarReminderSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private CalendarEvent event;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "minutes_before", nullable = false)
    private Integer minutesBefore;

    @Column(name = "remind_at", nullable = false)
    private LocalDateTime remindAt;

    @Column(name = "notified_at")
    private LocalDateTime notifiedAt;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
