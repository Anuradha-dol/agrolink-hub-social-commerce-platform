package com.socialApp.Lishare.modules.platform.calendar.serviceImpl;

import com.socialApp.Lishare.modules.platform.calendar.dto.*;
import com.socialApp.Lishare.modules.platform.calendar.entity.CalendarEvent;
import com.socialApp.Lishare.modules.platform.calendar.entity.CalendarEventVisibility;
import com.socialApp.Lishare.modules.platform.calendar.entity.CalendarReminderSubscription;
import com.socialApp.Lishare.modules.platform.calendar.repository.CalendarEventRepository;
import com.socialApp.Lishare.modules.platform.calendar.repository.CalendarReminderSubscriptionRepository;
import com.socialApp.Lishare.modules.platform.calendar.service.CalendarEventService;
import com.socialApp.Lishare.modules.platform.user.entity.User;
import com.socialApp.Lishare.modules.platform.user.repository.UserRepo;
import com.socialApp.Lishare.modules.social.notification.entity.Notification;
import com.socialApp.Lishare.modules.social.notification.entity.NotificationType;
import com.socialApp.Lishare.modules.social.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CalendarEventServiceImpl implements CalendarEventService {

    private static final int REMINDER_DISPATCH_BATCH_SIZE = 200;
    private static final DateTimeFormatter REMINDER_TIME_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final LocalDateTime WINDOW_START_DEFAULT = LocalDateTime.of(1970, 1, 1, 0, 0);
    private static final LocalDateTime WINDOW_END_DEFAULT = LocalDateTime.of(9999, 12, 31, 23, 59, 59);

    private final CalendarEventRepository eventRepository;
    private final CalendarReminderSubscriptionRepository reminderRepository;
    private final UserRepo userRepo;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public CalendarEventResponse createEvent(Long userId, CalendarEventCreateRequest request) {
        validateEventWindow(request.startsAt(), request.endsAt());
        User owner = findUser(userId);

        CalendarEvent event = CalendarEvent.builder()
                .owner(owner)
                .title(request.title().trim())
                .description(normalizeNullableText(request.description()))
                .location(normalizeNullableText(request.location()))
                .type(request.type())
                .visibility(request.visibility())
                .startsAt(request.startsAt())
                .endsAt(request.endsAt())
                .cancelled(false)
                .build();

        CalendarEvent saved = eventRepository.save(event);
        if (request.ownerReminderMinutesBefore() != null) {
            upsertReminder(saved, owner, request.ownerReminderMinutesBefore(), true);
        }

        return mapEvent(saved, userId);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CalendarEventResponse> getVisibleEvents(Long userId, LocalDateTime from, LocalDateTime to, int page, int size) {
        TimeWindow window = normalizeWindow(from, to);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "startsAt"));
        return eventRepository.findVisibleEvents(userId, window.from(), window.to(), pageable)
                .map(event -> mapEvent(event, userId));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CalendarEventResponse> getMyEvents(Long userId, LocalDateTime from, LocalDateTime to, int page, int size) {
        TimeWindow window = normalizeWindow(from, to);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "startsAt"));
        return eventRepository.findMyEvents(userId, window.from(), window.to(), pageable)
                .map(event -> mapEvent(event, userId));
    }

    @Override
    @Transactional(readOnly = true)
    public CalendarEventResponse getEvent(Long userId, Long eventId) {
        CalendarEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Calendar event not found"));

        if (!canView(event, userId)) {
            throw new RuntimeException("You are not allowed to view this event");
        }
        return mapEvent(event, userId);
    }

    @Override
    @Transactional
    public CalendarEventResponse updateEvent(Long userId, Long eventId, CalendarEventUpdateRequest request) {
        CalendarEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Calendar event not found"));

        ensureOwner(event, userId);
        validateEventWindow(request.startsAt(), request.endsAt());

        event.setTitle(request.title().trim());
        event.setDescription(normalizeNullableText(request.description()));
        event.setLocation(normalizeNullableText(request.location()));
        event.setType(request.type());
        event.setVisibility(request.visibility());
        event.setStartsAt(request.startsAt());
        event.setEndsAt(request.endsAt());

        CalendarEvent saved = eventRepository.save(event);

        // Keep reminder lead time settings but recalculate reminder timestamp after event edits.
        List<CalendarReminderSubscription> subscriptions = reminderRepository.findByEventId(saved.getId());
        for (CalendarReminderSubscription subscription : subscriptions) {
            if (!subscription.isActive()) {
                continue;
            }
            subscription.setRemindAt(calculateRemindAt(saved.getStartsAt(), subscription.getMinutesBefore()));
            subscription.setNotifiedAt(null);
        }
        if (!subscriptions.isEmpty()) {
            reminderRepository.saveAll(subscriptions);
        }

        if (request.ownerReminderMinutesBefore() != null) {
            User owner = saved.getOwner();
            upsertReminder(saved, owner, request.ownerReminderMinutesBefore(), true);
        }

        return mapEvent(saved, userId);
    }

    @Override
    @Transactional
    public void deleteEvent(Long userId, Long eventId) {
        CalendarEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Calendar event not found"));

        ensureOwner(event, userId);
        event.setCancelled(true);
        eventRepository.save(event);

        List<CalendarReminderSubscription> subscriptions = reminderRepository.findByEventId(eventId);
        for (CalendarReminderSubscription subscription : subscriptions) {
            subscription.setActive(false);
        }
        if (!subscriptions.isEmpty()) {
            reminderRepository.saveAll(subscriptions);
        }
    }

    @Override
    @Transactional
    public CalendarReminderResponse subscribeReminder(Long userId, Long eventId, CalendarReminderRequest request) {
        CalendarEvent event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Calendar event not found"));

        if (event.isCancelled()) {
            throw new RuntimeException("Cannot add reminder to a cancelled event");
        }
        if (!canView(event, userId)) {
            throw new RuntimeException("You are not allowed to add reminder for this event");
        }

        User user = findUser(userId);
        CalendarReminderSubscription saved = upsertReminder(event, user, request.minutesBefore(), true);
        return mapReminder(saved);
    }

    @Override
    @Transactional
    public void unsubscribeReminder(Long userId, Long eventId) {
        CalendarReminderSubscription subscription = reminderRepository.findByEventIdAndUserUserId(eventId, userId)
                .orElseThrow(() -> new RuntimeException("Reminder subscription not found"));

        subscription.setActive(false);
        reminderRepository.save(subscription);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CalendarReminderResponse> getMyReminders(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "remindAt"));
        return reminderRepository.findByUserUserIdAndActiveTrue(userId, pageable)
                .map(this::mapReminder);
    }

    @Override
    @Transactional
    public int dispatchDueReminders() {
        LocalDateTime now = LocalDateTime.now();
        List<CalendarReminderSubscription> dueReminders = reminderRepository.findDueReminders(
                now,
                PageRequest.of(0, REMINDER_DISPATCH_BATCH_SIZE)
        );

        if (dueReminders.isEmpty()) {
            return 0;
        }

        int dispatched = 0;
        for (CalendarReminderSubscription reminder : dueReminders) {
            CalendarEvent event = reminder.getEvent();
            if (!reminder.isActive() || reminder.getNotifiedAt() != null) {
                continue;
            }

            if (event == null || event.isCancelled()) {
                reminder.setActive(false);
                continue;
            }

            if (event.getStartsAt().isBefore(now.minusMinutes(1))) {
                reminder.setActive(false);
                reminder.setNotifiedAt(now);
                continue;
            }

            String message = "Reminder: \"" + event.getTitle() + "\" starts at "
                    + event.getStartsAt().format(REMINDER_TIME_FORMAT);

            notificationService.publish(Notification.builder()
                    .user(reminder.getUser())
                    .actorUser(event.getOwner())
                    .message(message)
                    .type(NotificationType.EVENT_REMINDER)
                    .referenceId(event.getId())
                    .referenceType("CALENDAR_EVENT")
                    .read(false)
                    .createdAt(now)
                    .build());

            reminder.setNotifiedAt(now);
            dispatched++;
        }

        reminderRepository.saveAll(dueReminders);
        return dispatched;
    }

    private CalendarEventResponse mapEvent(CalendarEvent event, Long viewerUserId) {
        Optional<CalendarReminderSubscription> reminderOpt = reminderRepository
                .findByEventIdAndUserUserId(event.getId(), viewerUserId)
                .filter(CalendarReminderSubscription::isActive);

        CalendarReminderSubscription reminder = reminderOpt.orElse(null);
        String ownerName = event.getOwner().getFirstname() + " " + event.getOwner().getLastName();

        return new CalendarEventResponse(
                event.getId(),
                event.getOwner().getUserId(),
                ownerName.trim(),
                event.getTitle(),
                event.getDescription(),
                event.getLocation(),
                event.getType(),
                event.getVisibility(),
                event.getStartsAt(),
                event.getEndsAt(),
                event.isCancelled(),
                event.getCreatedAt(),
                event.getUpdatedAt(),
                event.getOwner().getUserId().equals(viewerUserId),
                reminder != null ? reminder.getMinutesBefore() : null,
                reminder != null ? reminder.getRemindAt() : null,
                reminder != null && reminder.getNotifiedAt() != null
        );
    }

    private CalendarReminderResponse mapReminder(CalendarReminderSubscription reminder) {
        CalendarEvent event = reminder.getEvent();
        return new CalendarReminderResponse(
                reminder.getId(),
                event.getId(),
                event.getTitle(),
                event.getStartsAt(),
                reminder.getMinutesBefore(),
                reminder.getRemindAt(),
                reminder.isActive(),
                reminder.getNotifiedAt()
        );
    }

    private CalendarReminderSubscription upsertReminder(
            CalendarEvent event,
            User user,
            int minutesBefore,
            boolean resetNotifiedAt
    ) {
        LocalDateTime remindAt = calculateRemindAt(event.getStartsAt(), minutesBefore);
        if (remindAt.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Reminder time is already in the past");
        }

        CalendarReminderSubscription reminder = reminderRepository
                .findByEventIdAndUserUserId(event.getId(), user.getUserId())
                .orElseGet(() -> CalendarReminderSubscription.builder()
                        .event(event)
                        .user(user)
                        .build());

        reminder.setMinutesBefore(minutesBefore);
        reminder.setRemindAt(remindAt);
        reminder.setActive(true);
        if (resetNotifiedAt) {
            reminder.setNotifiedAt(null);
        }
        return reminderRepository.save(reminder);
    }

    private LocalDateTime calculateRemindAt(LocalDateTime startsAt, int minutesBefore) {
        return startsAt.minusMinutes(minutesBefore);
    }

    private void validateEventWindow(LocalDateTime startsAt, LocalDateTime endsAt) {
        if (startsAt == null) {
            throw new IllegalArgumentException("Start date/time is required");
        }
        if (startsAt.isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Start date/time must be in the future");
        }
        if (endsAt != null && endsAt.isBefore(startsAt)) {
            throw new IllegalArgumentException("End date/time must be after start date/time");
        }
    }

    private User findUser(Long userId) {
        return userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private void ensureOwner(CalendarEvent event, Long userId) {
        if (!event.getOwner().getUserId().equals(userId)) {
            throw new RuntimeException("Only event owner can modify this event");
        }
    }

    private boolean canView(CalendarEvent event, Long userId) {
        return event.getOwner().getUserId().equals(userId)
                || event.getVisibility() == CalendarEventVisibility.PUBLIC;
    }

    private String normalizeNullableText(String text) {
        if (text == null) {
            return null;
        }
        String trimmed = text.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private TimeWindow normalizeWindow(LocalDateTime from, LocalDateTime to) {
        LocalDateTime resolvedFrom = from != null ? from : WINDOW_START_DEFAULT;
        LocalDateTime resolvedTo = to != null ? to : WINDOW_END_DEFAULT;
        if (resolvedTo.isBefore(resolvedFrom)) {
            throw new IllegalArgumentException("to must be after from");
        }
        return new TimeWindow(resolvedFrom, resolvedTo);
    }

    private record TimeWindow(LocalDateTime from, LocalDateTime to) {
    }
}
