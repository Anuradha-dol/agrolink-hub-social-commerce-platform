package com.socialApp.Lishare.modules.platform.calendar.controller;

import com.socialApp.Lishare.modules.platform.calendar.dto.*;
import com.socialApp.Lishare.modules.platform.calendar.service.CalendarEventService;
import com.socialApp.Lishare.modules.platform.common.response.ApiResponse;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
public class CalendarEventController {

    private final CalendarEventService calendarEventService;

    @PostMapping("/events")
    public ResponseEntity<ApiResponse<CalendarEventResponse>> createEvent(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CalendarEventCreateRequest request
    ) {
        CalendarEventResponse response = calendarEventService.createEvent(user.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success("Calendar event created", response));
    }

    @GetMapping("/events")
    public ResponseEntity<ApiResponse<Page<CalendarEventResponse>>> getVisibleEvents(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<CalendarEventResponse> events = calendarEventService.getVisibleEvents(user.getUserId(), from, to, page, size);
        return ResponseEntity.ok(ApiResponse.success("Calendar events fetched", events));
    }

    @GetMapping("/events/mine")
    public ResponseEntity<ApiResponse<Page<CalendarEventResponse>>> getMyEvents(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<CalendarEventResponse> events = calendarEventService.getMyEvents(user.getUserId(), from, to, page, size);
        return ResponseEntity.ok(ApiResponse.success("My calendar events fetched", events));
    }

    @GetMapping("/events/{eventId}")
    public ResponseEntity<ApiResponse<CalendarEventResponse>> getEvent(
            @AuthenticationPrincipal User user,
            @PathVariable Long eventId
    ) {
        CalendarEventResponse response = calendarEventService.getEvent(user.getUserId(), eventId);
        return ResponseEntity.ok(ApiResponse.success("Calendar event fetched", response));
    }

    @PutMapping("/events/{eventId}")
    public ResponseEntity<ApiResponse<CalendarEventResponse>> updateEvent(
            @AuthenticationPrincipal User user,
            @PathVariable Long eventId,
            @Valid @RequestBody CalendarEventUpdateRequest request
    ) {
        CalendarEventResponse response = calendarEventService.updateEvent(user.getUserId(), eventId, request);
        return ResponseEntity.ok(ApiResponse.success("Calendar event updated", response));
    }

    @DeleteMapping("/events/{eventId}")
    public ResponseEntity<ApiResponse<Void>> deleteEvent(
            @AuthenticationPrincipal User user,
            @PathVariable Long eventId
    ) {
        calendarEventService.deleteEvent(user.getUserId(), eventId);
        return ResponseEntity.ok(ApiResponse.success("Calendar event deleted", null));
    }

    @PostMapping("/events/{eventId}/remind-me")
    public ResponseEntity<ApiResponse<CalendarReminderResponse>> remindMe(
            @AuthenticationPrincipal User user,
            @PathVariable Long eventId,
            @Valid @RequestBody CalendarReminderRequest request
    ) {
        CalendarReminderResponse response = calendarEventService.subscribeReminder(user.getUserId(), eventId, request);
        return ResponseEntity.ok(ApiResponse.success("Reminder subscribed", response));
    }

    @DeleteMapping("/events/{eventId}/remind-me")
    public ResponseEntity<ApiResponse<Void>> stopReminder(
            @AuthenticationPrincipal User user,
            @PathVariable Long eventId
    ) {
        calendarEventService.unsubscribeReminder(user.getUserId(), eventId);
        return ResponseEntity.ok(ApiResponse.success("Reminder removed", null));
    }

    @GetMapping("/reminders")
    public ResponseEntity<ApiResponse<Page<CalendarReminderResponse>>> getMyReminders(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<CalendarReminderResponse> reminders = calendarEventService.getMyReminders(user.getUserId(), page, size);
        return ResponseEntity.ok(ApiResponse.success("Calendar reminders fetched", reminders));
    }
}
