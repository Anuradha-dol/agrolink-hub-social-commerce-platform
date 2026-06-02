package com.socialApp.Lishare.modules.platform.calendar.repository;

import com.socialApp.Lishare.modules.platform.calendar.entity.CalendarEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {

    @Query("""
            SELECT e
            FROM CalendarEvent e
            WHERE e.owner.userId = :userId
              AND e.cancelled = false
              AND e.startsAt >= :from
              AND e.startsAt <= :to
            """)
    Page<CalendarEvent> findMyEvents(
            @Param("userId") Long userId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable
    );

    @Query("""
            SELECT e
            FROM CalendarEvent e
            WHERE e.cancelled = false
              AND (e.visibility = com.socialApp.Lishare.modules.platform.calendar.entity.CalendarEventVisibility.PUBLIC
                   OR e.owner.userId = :userId)
              AND e.startsAt >= :from
              AND e.startsAt <= :to
            """)
    Page<CalendarEvent> findVisibleEvents(
            @Param("userId") Long userId,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable
    );

    @Query("""
            SELECT COUNT(e)
            FROM CalendarEvent e
            WHERE e.owner.userId = :userId
              AND e.cancelled = false
              AND e.startsAt >= :from
            """)
    long countMyUpcomingEvents(
            @Param("userId") Long userId,
            @Param("from") LocalDateTime from
    );
}
