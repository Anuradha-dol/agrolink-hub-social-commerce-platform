import { useMemo, useState } from "react";
import { formatDateTime, timeAgo } from "/src/modules/platform/common/utils/dateTime";

const initialEvents = [
  { id: 1, title: "Team meeting", datetime: new Date().toISOString(), type: "meeting" },
  { id: 2, title: "Product launch", datetime: new Date(Date.now() + 86400000).toISOString(), type: "launch" }
];

export default function CalendarPage() {
  const [mode, setMode] = useState("month");
  const [events, setEvents] = useState(initialEvents);
  const [form, setForm] = useState({ title: "", datetime: "", type: "event" });

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(a.datetime) - new Date(b.datetime)),
    [events]
  );

  const addEvent = (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.datetime) return;

    setEvents((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: form.title.trim(),
        datetime: new Date(form.datetime).toISOString(),
        type: form.type
      }
    ]);
    setForm({ title: "", datetime: "", type: "event" });
  };

  const deleteEvent = (id) => {
    setEvents((prev) => prev.filter((event) => event.id !== id));
  };

  return (
    <div className="calendar-page">
      <section className="card">
        <h2>Calendar</h2>
        <div className="segment">
          {["day", "week", "month"].map((item) => (
            <button
              key={item}
              type="button"
              className={`segment-btn ${mode === item ? "active" : ""}`}
              onClick={() => setMode(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>Add Event</h3>
        <form onSubmit={addEvent} className="grid-form">
          <input
            placeholder="Event title"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          />
          <input
            type="datetime-local"
            value={form.datetime}
            onChange={(e) => setForm((prev) => ({ ...prev, datetime: e.target.value }))}
          />
          <select value={form.type} onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}>
            <option value="event">Event</option>
            <option value="launch">Product Launch</option>
            <option value="meeting">Meeting</option>
            <option value="reminder">Reminder</option>
            <option value="post">Scheduled Post</option>
          </select>
          <button className="btn btn-primary" type="submit">
            Add
          </button>
        </form>
      </section>

      <section className="card">
        <h3>{mode[0].toUpperCase() + mode.slice(1)} View</h3>
        <ul className="simple-list">
          {sortedEvents.map((event) => (
            <li key={event.id} className="event-row">
              <div>
                <strong>{event.title}</strong>
                <p>{formatDateTime(event.datetime)}</p>
                <small>{timeAgo(event.datetime)}</small>
              </div>
              <button className="btn btn-secondary" type="button" onClick={() => deleteEvent(event.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
