import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { notificationService } from "../services/notificationService";
import { useRealtimeNotifications } from "../hooks/useRealtimeNotifications";
import { useAuth } from "/src/modules/platform/app/store";
import { useToast } from "/src/modules/platform/common/hooks/useToast";
import { toMediaUrl } from "/src/modules/platform/common/utils/mediaUrl";

function BellIcon() {
  return (
    <svg className="notif-button-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3a5 5 0 0 0-5 5v2.4c0 1.6-.6 3.1-1.7 4.2L4 16h16l-1.3-1.4A6.1 6.1 0 0 1 17 10.4V8a5 5 0 0 0-5-5z" />
      <path d="M9.5 18.2a2.5 2.5 0 0 0 5 0" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="notif-action-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 12 4 4 10-10" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="notif-action-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" />
    </svg>
  );
}

function extractPageContent(response) {
  const payload = response?.data?.data ?? response?.data ?? {};
  if (Array.isArray(payload)) return payload;
  return Array.isArray(payload.content) ? payload.content : [];
}

function extractUnreadCount(response) {
  const payload = response?.data?.data ?? response?.data ?? {};
  return Number(payload.unreadCount ?? payload.count ?? payload ?? 0) || 0;
}

function notificationRoute(item) {
  const referenceId = Number(item?.referenceId || 0);
  const referenceType = String(item?.referenceType || item?.type || "").toUpperCase();
  const postId = Number(item?.postId || (referenceType === "POST" ? referenceId : 0));
  const commentId = Number(item?.commentId || (referenceType === "COMMENT" ? referenceId : 0));
  const replyId = Number(item?.replyId || (referenceType === "REPLY" ? referenceId : 0));

  if (referenceType === "USER" && referenceId > 0) return { to: `/profile/${referenceId}` };
  if (referenceType === "ORDER" || referenceType === "ORDER_STATUS") return { to: "/orders" };
  if (referenceType === "CHAT_MESSAGE" || referenceType === "MESSAGE") return { to: "/chat" };
  if (referenceType === "CALENDAR_EVENT" || referenceType === "EVENT_REMINDER") return { to: "/calendar" };
  if (["POST", "COMMENT", "REPLY", "COMMENT_REPLY", "SHARE", "SHARE_MENTION", "STORY", "MENTION"].includes(referenceType)) {
    return (postId || referenceId) > 0 && ["POST", "COMMENT", "REPLY", "COMMENT_REPLY", "MENTION"].includes(referenceType)
      ? { to: "/home", state: { openPostId: postId || referenceId, mode: "posts", highlightCommentId: commentId, highlightReplyId: replyId } }
      : { to: "/home" };
  }
  return null;
}

