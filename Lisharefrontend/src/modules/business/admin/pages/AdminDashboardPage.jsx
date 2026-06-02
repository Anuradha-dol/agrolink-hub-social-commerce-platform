import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { adminService } from "../services/adminService";
import LoadingState from "/src/modules/platform/common/components/LoadingState";
import { useToast } from "/src/modules/platform/common/hooks/useToast";

const ROLES = ["ROLE_USER", "ROLE_BUSINESS", "ROLE_ADMIN"];
const MODERATION_STATUSES = ["ACTIVE", "WARNED", "SUSPENDED"];
const REPORT_STATUSES = ["OPEN", "REVIEWED", "RESOLVED", "REJECTED"];
const REPORT_STATUS_LABELS = {
  OPEN: "Open",
  REVIEWED: "Reviewed",
  RESOLVED: "Fair - resolved",
  REJECTED: "Not fair - rejected"
};

export default function AdminDashboardPage() {
  const { pushToast } = useToast();
  const { pathname } = useLocation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [supportQuestions, setSupportQuestions] = useState([]);
  const [moderationDrafts, setModerationDrafts] = useState({});
  const [supportResponses, setSupportResponses] = useState({});
  const [userSearch, setUserSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, reportsRes, supportRes] = await Promise.all([
        adminService.getStats(),
        adminService.getUsers({ page: 0, size: 50 }),
        adminService.getReports({ page: 0, size: 50 }),
        adminService.getSupportQuestions()
      ]);

      const loadedUsers = usersRes?.data?.data?.content || [];
      setStats(statsRes?.data?.data || null);
      setUsers(loadedUsers);
      setReports(reportsRes?.data?.data?.content || []);
      setSupportQuestions(Array.isArray(supportRes?.data) ? supportRes.data : []);
      setModerationDrafts((previous) => {
        const next = {};
        loadedUsers.forEach((user) => {
          next[user.userId] = previous[user.userId] || {
            status: user.moderationStatus || "ACTIVE",
            message: user.moderationMessage || ""
          };
        });
        return next;
      });
    } catch {
      pushToast("Failed to load admin dashboard", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (loading) return;
    const targetId = pathname.includes("/admin/moderation")
      ? "admin-reports"
      : pathname.includes("/admin/support")
        ? "admin-support"
        : pathname.includes("/admin/users") || pathname.includes("/admin/business-users") || pathname.includes("/admin/admins")
          ? "admin-users"
          : "";
    if (targetId) {
      window.setTimeout(() => document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    }
  }, [loading, pathname]);

  const updateRole = async (userId, role) => {
    try {
      await adminService.updateRole(userId, role);
      pushToast("User role updated", "success");
      load();
    } catch {
      pushToast("Failed to update role", "error");
    }
  };

  const removeUser = async (userId) => {
    const reason = window.prompt("Enter the reason for deleting this account. This reason will be emailed to the user.");
    if (!reason || !reason.trim()) {
      pushToast("Deletion reason is required", "error");
      return;
    }
    if (!window.confirm("Delete this user account and email the reason?")) return;
    try {
      await adminService.deleteUser(userId, reason.trim());
      pushToast("User deleted and deletion reason emailed", "success");
      load();
    } catch {
      pushToast("Failed to delete user", "error");
    }
  };

  const updateModerationDraft = (userId, field, value) => {
    setModerationDrafts((previous) => ({
      ...previous,
      [userId]: {
        status: previous[userId]?.status || "ACTIVE",
        message: previous[userId]?.message || "",
        [field]: value
      }
    }));
  };

  const saveModeration = async (userId) => {
    const draft = moderationDrafts[userId] || {};
    try {
      await adminService.updateModeration(userId, draft.status || "ACTIVE", draft.message || "");
      pushToast("Moderation message updated", "success");
      load();
    } catch (error) {
      pushToast(error?.response?.data?.message || "Failed to update moderation", "error");
    }
  };

  const updateReportStatus = async (reportId, status) => {
    try {
      await adminService.updateReportStatus(reportId, status);
      pushToast("Report status updated", "success");
      load();
    } catch {
      pushToast("Failed to update report status", "error");
    }
  };

  const respondSupport = async (ticketId) => {
    const response = (supportResponses[ticketId] || "").trim();
    if (!response) {
      pushToast("Write an admin response first", "error");
      return;
    }
    try {
      await adminService.respondSupportQuestion(ticketId, response);
      pushToast("Support response sent", "success");
      setSupportResponses((previous) => ({ ...previous, [ticketId]: "" }));
      load();
    } catch {
      pushToast("Failed to respond to support ticket", "error");
    }
  };

  const roleBreakdown = useMemo(() => {
    const counts = { ROLE_USER: 0, ROLE_BUSINESS: 0, ROLE_ADMIN: 0 };
    users.forEach((item) => {
      counts[item.role] = (counts[item.role] || 0) + 1;
    });
    return counts;
  }, [users]);

  const routeRoleFilter = useMemo(() => {
    if (pathname.includes("/admin/business-users")) return "ROLE_BUSINESS";
    if (pathname.includes("/admin/admins")) return "ROLE_ADMIN";
    if (pathname.includes("/admin/users")) return "ROLE_USER";
    return "";
  }, [pathname]);

  const userSectionTitle = routeRoleFilter === "ROLE_BUSINESS"
    ? "Business Users"
    : routeRoleFilter === "ROLE_ADMIN"
      ? "Admins"
      : routeRoleFilter === "ROLE_USER"
        ? "Users"
        : "Users";

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    return users.filter((item) => {
      if (routeRoleFilter && item.role !== routeRoleFilter) return false;
      if (!query) return true;
      const name = `${item.firstName || ""} ${item.lastName || ""}`.toLowerCase();
      return name.includes(query) || String(item.email || "").toLowerCase().includes(query) || String(item.role || "").toLowerCase().includes(query);
    });
  }, [routeRoleFilter, userSearch, users]);

  const openReports = reports.filter((report) => String(report.status || "").toUpperCase() === "OPEN").length;
  const openSupport = supportQuestions.filter((ticket) => String(ticket.status || "OPEN").toUpperCase() !== "CLOSED").length;

  if (loading) return <LoadingState text="Loading admin dashboard..." />;

  return (
    <div className="admin-page">
      <section className="page-hero admin-command-hero">
        <div className="admin-command-copy">
          <span className="admin-command-badge">Live system health</span>
          <h2>Admin Command Center</h2>
          <p>Govern users, business sellers, admins, reports, platform health and support from one dashboard.</p>
          <div className="admin-command-actions">
            <Link to="/admin/users" className="btn btn-primary">User Management</Link>
            <Link to="/admin/moderation" className="btn btn-secondary">Content Reports</Link>
            <Link to="/admin/support" className="btn btn-secondary">Support Tickets</Link>
          </div>
        </div>
        <div className="admin-health-panel">
          <article><span />Platform Status<strong>All systems operational</strong></article>
          <article><span />Open Reports<strong>{openReports}</strong></article>
          <article><span />Support Queue<strong>{openSupport}</strong></article>
          <article><span />Loaded Users<strong>{users.length}</strong></article>
        </div>
      </section>

      <section className="stats-grid admin-stat-grid">
        <article className="card"><h3>{stats?.totalUsers ?? 0}</h3><p>Total Users</p></article>
        <article className="card"><h3>{stats?.totalPosts ?? 0}</h3><p>Total Posts</p></article>
        <article className="card"><h3>{stats?.totalOrders ?? 0}</h3><p>Total Orders</p></article>
        <article className="card"><h3>{stats?.totalProducts ?? 0}</h3><p>Total Products</p></article>
        <article className="card"><h3>{stats?.totalBusinessPages ?? 0}</h3><p>Business Pages</p></article>
      </section>

      <section className="admin-role-grid">
        <Link className={`card admin-role-card ${routeRoleFilter === "ROLE_USER" ? "active" : ""}`} to="/admin/users" id="admin-users-role"><span>Users</span><strong>{roleBreakdown.ROLE_USER || 0}</strong><p>Regular community accounts</p></Link>
        <Link className={`card admin-role-card ${routeRoleFilter === "ROLE_BUSINESS" ? "active" : ""}`} to="/admin/business-users" id="admin-business-users"><span>Business Users</span><strong>{roleBreakdown.ROLE_BUSINESS || 0}</strong><p>Marketplace and seller accounts</p></Link>
        <Link className={`card admin-role-card ${routeRoleFilter === "ROLE_ADMIN" ? "active" : ""}`} to="/admin/admins" id="admin-admin-users"><span>Admins</span><strong>{roleBreakdown.ROLE_ADMIN || 0}</strong><p>Platform command accounts</p></Link>
      </section>

      <section className="card admin-table-card" id="admin-users">
        <div className="admin-section-head">
          <div>
            <h2>{userSectionTitle}</h2>
            <p>Manage user roles, moderation messages, suspensions, and deletion notices.</p>
          </div>
          <input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Search users, business users, admins..." />
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Moderation</th>
                <th>Message</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.userId}>
                  <td>
                    {user.firstName} {user.lastName}
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <select value={user.role} onChange={(e) => updateRole(user.userId, e.target.value)}>
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role.replace("ROLE_", "")}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{user.verified ? "Verified" : "Unverified"}</td>
                  <td>
                    <select
                      value={moderationDrafts[user.userId]?.status || user.moderationStatus || "ACTIVE"}
                      onChange={(e) => updateModerationDraft(user.userId, "status", e.target.value)}
                    >
                      {MODERATION_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <textarea
                      className="admin-message-input"
                      rows={2}
                      value={moderationDrafts[user.userId]?.message ?? user.moderationMessage ?? ""}
                      onChange={(e) => updateModerationDraft(user.userId, "message", e.target.value)}
                      placeholder="Warning or instruction for this user..."
                    />
                  </td>
                  <td>
                    <button className="btn btn-primary admin-action-btn" type="button" onClick={() => saveModeration(user.userId)}>
                      Save
                    </button>
                    <button className="btn btn-secondary" type="button" onClick={() => removeUser(user.userId)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card admin-table-card" id="admin-reports">
        <div className="admin-section-head">
          <div>
            <h2>Reported Posts</h2>
            <p>Review reports fairly and mark content status with clear outcomes.</p>
          </div>
          <span className="admin-mini-pill">{openReports} open</span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Post</th>
                <th>Reporter</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>{report.id}</td>
                  <td>{report.postId}</td>
                  <td>{report.reporterName}</td>
                  <td>{report.reason}</td>
                  <td>
                    <select value={report.status} onChange={(e) => updateReportStatus(report.id, e.target.value)}>
                      {REPORT_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {REPORT_STATUS_LABELS[status] || status}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card admin-table-card" id="admin-support">
        <div className="admin-section-head">
          <div>
            <h2>Problem Reports / Admin Message Center</h2>
            <p>Reply to problem reports and keep user-facing support messages clear.</p>
          </div>
          <span className="admin-mini-pill">{openSupport} active</span>
        </div>
        <div className="admin-support-list">
          {supportQuestions.length ? supportQuestions.map((ticket) => (
            <article className="admin-support-card" key={ticket.id}>
              <header>
                <div>
                  <strong>{ticket.username || "Member"}</strong>
                  <span>{ticket.email || "No email"}</span>
                </div>
                <small>{ticket.status || "OPEN"}</small>
              </header>
              <p>{ticket.question}</p>
              {ticket.adminResponse ? <blockquote>{ticket.adminResponse}</blockquote> : null}
              <textarea
                rows={3}
                value={supportResponses[ticket.id] || ""}
                onChange={(event) => setSupportResponses((previous) => ({ ...previous, [ticket.id]: event.target.value }))}
                placeholder="Reply with admin guidance..."
              />
              <button className="btn btn-primary" type="button" onClick={() => respondSupport(ticket.id)}>
                Send Response
              </button>
            </article>
          )) : <p className="muted">No support tickets yet.</p>}
        </div>
      </section>
    </div>
  );
}
