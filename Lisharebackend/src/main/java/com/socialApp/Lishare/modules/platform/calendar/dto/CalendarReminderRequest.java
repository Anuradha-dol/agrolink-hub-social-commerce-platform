package com.socialApp.Lishare.modules.platform.calendar.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CalendarReminderRequest(
        @NotNull(message = "minutesBefore is required")
        @Min(value = 1, message = "Reminder must be at least 1 minute before")
        @Max(value = 10080, message = "Reminder must be at most 10080 minutes before")
        Integer minutesBefore
) {}
