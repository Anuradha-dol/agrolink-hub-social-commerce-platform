import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { notificationService } from "../services/notificationService";
import LoadingState from "/src/modules/platform/common/components/LoadingState";
import ErrorState from "/src/modules/platform/common/components/ErrorState";
import EmptyState from "/src/modules/platform/common/components/EmptyState";
import { useToast } from "/src/modules/platform/common/hooks/useToast";

export default function NotificationsPage() {
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);

  const load = async (targetPage = 0) => {
    setLoading(true);
    setError("");
    try {
      const response = await notificationService.getNotifications({ page: targetPage, size: 20 });
      const payload = response?.data?.data;
      setItems(payload?.content || []);
      setPage(payload?.number || 0);
      setHasNext(!payload?.last);
    } catch {
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(0);
  }, []);

  const markRead = async (id) => {
    try {
      await notificationService.markRead(id);
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
    } catch {
      pushToast("Failed to update notification", "error");
    }
  };

  const openNotification = async (item) => {
    if (!item?.read) {
      await markRead(item.id);
    }
    if (Number(item?.referenceId) > 0 && ["POST", "COMMENT_REPLY"].includes(String(item.referenceType || ""))) {
      navigate("/home", { state: { openPostId: Number(item.referenceId), mode: "posts" } });
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
                <button className="btn btn-primary" type="button" onClick={() => markRead(item.id)}>
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
