import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { notificationService } from "../services/notificationService";
import { useRealtimeNotifications } from "../hooks/useRealtimeNotifications";
import LoadingState from "/src/modules/platform/common/components/LoadingState";
import ErrorState from "/src/modules/platform/common/components/ErrorState";
import { useAuth } from "/src/modules/platform/app/store";
import { useToast } from "/src/modules/platform/common/hooks/useToast";
import { toMediaUrl } from "/src/modules/platform/common/utils/mediaUrl";
import {
  Avatar,
  Button,
  Card,
  EmptyPanel,
  Icon,
  Modal,
  OverviewHero,
  PageGrid,
  SectionHeader,
  StatusBadge,
  Tabs
} from "/src/modules/platform/common/ui/DashboardUI";

const NOTIFICATION_PAGE_SIZE = 20;

function normalizeNotificationPage(response, requestedPage) {
  const payload = response?.data?.data ?? response?.data ?? {};
  const content = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.content)
      ? payload.content
      : Array.isArray(payload.items)
        ? payload.items
        : [];
  const currentPage = Number.isFinite(Number(payload.number))
    ? Number(payload.number)
    : Number.isFinite(Number(payload.page))
      ? Number(payload.page)
      : requestedPage;
  const totalPages = Number.isFinite(Number(payload.totalPages)) ? Number(payload.totalPages) : null;
  const explicitLast = typeof payload.last === "boolean" ? payload.last : null;
  const explicitFirst = typeof payload.first === "boolean" ? payload.first : null;

  return {
    content,
    page: Math.max(0, currentPage),
    hasNext: totalPages !== null ? currentPage + 1 < totalPages : explicitLast !== null ? !explicitLast : content.length >= NOTIFICATION_PAGE_SIZE,
    hasPrev: explicitFirst !== null ? !explicitFirst : currentPage > 0
  };
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

function notificationTone(type = "") {
  const normalized = String(type || "").toUpperCase();
  if (normalized.includes("LIKE") || normalized.includes("REACTION")) return "blue";
  if (normalized.includes("MESSAGE") || normalized.includes("CHAT")) return "purple";
  if (normalized.includes("ORDER")) return "green";
  if (normalized.includes("REPORT") || normalized.includes("WARN")) return "orange";
  return "pink";
}

