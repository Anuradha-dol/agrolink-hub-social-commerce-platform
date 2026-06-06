import { useEffect, useMemo, useState } from "react";
import { calendarService } from "../services/calendarService";
import LoadingState from "/src/modules/platform/common/components/LoadingState";
import { useToast } from "/src/modules/platform/common/hooks/useToast";
import {
  Button,
  Card,
  EmptyPanel,
  Icon,
  Modal,
  OverviewHero,
  PageGrid,
  SectionHeader,
  StatCard,
  StatusBadge,
  Tabs
} from "/src/modules/platform/common/ui/DashboardUI";

const eventTypes = [
  { label: "Event", value: "GENERAL", tone: "blue" },
  { label: "Meeting", value: "MEETING", tone: "green" },
  { label: "Birthday", value: "BIRTHDAY", tone: "pink" },
  { label: "Task", value: "GENERAL", tone: "orange" },
  { label: "Reminder", value: "REMINDER", tone: "purple" }
];

const reminderOptions = [
  { label: "2 days before", value: 2880 },
  { label: "1 day before", value: 1440 },
  { label: "On the day", value: 60 }
];

function emptyForm() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  return {
    title: "",
    date,
    startTime: "10:00",
    endTime: "11:00",
    type: "GENERAL",
    visibility: "PRIVATE",
    location: "",
    participants: "",
    notes: "",
    reminder: 2880,
    customReminder: ""
  };
}

function unwrap(response) {
  return response?.data?.data?.content || response?.data?.data || response?.data?.content || [];
}

function dateKey(date) {
  return new Date(date).toISOString().slice(0, 10);
}

function typeTone(type) {
  const found = eventTypes.find((item) => item.value === type);
  return found?.tone || "blue";
}

