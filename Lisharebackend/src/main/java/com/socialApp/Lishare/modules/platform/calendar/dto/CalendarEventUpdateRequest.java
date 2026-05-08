package com.socialApp.Lishare.modules.platform.calendar.dto;

import com.socialApp.Lishare.modules.platform.calendar.entity.CalendarEventType;
import com.socialApp.Lishare.modules.platform.calendar.entity.CalendarEventVisibility;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record CalendarEventUpdateRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 200, message = "Title must be at most 200 characters")
        String title,

        @Size(max = 2000, message = "Description must be at most 2000 characters")
        String description,

        @Size(max = 300, message = "Location must be at most 300 characters")
        String location,

        @NotNull(message = "Event type is required")
        CalendarEventType type,

        @NotNull(message = "Visibility is required")
        CalendarEventVisibility visibility,

        @NotNull(message = "Start date/time is required")
        LocalDateTime startsAt,

        LocalDateTime endsAt,

        @Min(value = 1, message = "Reminder must be at least 1 minute before")
        @Max(value = 10080, message = "Reminder must be at most 10080 minutes before")
        Integer ownerReminderMinutesBefore
) {}
