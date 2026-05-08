package com.socialApp.Lishare.modules.platform.calendar.dto;

import com.socialApp.Lishare.modules.platform.calendar.entity.CalendarEventType;
import com.socialApp.Lishare.modules.platform.calendar.entity.CalendarEventVisibility;

import java.time.LocalDateTime;

public record CalendarEventResponse(
        Long id,
        Long ownerId,
        String ownerName,
        String title,
        String description,
        String location,
        CalendarEventType type,
        CalendarEventVisibility visibility,
        LocalDateTime startsAt,
        LocalDateTime endsAt,
        boolean cancelled,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        boolean editable,
        Integer myReminderMinutesBefore,
        LocalDateTime myReminderAt,
        boolean myReminderNotified
) {}