export default function NotificationDropdown() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const lastRealtimeIdsRef = useRef(new Set());
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

      setItems(extractPageContent(notificationsRes));
      setUnreadCount(extractUnreadCount(unreadRes));
    } catch {
      // Websocket and manual refresh continue to recover when the API comes back.
    }
  }, [user?.userId]);

  useEffect(() => {
    load();
    const intervalId = window.setInterval(load, 15000);
    const refresh = () => load();
    window.addEventListener("focus", refresh);
    window.addEventListener("lishare-notifications-refresh", refresh);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("lishare-notifications-refresh", refresh);
    };
  }, [load]);

  const handleRealtimeNotification = useCallback((notification) => {
    if (!notification?.id) {
      load();
      return;
    }

    const notificationId = String(notification.id);
    if (lastRealtimeIdsRef.current.has(notificationId)) return;
    lastRealtimeIdsRef.current.add(notificationId);
    if (lastRealtimeIdsRef.current.size > 80) {
      lastRealtimeIdsRef.current = new Set([...lastRealtimeIdsRef.current].slice(-40));
    }

    setItems((prev) => [notification, ...prev.filter((item) => String(item.id) !== notificationId)].slice(0, 20));
    if (!notification.read) setUnreadCount((prev) => prev + 1);
    if (notification.message) pushToast(notification.message, "success");
  }, [load, pushToast]);

  const { connected } = useRealtimeNotifications(user?.userId, handleRealtimeNotification);

  const markRead = async (id) => {
    try {
      await notificationService.markRead(id);
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      window.dispatchEvent(new Event("lishare-notifications-refresh"));
    } catch {
      pushToast("Failed to update notification", "error");
    }
  };

  const removeNotification = async (item) => {
    const hideNotification = () => {
      setItems((prev) => prev.filter((row) => String(row.id) !== String(item.id)));
      if (!item.read) setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    try {
      await notificationService.remove(item.id);
      hideNotification();
      window.dispatchEvent(new Event("lishare-notifications-refresh"));
    } catch {
      hideNotification();
    }
  };

  const openNotification = async (item) => {
    if (!item?.read) {
      await markRead(item.id);
    }

    const route = notificationRoute(item);
    if (route) {
      navigate(route.to, route.state ? { state: route.state } : undefined);
      setOpen(false);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.readAll();
      setItems((prev) => prev.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
      window.dispatchEvent(new Event("lishare-notifications-refresh"));
    } catch {
      pushToast("Failed to mark all as read", "error");
    }
  };

  const clearAll = async () => {
    try {
      await notificationService.clearAll();
      setItems([]);
      setUnreadCount(0);
      window.dispatchEvent(new Event("lishare-notifications-refresh"));
    } catch {
      pushToast("Failed to clear notifications", "error");
    }
  };

  const unreadBadge = useMemo(() => (unreadCount > 99 ? "99+" : unreadCount), [unreadCount]);
  const panel = open ? (
    <div className="notif-panel notif-panel-floating">
      <div className="notif-panel-header">
        <div>
          <h4>Notifications</h4>
          <small className={connected ? "notif-live-state connected" : "notif-live-state"}>{connected ? "Live" : "Syncing"}</small>
        </div>
        <div className="notif-panel-actions">
          <button type="button" className="notif-panel-icon-btn" onClick={markAllRead} aria-label="Mark all notifications read" title="Read all">
            <CheckIcon />
          </button>
          <button type="button" className="notif-panel-icon-btn danger" onClick={clearAll} aria-label="Clear notifications" title="Clear">
            <TrashIcon />
          </button>
        </div>
      </div>
      <ul className="notif-list">
        {items.length === 0 ? <li className="notif-empty-row">No notifications</li> : null}
        {items.map((item) => (
          <li key={item.id} className={item.read ? "notif-item" : "notif-item unread"}>
            <button type="button" className="notif-content-button" onClick={() => openNotification(item)}>
              <span className={`notif-avatar ${item.actorProfileImageUrl ? "has-image" : ""}`}>
                {item.actorProfileImageUrl ? <img src={toMediaUrl(item.actorProfileImageUrl)} alt="" /> : (item.actorName || "N").slice(0, 1)}
              </span>
              <span className="notif-type-pill">{String(item.type || "SYSTEM").replace("_", " ")}</span>
              <p>{item.message}</p>
              <small>{item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}</small>
            </button>
            <span className="notif-row-actions">
              {!item.read ? (
                <button type="button" className="notif-mark-btn" onClick={() => markRead(item.id)} aria-label="Mark notification read" title="Mark read">
                  <CheckIcon />
                </button>
              ) : null}
              <button type="button" className="notif-remove-btn" onClick={() => removeNotification(item)} aria-label="Remove notification" title="Remove">
                <TrashIcon />
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  ) : null;

  return (
    <div className="notif-dropdown">
      <button type="button" className="notif-button" onClick={() => setOpen((prev) => !prev)} aria-label="Notifications" title="Notifications">
        <BellIcon />
        {unreadCount > 0 ? <span className="notif-badge">{unreadBadge}</span> : null}
      </button>

      {panel && typeof document !== "undefined" ? createPortal(panel, document.body) : null}
    </div>
  );
}
