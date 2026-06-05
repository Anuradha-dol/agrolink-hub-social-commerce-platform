import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { adminService } from "../services/adminService";
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
  StatusBadge
} from "/src/modules/platform/common/ui/DashboardUI";

const ROLES = ["ROLE_USER", "ROLE_BUSINESS", "ROLE_FARMER", "ROLE_CREATOR", "ROLE_ADMIN"];
const ROLE_LABELS = {
  ROLE_USER: "User",
  ROLE_BUSINESS: "Business Seller",
  ROLE_FARMER: "Farmer Seller",
  ROLE_CREATOR: "Creator",
  ROLE_ADMIN: "Admin"
};
const MODERATION_STATUSES = ["ACTIVE", "WARNED", "SUSPENDED"];
const REPORT_STATUSES = ["OPEN", "REVIEWED", "RESOLVED", "REJECTED"];
const REPORT_STATUS_LABELS = {
  OPEN: "Open",
  REVIEWED: "Reviewed",
  RESOLVED: "Fair - resolved",
  REJECTED: "Not fair - rejected"
};

function unwrapContent(response) {
  const payload = response?.data?.data ?? response?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
}

function userName(user = {}) {
  return `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "AgroLink user";
}

function roleTone(role = "") {
  if (role === "ROLE_ADMIN") return "purple";
  if (role === "ROLE_BUSINESS" || role === "ROLE_FARMER") return "green";
  if (role === "ROLE_CREATOR") return "pink";
  return "blue";
}

export default function AdminDashboardPage() {
  const { pushToast } = useToast();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [supportQuestions, setSupportQuestions] = useState([]);
  const [moderationDrafts, setModerationDrafts] = useState({});
  const [supportResponses, setSupportResponses] = useState({});
  const [userSearch, setUserSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [activeReport, setActiveReport] = useState(null);
  const [busy, setBusy] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, reportsRes, supportRes] = await Promise.all([
        adminService.getStats(),
        adminService.getUsers({ page: 0, size: 80 }),
        adminService.getReports({ page: 0, size: 80 }),
        adminService.getSupportQuestions()
      ]);

      const loadedUsers = unwrapContent(usersRes);
      setStats(statsRes?.data?.data || statsRes?.data || null);
      setUsers(loadedUsers);
      setReports(unwrapContent(reportsRes));
      setSupportQuestions(Array.isArray(supportRes?.data) ? supportRes.data : unwrapContent(supportRes));
      setModerationDrafts((previous) => {
        const next = {};
        loadedUsers.forEach((entry) => {
          next[entry.userId] = previous[entry.userId] || {
            status: entry.moderationStatus || "ACTIVE",
            message: entry.moderationMessage || ""
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
        : pathname.includes("/admin/users") || pathname.includes("/admin/business-users") || pathname.includes("/admin/admins") || pathname.includes("/admin/farmers") || pathname.includes("/admin/creators")
          ? "admin-users"
          : "";
    if (targetId) {
      window.setTimeout(() => document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    }
  }, [loading, pathname]);

  const updateRole = async (userId, role) => {
    setBusy(`role-${userId}`);
    try {
      await adminService.updateRole(userId, role);
      pushToast("User role updated", "success");
      await load();
    } catch {
      pushToast("Failed to update role", "error");
    } finally {
      setBusy("");
    }
  };

  const openDeleteUser = (entry) => {
    setDeleteTarget(entry);
    setDeleteReason("");
  };

  const removeUser = async () => {
    const reason = deleteReason.trim();
    if (!deleteTarget?.userId || !reason) {
      pushToast("Deletion reason is required", "error");
      return;
    }
    setBusy("delete-user");
    try {
      await adminService.deleteUser(deleteTarget.userId, reason);
      pushToast("User deleted and deletion reason emailed", "success");
      setDeleteTarget(null);
      setDeleteReason("");
      await load();
    } catch {
      pushToast("Failed to delete user", "error");
    } finally {
      setBusy("");
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
    setBusy(`moderation-${userId}`);
    try {
      await adminService.updateModeration(userId, draft.status || "ACTIVE", draft.message || "");
      pushToast("Moderation message updated", "success");
      await load();
    } catch (error) {
      pushToast(error?.response?.data?.message || "Failed to update moderation", "error");
    } finally {
      setBusy("");
    }
  };

  const updateReportStatus = async (reportId, status) => {
    setBusy(`report-${reportId}`);
    try {
      await adminService.updateReportStatus(reportId, status);
      pushToast("Report status updated", "success");
      await load();
    } catch {
      pushToast("Failed to update report status", "error");
    } finally {
      setBusy("");
    }
  };

  const respondSupport = async (ticketId) => {
    const response = (supportResponses[ticketId] || "").trim();
    if (!response) {
      pushToast("Write an admin response first", "error");
      return;
    }
    setBusy(`support-${ticketId}`);
    try {
      await adminService.respondSupportQuestion(ticketId, response);
      pushToast("Support response sent", "success");
      setSupportResponses((previous) => ({ ...previous, [ticketId]: "" }));
      await load();
    } catch {
      pushToast("Failed to respond to support ticket", "error");
    } finally {
      setBusy("");
    }
  };

  const roleBreakdown = useMemo(() => {
    const counts = Object.fromEntries(ROLES.map((role) => [role, 0]));
    users.forEach((item) => {
      counts[item.role] = (counts[item.role] || 0) + 1;
    });
    return counts;
  }, [users]);

  const routeRoleFilter = useMemo(() => {
    if (pathname.includes("/admin/business-users")) return "ROLE_BUSINESS";
    if (pathname.includes("/admin/farmers")) return "ROLE_FARMER";
    if (pathname.includes("/admin/creators")) return "ROLE_CREATOR";
    if (pathname.includes("/admin/admins")) return "ROLE_ADMIN";
    if (pathname.includes("/admin/users")) return "ROLE_USER";
    return "";
  }, [pathname]);

  const userSectionTitle = routeRoleFilter ? `${ROLE_LABELS[routeRoleFilter] || "User"} Accounts` : "Users";

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    return users.filter((item) => {
      if (routeRoleFilter && item.role !== routeRoleFilter) return false;
      if (!query) return true;
      const name = userName(item).toLowerCase();
      return name.includes(query) || String(item.email || "").toLowerCase().includes(query) || String(item.role || "").toLowerCase().includes(query);
    });
  }, [routeRoleFilter, userSearch, users]);

  const openReports = reports.filter((report) => String(report.status || "").toUpperCase() === "OPEN").length;
  const openSupport = supportQuestions.filter((ticket) => String(ticket.status || "OPEN").toUpperCase() !== "CLOSED").length;
  const systemHealth = openReports || openSupport ? 92 : 98;

  if (loading) return <LoadingState text="Loading admin dashboard..." />;

  return (
    <PageGrid className="admin-workspace-dashboard">
      <OverviewHero
        icon="settings"
        eyebrow="Admin Workspace"
        title="Manage platform users, reports, support tickets, and system health."
        subtitle="Monitor community safety, seller health, admin actions, business pages, and creator activity from one clean workspace."
        stats={[
          { label: "Users", value: users.length, trend: "Loaded accounts" },
          { label: "Reports", value: reports.length, trend: `${openReports} open` },
          { label: "Support Tickets", value: supportQuestions.length, trend: `${openSupport} active` },
          { label: "Health", value: `${systemHealth}%`, trend: "Platform status" }
        ]}
      />

      <div className="admin-workspace-layout">
        <main className="admin-workspace-main">
          <div className="admin-kpi-grid">
            <StatCard icon="users" label="Total Users" value={stats?.totalUsers ?? users.length} trend="Platform accounts" tone="green" />
            <StatCard icon="chat" label="Total Posts" value={stats?.totalPosts ?? 0} trend="Content loaded" tone="blue" />
            <StatCard icon="order" label="Total Orders" value={stats?.totalOrders ?? 0} trend="Marketplace flow" tone="purple" />
            <StatCard icon="bag" label="Products" value={stats?.totalProducts ?? 0} trend="Seller catalog" tone="orange" />
            <StatCard icon="home" label="Business Pages" value={stats?.totalBusinessPages ?? 0} trend="Public pages" tone="green" />
          </div>

          <Card className="admin-role-section">
            <SectionHeader title="User Management" subtitle="Filter by account type, then update roles, moderation, or account removal." />
            <div className="admin-role-grid-v2">
              {ROLES.map((role) => (
                <Link key={role} className={`admin-role-card-v2 ${routeRoleFilter === role ? "active" : ""}`} to={role === "ROLE_USER" ? "/admin/users" : role === "ROLE_BUSINESS" ? "/admin/business-users" : role === "ROLE_FARMER" ? "/admin/farmers" : role === "ROLE_CREATOR" ? "/admin/creators" : "/admin/admins"}>
                  <span><Icon name={role === "ROLE_ADMIN" ? "settings" : role === "ROLE_BUSINESS" || role === "ROLE_FARMER" ? "bag" : role === "ROLE_CREATOR" ? "spark" : "user"} /></span>
                  <strong>{ROLE_LABELS[role]}</strong>
                  <b>{roleBreakdown[role] || 0}</b>
                  <small>{role === "ROLE_USER" ? "Community" : role === "ROLE_ADMIN" ? "Command" : "Managed role"}</small>
                </Link>
              ))}
            </div>
          </Card>

          <Card className="admin-table-card-v2" id="admin-users">
            <SectionHeader
              title={userSectionTitle}
              subtitle="Manage roles, verification status, moderation messages, and safe deletion notices."
              action={(
                <label className="admin-search-field">
                  <Icon name="search" />
                  <input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Search users, business users, admins..." />
                </label>
              )}
            />
            <div className="dashboard-table-wrap">
              <table className="dashboard-table admin-users-table-v2">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Moderation</th>
                    <th>Message</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((entry) => (
                    <tr key={entry.userId}>
                      <td>
                        <div className="admin-user-cell">
                          <span>{userName(entry).slice(0, 1).toUpperCase()}</span>
                          <div><strong>{userName(entry)}</strong><small>ID {entry.userId}</small></div>
                        </div>
                      </td>
                      <td>{entry.email}</td>
                      <td>
                        <select value={entry.role} onChange={(event) => updateRole(entry.userId, event.target.value)} disabled={busy === `role-${entry.userId}`}>
                          {ROLES.map((role) => <option key={role} value={role}>{ROLE_LABELS[role] || role.replace("ROLE_", "")}</option>)}
                        </select>
                      </td>
                      <td><StatusBadge status={entry.verified ? "Verified" : "Unverified"} tone={entry.verified ? "green" : "orange"} /></td>
                      <td>
                        <select value={moderationDrafts[entry.userId]?.status || entry.moderationStatus || "ACTIVE"} onChange={(event) => updateModerationDraft(entry.userId, "status", event.target.value)}>
                          {MODERATION_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                        </select>
                      </td>
                      <td>
                        <textarea
                          className="admin-message-input"
                          rows={2}
                          value={moderationDrafts[entry.userId]?.message ?? entry.moderationMessage ?? ""}
                          onChange={(event) => updateModerationDraft(entry.userId, "message", event.target.value)}
                          placeholder="Warning or instruction for this user..."
                        />
                      </td>
                      <td>
                        <div className="table-action-row">
                          <Button icon="check" variant="gradient" onClick={() => saveModeration(entry.userId)} disabled={busy === `moderation-${entry.userId}`}>Save</Button>
                          <Button icon="trash" variant="danger" onClick={() => openDeleteUser(entry)}>Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!filteredUsers.length ? <EmptyPanel icon="users" title="No users found" subtitle="Try another role filter or search term." /> : null}
          </Card>

          <Card className="admin-table-card-v2" id="admin-reports">
            <SectionHeader title="Reported Posts" subtitle="Review reported content and mark the outcome clearly." action={<StatusBadge status={`${openReports} open`} tone={openReports ? "orange" : "green"} />} />
            <div className="dashboard-table-wrap">
              <table className="dashboard-table admin-reports-table-v2">
                <thead>
                  <tr>
                    <th>Report ID</th>
                    <th>Post</th>
                    <th>Reporter</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td>RPT-{String(report.id || "").padStart(4, "0")}</td>
                      <td>{report.postId || "-"}</td>
                      <td>{report.reporterName || "Reporter"}</td>
                      <td>{report.reason || "Review needed"}</td>
                      <td>
                        <select value={report.status} onChange={(event) => updateReportStatus(report.id, event.target.value)} disabled={busy === `report-${report.id}`}>
                          {REPORT_STATUSES.map((status) => <option key={status} value={status}>{REPORT_STATUS_LABELS[status] || status}</option>)}
                        </select>
                      </td>
                      <td><Button icon="eye" onClick={() => setActiveReport(report)}>Details</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!reports.length ? <EmptyPanel icon="bell" title="No reports" subtitle="Reported content will appear here for review." /> : null}
          </Card>

          <Card className="admin-table-card-v2" id="admin-support">
            <SectionHeader title="Problem Reports / Admin Message Center" subtitle="Reply to support tickets and keep user-facing guidance clear." action={<StatusBadge status={`${openSupport} active`} tone={openSupport ? "orange" : "green"} />} />
            <div className="admin-support-grid-v2">
              {supportQuestions.map((ticket) => (
                <article className="admin-support-card-v2" key={ticket.id}>
                  <header>
                    <div><strong>{ticket.username || "Member"}</strong><span>{ticket.email || "No email"}</span></div>
                    <StatusBadge status={ticket.status || "OPEN"} tone={String(ticket.status || "OPEN").toUpperCase() === "CLOSED" ? "green" : "orange"} />
                  </header>
                  <p>{ticket.question}</p>
                  {ticket.adminResponse ? <blockquote>{ticket.adminResponse}</blockquote> : null}
                  <textarea
                    rows={3}
                    value={supportResponses[ticket.id] || ""}
                    onChange={(event) => setSupportResponses((previous) => ({ ...previous, [ticket.id]: event.target.value }))}
                    placeholder="Reply with admin guidance..."
                  />
                  <Button icon="send" variant="gradient" onClick={() => respondSupport(ticket.id)} disabled={busy === `support-${ticket.id}`}>
                    {busy === `support-${ticket.id}` ? "Sending..." : "Send Response"}
                  </Button>
                </article>
              ))}
              {!supportQuestions.length ? <EmptyPanel icon="chat" title="No support tickets yet" subtitle="Problem reports from users will appear here." /> : null}
            </div>
          </Card>
        </main>

        <aside className="side-stack admin-insight-side">
          <Card>
            <SectionHeader title="Platform Overview" action={<Icon name="analytics" />} />
            <ul className="panel-list">
              <li className="panel-row"><div><strong>{users.length}</strong><span>Users</span></div><StatusBadge status="Loaded" tone="green" /></li>
              <li className="panel-row"><div><strong>{reports.length}</strong><span>Reports</span></div><StatusBadge status={`${openReports} open`} tone={openReports ? "orange" : "green"} /></li>
              <li className="panel-row"><div><strong>{supportQuestions.length}</strong><span>Support tickets</span></div><StatusBadge status={`${openSupport} active`} tone={openSupport ? "orange" : "green"} /></li>
            </ul>
            <Button icon="analytics" variant="gradient" onClick={() => navigate("/analytics")}>View Full Analytics</Button>
          </Card>

          <Card className="admin-health-card">
            <SectionHeader title="System Health" subtitle="All systems are monitored from dashboard activity." />
            <div className="admin-health-ring" style={{ "--health": `${systemHealth}%` }}><strong>{systemHealth}%</strong><span>Healthy</span></div>
            <ul className="panel-list">
              <li className="panel-row"><div><strong>Server Uptime</strong><span>99.9%</span></div><StatusBadge status="Stable" tone="green" /></li>
              <li className="panel-row"><div><strong>Reports</strong><span>{openReports} open</span></div><StatusBadge status={openReports ? "Review" : "Clear"} tone={openReports ? "orange" : "green"} /></li>
              <li className="panel-row"><div><strong>Support</strong><span>{openSupport} active</span></div><StatusBadge status={openSupport ? "Queue" : "Clear"} tone={openSupport ? "orange" : "green"} /></li>
            </ul>
          </Card>

          <Card>
            <SectionHeader title="Quick Actions" />
            <div className="admin-quick-action-grid">
              <Link to="/admin/users"><Icon name="users" />Manage Users</Link>
              <Link to="/admin/moderation"><Icon name="bell" />Manage Reports</Link>
              <Link to="/admin/support"><Icon name="chat" />Support Tickets</Link>
              <Link to="/analytics"><Icon name="analytics" />Analytics</Link>
            </div>
          </Card>
        </aside>
      </div>

      <Modal
        open={Boolean(deleteTarget)}
        title="Delete User Account"
        subtitle="A deletion reason is required and will be sent to the user."
        onClose={busy ? undefined : () => setDeleteTarget(null)}
        footer={(
          <>
            <Button onClick={() => setDeleteTarget(null)} disabled={Boolean(busy)}>Cancel</Button>
            <Button icon="trash" variant="danger" onClick={removeUser} disabled={busy === "delete-user"}>
              {busy === "delete-user" ? "Deleting..." : "Delete User"}
            </Button>
          </>
        )}
      >
        <div className="admin-delete-modal-body">
          <div className="admin-user-cell">
            <span>{userName(deleteTarget || {}).slice(0, 1).toUpperCase()}</span>
            <div><strong>{userName(deleteTarget || {})}</strong><small>{deleteTarget?.email}</small></div>
          </div>
          <label>
            Deletion reason
            <textarea rows={4} value={deleteReason} onChange={(event) => setDeleteReason(event.target.value)} placeholder="Explain why this account is being removed." />
          </label>
        </div>
      </Modal>

      <Modal
        open={Boolean(activeReport)}
        title="Report Details"
        subtitle="Review context before changing the report outcome."
        onClose={() => setActiveReport(null)}
        footer={<Button onClick={() => setActiveReport(null)}>Close</Button>}
      >
        {activeReport ? (
          <div className="admin-report-detail">
            <span><strong>Report ID</strong>RPT-{String(activeReport.id || "").padStart(4, "0")}</span>
            <span><strong>Post</strong>{activeReport.postId || "-"}</span>
            <span><strong>Reporter</strong>{activeReport.reporterName || "Reporter"}</span>
            <span><strong>Reason</strong>{activeReport.reason || "Review needed"}</span>
            <span><strong>Status</strong>{REPORT_STATUS_LABELS[activeReport.status] || activeReport.status}</span>
          </div>
        ) : null}
      </Modal>
    </PageGrid>
  );
}
