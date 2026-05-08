import { useCallback, useEffect, useMemo, useState } from "react";
import { notificationService } from "../services/notificationService";
import { useRealtimeNotifications } from "../hooks/useRealtimeNotifications";
import { useAuth } from "/src/modules/platform/app/store";
import { useToast } from "/src/modules/platform/common/hooks/useToast";

function BellIcon() {
  return (
    <svg className="notif-button-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3a5 5 0 0 0-5 5v2.4c0 1.6-.6 3.1-1.7 4.2L4 16h16l-1.3-1.4A6.1 6.1 0 0 1 17 10.4V8a5 5 0 0 0-5-5z" />
      <path d="M9.5 18.2a2.5 2.5 0 0 0 5 0" />
    </svg>
  );
}

export default function NotificationDropdown() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    if (!user?.userId) return;
    try {
      const [notificationsRes, unreadRes] = await Promise.all([
        notificationService.getNotifications({ page: 0, size: 10 }),
        notificationService.getUnreadCount()
      ]);

      const notificationsData = notificationsRes?.data?.data?.content || [];
      const unreadData = unreadRes?.data?.data?.unreadCount || 0;
      setItems(notificationsData);
      setUnreadCount(unreadData);
    } catch {
      // silent fallback
    }
  }, [user?.userId]);

  useEffect(() => {
    load();
  }, [load]);

  useRealtimeNotifications(user?.userId, (notification) => {
    setItems((prev) => [notification, ...prev].slice(0, 20));
    setUnreadCount((prev) => prev + 1);
    pushToast(notification.message, "success");
  });

  const markRead = async (id) => {
    try {
      await notificationService.markRead(id);
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      pushToast("Failed to update notification", "error");
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.readAll();
      setItems((prev) => prev.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
    } catch {
      pushToast("Failed to mark all as read", "error");
    }
  };

  const clearAll = async () => {
    try {
      await notificationService.clearAll();
      setItems([]);
      setUnreadCount(0);
    } catch {
      pushToast("Failed to clear notifications", "error");
    }
  };

  const unreadBadge = useMemo(() => (unreadCount > 99 ? "99+" : unreadCount), [unreadCount]);

  return (
    <div className="notif-dropdown">
      <button type="button" className="btn btn-secondary notif-button" onClick={() => setOpen((prev) => !prev)}>
        <BellIcon />
        Notifications
        {unreadCount > 0 ? <span className="notif-badge">{unreadBadge}</span> : null}
      </button>

      {open ? (
        <div className="notif-panel">
          <div className="notif-panel-header">
            <h4>Notifications</h4>
            <div className="row-actions">
              <button type="button" className="btn btn-secondary" onClick={markAllRead}>
                Read All
              </button>
              <button type="button" className="btn btn-secondary" onClick={clearAll}>
                Clear
              </button>
            </div>
          </div>
          <ul className="notif-list">
            {items.length === 0 ? <li>No notifications</li> : null}
            {items.map((item) => (
              <li key={item.id} className={item.read ? "notif-item" : "notif-item unread"}>
                <div>
                  <p>{item.message}</p>
                  <small>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</small>
                </div>
                {!item.read ? (
                  <button type="button" className="btn btn-primary" onClick={() => markRead(item.id)}>
                    Mark Read
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
