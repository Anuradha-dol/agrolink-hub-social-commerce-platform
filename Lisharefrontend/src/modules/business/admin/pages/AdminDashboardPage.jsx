import { useEffect, useState } from "react";
import { adminService } from "../services/adminService";
import LoadingState from "/src/modules/platform/common/components/LoadingState";
import { useToast } from "/src/modules/platform/common/hooks/useToast";

const ROLES = ["ROLE_USER", "ROLE_BUSINESS", "ROLE_ADMIN"];
const REPORT_STATUSES = ["OPEN", "REVIEWED", "RESOLVED", "REJECTED"];

export default function AdminDashboardPage() {
  const { pushToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, reportsRes] = await Promise.all([
        adminService.getStats(),
        adminService.getUsers({ page: 0, size: 50 }),
        adminService.getReports({ page: 0, size: 50 })
      ]);

      setStats(statsRes?.data?.data || null);
      setUsers(usersRes?.data?.data?.content || []);
      setReports(reportsRes?.data?.data?.content || []);
    } catch {
      pushToast("Failed to load admin dashboard", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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
    if (!window.confirm("Delete this user account?")) return;
    try {
      await adminService.deleteUser(userId);
      pushToast("User deleted", "success");
      load();
    } catch {
      pushToast("Failed to delete user", "error");
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

  if (loading) return <LoadingState text="Loading admin dashboard..." />;

  return (
    <div className="admin-page">
      <section className="stats-grid">
        <article className="card"><h3>{stats?.totalUsers ?? 0}</h3><p>Total Users</p></article>
        <article className="card"><h3>{stats?.totalPosts ?? 0}</h3><p>Total Posts</p></article>
        <article className="card"><h3>{stats?.totalOrders ?? 0}</h3><p>Total Orders</p></article>
        <article className="card"><h3>{stats?.totalProducts ?? 0}</h3><p>Total Products</p></article>
        <article className="card"><h3>{stats?.totalBusinessPages ?? 0}</h3><p>Business Pages</p></article>
      </section>

      <section className="card">
        <h2>Users</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
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

      <section className="card">
        <h2>Reported Posts</h2>
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
                          {status}
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
    </div>
  );
}