function notificationTypeLabel(type = "") {
  return String(type || "SYSTEM").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
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
  const [hasPrev, setHasPrev] = useState(false);
  const pageRef = useRef(0);
  const [filter, setFilter] = useState("all");
  const [clearOpen, setClearOpen] = useState(false);
  const [busy, setBusy] = useState("");

  const load = useCallback(async (targetPage = 0, showLoading = true) => {
    if (showLoading) setLoading(true);
    setError("");
    try {
      const requestedPage = Math.max(0, Number(targetPage) || 0);
      const response = await notificationService.getNotifications({ page: requestedPage, size: NOTIFICATION_PAGE_SIZE });
      const normalized = normalizeNotificationPage(response, requestedPage);
      setItems(normalized.content);
      setPage(normalized.page);
      pageRef.current = normalized.page;
      setHasNext(normalized.hasNext);
      setHasPrev(normalized.hasPrev);
    } catch {
      setError("Failed to load notifications");
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(0);
    const intervalId = window.setInterval(() => load(pageRef.current, false), 15000);
    const refresh = () => load(pageRef.current, false);
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

  const unreadCount = items.filter((item) => !item.read).length;
  const visibleItems = useMemo(() => {
    if (filter === "unread") return items.filter((item) => !item.read);
    if (filter === "read") return items.filter((item) => item.read);
    return items;
  }, [filter, items]);

  const markRead = async (id) => {
    setBusy(`read-${id}`);
    try {
      await notificationService.markRead(id);
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
      window.dispatchEvent(new Event("lishare-notifications-refresh"));
    } catch {
      pushToast("Failed to update notification", "error");
    } finally {
      setBusy("");
    }
  };

  const markAllRead = async () => {
    setBusy("read-all");
    try {
      await notificationService.readAll();
      setItems((prev) => prev.map((item) => ({ ...item, read: true })));
      window.dispatchEvent(new Event("lishare-notifications-refresh"));
      pushToast("All notifications marked as read", "success");
    } catch {
      pushToast("Failed to mark notifications as read", "error");
    } finally {
      setBusy("");
    }
  };

  const clearAll = async () => {
    setBusy("clear");
    try {
      await notificationService.clearAll();
      setItems([]);
      setClearOpen(false);
      window.dispatchEvent(new Event("lishare-notifications-refresh"));
      pushToast("Notifications cleared", "success");
    } catch {
      pushToast("Failed to clear notifications", "error");
    } finally {
      setBusy("");
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
    <PageGrid className="notifications-dashboard">
      <OverviewHero
        icon="bell"
        eyebrow="Notification Center"
        title="Track likes, follows, mentions and system updates in one place."
        subtitle="Visible alerts, unread states, page counters, and click-through actions stay connected to the full community flow."
        stats={[
          { label: "Visible", value: items.length, trend: "Loaded alerts" },
          { label: "Unread", value: unreadCount, trend: unreadCount ? "Needs review" : "All clear" },
          { label: "Page", value: page + 1, trend: hasNext ? "More available" : "Current" }
        ]}
      />

      <Card className="notifications-list-card">
        <SectionHeader
          title="Notifications"
          subtitle="Review, mark read, or open the related page directly."
          action={(
            <div className="inline-action-row">
              <Button icon="check" onClick={markAllRead} disabled={!unreadCount || busy === "read-all"}>
                {busy === "read-all" ? "Updating..." : "Mark All Read"}
              </Button>
              <Button icon="trash" variant="danger" onClick={() => setClearOpen(true)} disabled={!items.length}>Clear All</Button>
            </div>
          )}
        />

        <Tabs
          active={filter}
          onChange={setFilter}
          tabs={[
            { value: "all", label: "All", icon: "bell", count: items.length },
            { value: "unread", label: "Unread", icon: "eye", count: unreadCount },
            { value: "read", label: "Read", icon: "check", count: items.length - unreadCount }
          ]}
        />

        <div className="notification-row-stack">
          {visibleItems.map((item) => {
            const tone = notificationTone(item.type);
            return (
              <article key={item.id} className={`notification-row-card ${item.read ? "is-read" : "is-unread"}`}>
                <button type="button" className="notification-row-main" onClick={() => openNotification(item)}>
                  <Avatar
                    name={item.actorName || "Notification"}
                    src={item.actorProfileImageUrl ? toMediaUrl(item.actorProfileImageUrl) : null}
                    size="lg"
                  />
                  <span className={`notification-type-dot dot-${tone}`}><Icon name={tone === "green" ? "order" : tone === "purple" ? "chat" : tone === "orange" ? "bell" : "heart"} /></span>
                  <div>
                    <div className="notification-title-line">
                      <StatusBadge status={notificationTypeLabel(item.type)} tone={tone} />
                      {!item.read ? <StatusBadge status="Unread" tone="pink" /> : <StatusBadge status="Read" tone="blue" />}
                    </div>
                    <strong>{item.actorName ? `${item.actorName} ` : ""}{item.message || "New platform update"}</strong>
                    <small>{item.createdAt ? new Date(item.createdAt).toLocaleString() : "Recently"}</small>
                  </div>
                  <span className="notification-open-arrow"><Icon name="more" /></span>
                </button>
                {!item.read ? (
                  <Button icon="check" onClick={() => markRead(item.id)} disabled={busy === `read-${item.id}`}>
                    {busy === `read-${item.id}` ? "Saving..." : "Mark Read"}
                  </Button>
                ) : null}
              </article>
            );
          })}
        </div>

        {!visibleItems.length ? (
          <EmptyPanel
            icon="bell"
            title={filter === "unread" ? "No unread notifications" : "No notifications yet"}
            subtitle={filter === "unread" ? "You are all caught up." : "Likes, follows, orders, messages, and system updates will appear here."}
          />
        ) : null}

        <div className="pagination-row notifications-pagination">
          <Button disabled={!hasPrev} onClick={() => load(page - 1)}>Prev</Button>
          <span>Page {page + 1}</span>
          <Button disabled={!hasNext} onClick={() => load(page + 1)}>Next</Button>
        </div>
      </Card>

      <Modal
        open={clearOpen}
        title="Clear Notifications"
        subtitle="This removes the current notification list from your center."
        onClose={busy ? undefined : () => setClearOpen(false)}
        footer={(
          <>
            <Button onClick={() => setClearOpen(false)} disabled={Boolean(busy)}>Cancel</Button>
            <Button icon="trash" variant="danger" onClick={clearAll} disabled={busy === "clear"}>
              {busy === "clear" ? "Clearing..." : "Clear Notifications"}
            </Button>
          </>
        )}
      >
        <p className="notification-confirm-copy">Clear all visible notifications? This keeps the UI state consistent and removes old alerts from this workspace.</p>
      </Modal>
    </PageGrid>
  );
}
