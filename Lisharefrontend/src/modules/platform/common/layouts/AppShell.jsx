import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "/src/modules/platform/app/store";
import NotificationDropdown from "/src/modules/social/notification/components/NotificationDropdown";

function NavLink({ to, label }) {
  const location = useLocation();
  const active = location.pathname === to || location.pathname.startsWith(`${to}/`);
  return (
    <Link className={`shell-nav-link ${active ? "active" : ""}`} to={to}>
      {label}
    </Link>
  );
}

export default function AppShell() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="shell">
      <aside className="shell-sidebar">
        <div className="shell-brand">Lishare</div>
        <NavLink to="/home" label="Feed" />
        <NavLink to="/profile" label="Profile" />
        <NavLink to="/friends" label="Friends" />
        <NavLink to="/chat" label="Chat" />
        <NavLink to="/marketplace" label="Marketplace" />
        <NavLink to="/orders" label="Orders" />
        <NavLink to="/calendar" label="Calendar" />
        {role === "ROLE_BUSINESS" ? <NavLink to="/business" label="Business" /> : null}
        {role === "ROLE_ADMIN" ? <NavLink to="/admin" label="Admin" /> : null}
      </aside>

      <div className="shell-main">
        <header className="shell-header">
          <div className="shell-user">
            <div className="avatar">{user?.firstName?.[0] || user?.name?.[0] || "U"}</div>
            <div>
              <p className="shell-user-name">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="shell-user-role">{role?.replace("ROLE_", "") || "USER"}</p>
            </div>
          </div>
          <div className="shell-header-actions">
            <NotificationDropdown />
            <button type="button" className="btn btn-secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <main className="shell-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
