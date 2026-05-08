package com.socialApp.Lishare.modules.platform.calendar.repository;

import com.socialApp.Lishare.modules.platform.calendar.entity.CalendarReminderSubscription;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CalendarReminderSubscriptionRepository extends JpaRepository<CalendarReminderSubscription, Long> {

    Optional<CalendarReminderSubscription> findByEventIdAndUserUserId(Long eventId, Long userId);

    List<CalendarReminderSubscription> findByEventId(Long eventId);

    Page<CalendarReminderSubscription> findByUserUserIdAndActiveTrue(Long userId, Pageable pageable);

    @Query("""
            SELECT r
            FROM CalendarReminderSubscription r
            WHERE r.active = true
              AND r.notifiedAt IS NULL
              AND r.remindAt <= :now
            ORDER BY r.remindAt ASC
            """)
    List<CalendarReminderSubscription> findDueReminders(
            @Param("now") LocalDateTime now,
            Pageable pageable
    );
}
