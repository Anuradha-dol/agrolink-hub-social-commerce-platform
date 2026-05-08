package com.socialApp.Lishare.modules.platform.calendar.dto;

import java.time.LocalDateTime;

public record CalendarReminderResponse(
        Long id,
        Long eventId,
        String eventTitle,
        LocalDateTime eventStartsAt,
        Integer minutesBefore,
        LocalDateTime remindAt,
        boolean active,
        LocalDateTime notifiedAt
) {}