function displayType(type) {
  if (type === "GENERAL") return "Event";
  if (type === "PRODUCT_LAUNCH") return "Launch";
  if (type === "LIVE_SESSION") return "Live";
  return String(type || "Event").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function CalendarPage() {
  const { pushToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [view, setView] = useState("month");
  const [monthDate, setMonthDate] = useState(new Date());
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const from = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1).toISOString();
      const to = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59).toISOString();
      const [eventsRes, reminderRes] = await Promise.all([
        calendarService.listMyEvents({ from, to, page: 0, size: 100 }),
        calendarService.listReminders({ page: 0, size: 20 })
      ]);
      setEvents(unwrap(eventsRes));
      setReminders(unwrap(reminderRes));
    } catch {
      pushToast("Failed to load calendar", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [monthDate.getFullYear(), monthDate.getMonth()]);

  const sortedEvents = useMemo(() => [...events].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt)), [events]);
  const todayEvents = useMemo(() => sortedEvents.filter((event) => dateKey(event.startsAt) === dateKey(new Date())), [sortedEvents]);
  const upcoming = useMemo(() => sortedEvents.filter((event) => new Date(event.startsAt) >= new Date()).slice(0, 8), [sortedEvents]);
  const activeReminders = reminders.length || sortedEvents.filter((event) => Number(event.myReminderMinutesBefore || 0) > 0).length;
  const nextReminder = upcoming.find((event) => Number(event.myReminderMinutesBefore || 0) > 0) || upcoming[0];

  const monthCells = useMemo(() => {
    const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const startDay = start.getDay();
    const cells = [];
    for (let index = 0; index < 42; index += 1) {
      const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), index - startDay + 1);
      const key = dateKey(date);
      cells.push({
        date,
        inMonth: date.getMonth() === monthDate.getMonth(),
        events: sortedEvents.filter((event) => dateKey(event.startsAt) === key)
      });
    }
    return cells;
  }, [monthDate, sortedEvents]);

  const focusedDate = useMemo(() => {
    const today = new Date();
    if (today.getFullYear() === monthDate.getFullYear() && today.getMonth() === monthDate.getMonth()) {
      return today;
    }
    return new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  }, [monthDate]);

  const focusedDayEvents = useMemo(
    () => sortedEvents.filter((event) => dateKey(event.startsAt) === dateKey(focusedDate)),
    [focusedDate, sortedEvents]
  );

  const weekCells = useMemo(() => {
    const start = new Date(focusedDate);
    start.setDate(focusedDate.getDate() - focusedDate.getDay());
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = dateKey(date);
      return {
        date,
        events: sortedEvents.filter((event) => dateKey(event.startsAt) === key)
      };
    });
  }, [focusedDate, sortedEvents]);

  const submitEvent = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      pushToast("Event title is required", "error");
      return;
    }
    if (!form.date || !form.startTime) {
      pushToast("Date and start time are required", "error");
      return;
    }
    const reminder = form.customReminder ? Number(form.customReminder) : Number(form.reminder);
    setSubmitting(true);
    try {
      await calendarService.createEvent({
        title: form.title.trim(),
        description: [form.notes.trim(), form.participants.trim() ? `Participants: ${form.participants.trim()}` : ""].filter(Boolean).join("\n"),
        location: form.location.trim(),
        type: form.type,
        visibility: form.visibility,
        startsAt: `${form.date}T${form.startTime}`,
        endsAt: form.endTime ? `${form.date}T${form.endTime}` : null,
        ownerReminderMinutesBefore: Math.max(1, reminder || 60)
      });
      pushToast("Event created", "success");
      setForm(emptyForm());
      await loadEvents();
    } catch {
      pushToast("Failed to create event", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmRemoveEvent = async () => {
    if (!deleteTarget?.id) return;
    try {
      await calendarService.deleteEvent(deleteTarget.id);
      pushToast("Event deleted", "success");
      setDeleteTarget(null);
      await loadEvents();
    } catch {
      pushToast("Failed to delete event", "error");
    }
  };

  if (loading) return <LoadingState text="Loading calendar..." />;

  return (
    <PageGrid className="calendar-dashboard social-pro-page workspace-pro-page">
      <OverviewHero
        icon="calendar"
        eyebrow="Plan ahead. Stay organized."
        title="Store special days, meetings and reminders before the date."
        subtitle="Create events, meetings, birthdays, tasks, and reminders with smart notifications before important moments."
        stats={[
          { label: "Upcoming Events", value: upcoming.length, trend: "This month" },
          { label: "Today", value: todayEvents.length, trend: "Schedule" },
          { label: "Reminders Active", value: activeReminders, trend: "Enabled" },
          { label: "Next Reminder", value: nextReminder?.title || "None", trend: nextReminder ? new Date(nextReminder.startsAt).toLocaleDateString() : "-" }
        ]}
      />

      <div className="calendar-layout">
        <Card className="calendar-form-card">
          <SectionHeader title="Add Event" />
          <form className="form-grid calendar-event-form" onSubmit={submitEvent}>
            <label>Event Title<input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="e.g., Client Meeting" /></label>
            <label>Date<input type="date" value={form.date} onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))} /></label>
            <div className="time-row">
              <label>Start Time<input type="time" value={form.startTime} onChange={(event) => setForm((prev) => ({ ...prev, startTime: event.target.value }))} /></label>
              <label>End Time<input type="time" value={form.endTime} onChange={(event) => setForm((prev) => ({ ...prev, endTime: event.target.value }))} /></label>
            </div>
            <label>Event Type</label>
            <div className="event-type-grid">
              {eventTypes.map((type) => (
                <button key={`${type.label}-${type.value}`} type="button" className={form.type === type.value && (type.label !== "Task" || form.notes.includes("[Task]")) ? "active" : ""} onClick={() => setForm((prev) => ({ ...prev, type: type.value, notes: type.label === "Task" && !prev.notes.includes("[Task]") ? `[Task]\n${prev.notes}` : prev.notes }))}>
                  {type.label}
                </button>
              ))}
            </div>
            <label>Location / Online Link<input value={form.location} onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))} placeholder="Zoom meeting or office" /></label>
            <label>Participants<input value={form.participants} onChange={(event) => setForm((prev) => ({ ...prev, participants: event.target.value }))} placeholder="Add people by name or email" /></label>
            <label>Notes<textarea value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} placeholder="Add agenda or notes..." /></label>
            <label>Reminder options</label>
            <div className="reminder-option-grid">
              {reminderOptions.map((option) => (
                <button key={option.value} type="button" className={Number(form.reminder) === option.value ? "active" : ""} onClick={() => setForm((prev) => ({ ...prev, reminder: option.value, customReminder: "" }))}>
                  <Icon name="bell" /> {option.label}
                </button>
              ))}
            </div>
            <label>Custom reminder (minutes before)<input type="number" min="1" max="10080" value={form.customReminder} onChange={(event) => setForm((prev) => ({ ...prev, customReminder: event.target.value }))} /></label>
            <div className="inline-action-row">
              <Button onClick={() => setForm(emptyForm())}>Cancel</Button>
              <Button variant="gradient" icon="plus" type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create Event"}</Button>
            </div>
          </form>
        </Card>

        <Card className="calendar-month-card">
          <div className="calendar-toolbar">
            <div className="month-nav">
              <Button icon="close" onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1))}>Prev</Button>
              <h2>{monthDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h2>
              <Button icon="plus" onClick={() => setMonthDate(new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1))}>Next</Button>
              <Button icon="calendar" onClick={() => setMonthDate(new Date())}>Today</Button>
            </div>
            <Tabs
              active={view}
              onChange={setView}
              tabs={[
                { value: "day", label: "Day" },
                { value: "week", label: "Week" },
                { value: "month", label: "Month" }
              ]}
            />
          </div>
          {view === "month" ? (
            <div className="calendar-grid">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <strong key={day}>{day}</strong>)}
              {monthCells.map((cell) => (
                <div key={cell.date.toISOString()} className={`calendar-cell ${cell.inMonth ? "" : "muted-cell"} ${dateKey(cell.date) === dateKey(new Date()) ? "today" : ""}`}>
                  <span>{cell.date.getDate()}</span>
                  {cell.events.slice(0, 3).map((event) => (
                    <button key={event.id} type="button" className={`event-chip event-${typeTone(event.type)}`} onClick={() => setDeleteTarget(event)}>
                      {event.title}
                      <small>{new Date(event.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
                    </button>
                  ))}
                  {cell.events.length > 3 ? <em>+ {cell.events.length - 3} more</em> : null}
                </div>
              ))}
            </div>
          ) : null}
          {view === "week" ? (
            <div className="calendar-week-board">
              {weekCells.map((cell) => (
                <article key={cell.date.toISOString()} className={`calendar-week-day ${dateKey(cell.date) === dateKey(new Date()) ? "today" : ""}`}>
                  <header>
                    <span>{cell.date.toLocaleDateString(undefined, { weekday: "short" })}</span>
                    <strong>{cell.date.getDate()}</strong>
                  </header>
                  <div>
                    {cell.events.map((event) => (
                      <button key={event.id} type="button" className={`event-chip event-${typeTone(event.type)}`} onClick={() => setDeleteTarget(event)}>
                        {event.title}
                        <small>{new Date(event.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
                      </button>
                    ))}
                    {!cell.events.length ? <small className="calendar-empty-slot">No events</small> : null}
                  </div>
                </article>
              ))}
            </div>
          ) : null}
          {view === "day" ? (
            <div className="calendar-day-board">
              <section className="calendar-day-focus">
                <span>{focusedDate.toLocaleDateString(undefined, { weekday: "long" })}</span>
                <strong>{focusedDate.getDate()}</strong>
                <p>{focusedDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</p>
              </section>
              <section className="calendar-day-agenda">
                {focusedDayEvents.map((event) => (
                  <button key={event.id} type="button" className={`calendar-agenda-event event-${typeTone(event.type)}`} onClick={() => setDeleteTarget(event)}>
                    <span>{new Date(event.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    <strong>{event.title}</strong>
                    <small>{displayType(event.type)}{event.location ? ` - ${event.location}` : ""}</small>
                  </button>
                ))}
                {!focusedDayEvents.length ? <EmptyPanel icon="calendar" title="No events for this day" subtitle="Use Add Event to schedule a meeting, birthday, task, or reminder." /> : null}
              </section>
            </div>
          ) : null}
          <div className="calendar-legend">
            {eventTypes.slice(0, 5).map((type) => <span key={type.label}><i className={`legend-${type.tone}`} />{type.label}</span>)}
          </div>
        </Card>

        <aside className="side-stack calendar-side">
          <Card>
            <SectionHeader title="Upcoming Reminders" action={<button type="button" className="text-link" onClick={() => setView("month")}>View all</button>} />
            <ul className="panel-list">
              {upcoming.slice(0, 5).map((event) => (
                <li key={`upcoming-${event.id}`} className="panel-row">
                  <div>
                    <strong>{event.title}</strong>
                    <span>{new Date(event.startsAt).toLocaleString()} · {displayType(event.type)}</span>
                  </div>
                  <StatusBadge status={event.myReminderMinutesBefore ? `${event.myReminderMinutesBefore}m` : "Reminder"} tone={typeTone(event.type)} />
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <SectionHeader title="Today's Schedule" action={<button type="button" className="text-link" onClick={() => setView("day")}>View all</button>} />
            {todayEvents.length ? (
              <ul className="panel-list">
                {todayEvents.map((event) => (
                  <li key={`today-${event.id}`} className="panel-row">
                    <div><strong>{event.title}</strong><span>{new Date(event.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></div>
                    <StatusBadge status={displayType(event.type)} tone={typeTone(event.type)} />
                  </li>
                ))}
              </ul>
            ) : <EmptyPanel icon="calendar" title="No events today" subtitle="Your day is clear." />}
          </Card>

          <Card className="smart-reminder-card">
            <span className="smart-bell"><Icon name="bell" /></span>
            <div>
              <h3>{activeReminders ? "Reminders active" : "You're all set"}</h3>
              <p>{activeReminders} reminder{activeReminders === 1 ? "" : "s"} active. Notifications are configured for 2 days before, 1 day before, and on the event day when selected.</p>
              <Button icon="bell" onClick={() => pushToast(`${activeReminders} reminder${activeReminders === 1 ? "" : "s"} active`, "success")}>Review reminders</Button>
            </div>
          </Card>
        </aside>
      </div>

      <Modal
        open={Boolean(deleteTarget)}
        title="Delete Calendar Event"
        subtitle="Remove this schedule item from your calendar."
        onClose={submitting ? undefined : () => setDeleteTarget(null)}
        footer={(
          <>
            <Button onClick={() => setDeleteTarget(null)} disabled={submitting}>Keep Event</Button>
            <Button variant="danger" icon="trash" onClick={confirmRemoveEvent} disabled={submitting}>Delete Event</Button>
          </>
        )}
      >
        <div className="confirmation-panel">
          <span><Icon name="calendar" /></span>
          <div>
            <strong>{deleteTarget?.title}</strong>
            <p>{deleteTarget?.startsAt ? new Date(deleteTarget.startsAt).toLocaleString() : "Selected date"}</p>
          </div>
        </div>
      </Modal>
    </PageGrid>
  );
}
