package com.socialApp.Lishare.modules.platform.calendar.service;

import com.socialApp.Lishare.modules.platform.calendar.dto.*;
import org.springframework.data.domain.Page;

import java.time.LocalDateTime;

public interface CalendarEventService {

    CalendarEventResponse createEvent(Long userId, CalendarEventCreateRequest request);

    Page<CalendarEventResponse> getVisibleEvents(Long userId, LocalDateTime from, LocalDateTime to, int page, int size);

    Page<CalendarEventResponse> getMyEvents(Long userId, LocalDateTime from, LocalDateTime to, int page, int size);

    CalendarEventResponse getEvent(Long userId, Long eventId);

    CalendarEventResponse updateEvent(Long userId, Long eventId, CalendarEventUpdateRequest request);

    void deleteEvent(Long userId, Long eventId);

    CalendarReminderResponse subscribeReminder(Long userId, Long eventId, CalendarReminderRequest request);

    void unsubscribeReminder(Long userId, Long eventId);

    Page<CalendarReminderResponse> getMyReminders(Long userId, int page, int size);

    int dispatchDueReminders();
}
