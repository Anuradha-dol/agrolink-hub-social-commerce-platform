import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { notificationService } from "../services/notificationService";
import { useRealtimeNotifications } from "../hooks/useRealtimeNotifications";
import LoadingState from "/src/modules/platform/common/components/LoadingState";
import ErrorState from "/src/modules/platform/common/components/ErrorState";
import EmptyState from "/src/modules/platform/common/components/EmptyState";
import { useAuth } from "/src/modules/platform/app/store";
import { useToast } from "/src/modules/platform/common/hooks/useToast";

function notificationRoute(item) {
  const referenceId = Number(item?.referenceId || 0);
  const referenceType = String(item?.referenceType || item?.type || "").toUpperCase();

  if (referenceType === "USER" && referenceId > 0) return { to: `/profile/${referenceId}` };
  if (referenceType === "ORDER" || referenceType === "ORDER_STATUS") return { to: "/orders" };
  if (referenceType === "CHAT_MESSAGE" || referenceType === "MESSAGE") return { to: "/chat" };
  if (referenceType === "CALENDAR_EVENT" || referenceType === "EVENT_REMINDER") return { to: "/calendar" };
  if (["POST", "COMMENT_REPLY", "SHARE", "SHARE_MENTION", "STORY"].includes(referenceType)) {
    return referenceId > 0 && ["POST", "COMMENT_REPLY"].includes(referenceType)
      ? { to: "/home", state: { openPostId: referenceId, mode: "posts" } }
      : { to: "/home" };
  }
  return null;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);

  const load = useCallback(async (targetPage = 0, showLoading = true) => {
    if (showLoading) setLoading(true);
    setError("");
    try {
      const response = await notificationService.getNotifications({ page: targetPage, size: 20 });
      const payload = response?.data?.data ?? response?.data ?? {};
      setItems(Array.isArray(payload.content) ? payload.content : []);
      setPage(Number(payload.number || 0));
      setHasNext(!payload.last);
    } catch {
      setError("Failed to load notifications");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(0);
    const intervalId = window.setInterval(() => load(0, false), 15000);
    const refresh = () => load(0, false);
    window.addEventListener("focus", refresh);
    window.addEventListener("lishare-notifications-refresh", refresh);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("lishare-notifications-refresh", refresh);
    };
  }, [load]);

  useRealtimeNotifications(user?.userId, (notification) => {
    if (!notification?.id) {
      load(0, false);
      return;
    }
    setItems((prev) => [notification, ...prev.filter((item) => String(item.id) !== String(notification.id))].slice(0, 20));
  });

  const markRead = async (id) => {
    try {
      await notificationService.markRead(id);
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
      window.dispatchEvent(new Event("lishare-notifications-refresh"));
    } catch {
      pushToast("Failed to update notification", "error");
    }
  };

  const openNotification = async (item) => {
    if (!item?.read) {
      await markRead(item.id);
    }

    const route = notificationRoute(item);
    if (route) {
      navigate(route.to, route.state ? { state: route.state } : undefined);
    }
  };

  if (loading) return <LoadingState text="Loading notifications..." />;
  if (error) return <ErrorState message={error} onRetry={() => load(page)} />;

  return (
    <div className="notifications-page">
      <section className="page-hero">
        <div>
          <h2>Notification Center</h2>
          <p>Track likes, follows, mentions and system updates in one place.</p>
        </div>
        <div className="hero-stats">
          <article>
            <strong>{items.length}</strong>
            <span>Visible</span>
          </article>
          <article>
            <strong>{items.filter((item) => !item.read).length}</strong>
            <span>Unread</span>
          </article>
          <article>
            <strong>{page + 1}</strong>
            <span>Page</span>
          </article>
        </div>
      </section>

      <section className="card">
        <h2>Notifications</h2>
        {items.length === 0 ? <EmptyState title="No notifications yet" /> : null}
        <ul className="notif-list full-page">
          {items.map((item) => (
            <li key={item.id} className={item.read ? "notif-item" : "notif-item unread"}>
              <button type="button" className="notif-content-button" onClick={() => openNotification(item)}>
                <span className="notif-type-pill">{String(item.type || "SYSTEM").replace("_", " ")}</span>
                <p>{item.message}</p>
                <small>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</small>
              </button>
              {!item.read ? (
                <button className="btn btn-primary notif-page-mark-btn" type="button" onClick={() => markRead(item.id)}>
                  Mark Read
                </button>
              ) : null}
            </li>
          ))}
        </ul>
        <div className="pagination-row">
          <button className="btn btn-secondary" type="button" disabled={page <= 0} onClick={() => load(page - 1)}>
            Prev
          </button>
          <span>Page {page + 1}</span>
          <button className="btn btn-secondary" type="button" disabled={!hasNext} onClick={() => load(page + 1)}>
            Next
          </button>
        </div>
      </section>
    </div>
  );
}
