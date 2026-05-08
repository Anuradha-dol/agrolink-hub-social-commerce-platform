package com.socialApp.Lishare.modules.platform.calendar.serviceImpl;

import com.socialApp.Lishare.modules.platform.calendar.service.CalendarEventService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class CalendarReminderScheduler {

    private final CalendarEventService calendarEventService;

    @Scheduled(fixedDelayString = "${calendar.reminder.dispatch-interval-ms:30000}")
    public void dispatchDueReminders() {
        int count = calendarEventService.dispatchDueReminders();
        if (count > 0) {
            log.info("Dispatched {} calendar reminders", count);
        }
    }
}
