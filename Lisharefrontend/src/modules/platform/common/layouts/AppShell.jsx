import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "/src/modules/platform/app/store";
import NotificationDropdown from "/src/modules/social/notification/components/NotificationDropdown";

function NavIcon({ name }) {
  const paths = {
    home: "M3 10.5L12 3l9 7.5v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
    profile: "M12 12a4.2 4.2 0 1 0-4.2-4.2A4.2 4.2 0 0 0 12 12zm0 2.2c-4.34 0-7.8 2.27-7.8 5.08 0 .4.32.72.72.72h14.16a.72.72 0 0 0 .72-.72c0-2.81-3.46-5.08-7.8-5.08z",
    friends: "M8.2 11a3.4 3.4 0 1 0-3.4-3.4A3.4 3.4 0 0 0 8.2 11zm7.6 0a3.4 3.4 0 1 0-3.4-3.4 3.4 3.4 0 0 0 3.4 3.4zM8.2 13.4c-3.18 0-5.7 1.64-5.7 3.67 0 .4.32.73.72.73h9.96a.72.72 0 0 0 .72-.73c0-2.03-2.52-3.67-5.7-3.67zm7.6.2c-.77 0-1.5.1-2.18.29 1.22.8 1.98 1.86 1.98 3.02h4.56a.72.72 0 0 0 .72-.73c0-1.44-2.12-2.58-5.08-2.58z",
    chat: "M5 4h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4.5 3.2a.8.8 0 0 1-1.26-.65V6a2 2 0 0 1 2-2z",
    marketplace: "M4 7h16l-1.1 12.1a1 1 0 0 1-1 .9H6.1a1 1 0 0 1-1-.9zM7.5 7l1.1-2.4A2.8 2.8 0 0 1 11.2 3h1.6a2.8 2.8 0 0 1 2.6 1.6L16.5 7",
    orders: "M5 5h14v4H5zM5 11h14v8H5zM8 13.5h3.8M8 16.5h6.5",
    calendar: "M7 3v2.4M17 3v2.4M4.6 7h14.8a1.2 1.2 0 0 1 1.2 1.2v10.2a1.2 1.2 0 0 1-1.2 1.2H4.6a1.2 1.2 0 0 1-1.2-1.2V8.2A1.2 1.2 0 0 1 4.6 7zm3.2 4h2.8v2.4H7.8zm5.6 0h2.8v2.4h-2.8z",
    bookmark: "M7 3h10a1 1 0 0 1 1 1v17l-6-4-6 4V4a1 1 0 0 1 1-1z",
    analytics: "M4 20V9M9 20V5M14 20v-7M19 20v-3",
    business: "M4 20V7.8a1 1 0 0 1 1-1h5.6V4.7a.9.9 0 0 1 .9-.9h.9a.9.9 0 0 1 .9.9v2.1H19a1 1 0 0 1 1 1V20M8 20v-5.2h8V20",
    admin: "M12 3l7.2 4v5.6c0 4.2-3 7.2-7.2 8.4-4.2-1.2-7.2-4.2-7.2-8.4V7zM9 11.4l2 2 4-4"
  };

  return (
    <svg className="shell-nav-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name] || paths.home} />
    </svg>
  );
}

function ShellActionIcon({ type, className = "" }) {
  const classNames = `shell-inline-icon ${className}`.trim();
  const icons = {
    sparkle: <path d="M12 3.5 13.8 8l4.7 1.3-4.7 1.3L12 15l-1.8-4.4-4.7-1.3L10.2 8z" />,
    check: <path d="m5 12 4 4 10-10" />,
    chevron: <path d="m9 6 6 6-6 6" />,
    theme: (
      <>
        <path d="M12 3a9 9 0 0 0 0 18h1.2a1.8 1.8 0 0 0 1.3-3.1l-.4-.4a1.7 1.7 0 0 1 1.2-2.9H16a5 5 0 0 0 0-10A9 9 0 0 0 12 3z" />
        <circle cx="7.5" cy="10" r="1" />
        <circle cx="10" cy="7.2" r="1" />
        <circle cx="13.5" cy="7.4" r="1" />
        <circle cx="9.4" cy="13.2" r="1" />
      </>
    ),
    menu: (
      <>
        <circle cx="12" cy="5" r="1.7" />
        <circle cx="12" cy="12" r="1.7" />
        <circle cx="12" cy="19" r="1.7" />
      </>
    ),
    logout: <path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 16l4-4-4-4M20 12H10" />,
    search: <path d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />,
    settings: (
      <>
        <circle cx="12" cy="12" r="2.8" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4" />
      </>
    )
  };

  return (
    <svg className={classNames} viewBox="0 0 24 24" aria-hidden="true">
      {icons[type] || icons.menu}
    </svg>
  );
}

function NavLink({ to, label, icon }) {
  const location = useLocation();
  const active = location.pathname === to || location.pathname.startsWith(`${to}/`);
  return (
    <Link className={`shell-nav-link ${active ? "active" : ""}`} to={to}>
      <span className="shell-nav-icon-wrap" aria-hidden="true">
        <NavIcon name={icon} />
      </span>
      <span className="shell-nav-label">{label}</span>
    </Link>
  );
}

function getPageMeta(pathname) {
  const map = [
    { key: "/home", title: "Home Feed", subtitle: "Community timeline and social updates", showDot: true },
    { key: "/profile", title: "Profile", subtitle: "Personal details and account settings" },
    { key: "/friends", title: "Friends", subtitle: "Connections, followers and requests" },
    { key: "/chat", title: "Chat", subtitle: "Realtime conversations and groups" },
    { key: "/marketplace", title: "Marketplace", subtitle: "Products and shopping activity" },
    { key: "/orders", title: "Orders", subtitle: "Order status, history and tracking" },
    { key: "/calendar", title: "Calendar", subtitle: "Events, plans and reminders" },
    { key: "/business", title: "Business", subtitle: "Page management and product publishing" },
    { key: "/admin", title: "Admin Dashboard", subtitle: "Moderation and platform controls" }
  ];

  const matched = map.find((item) => pathname.startsWith(item.key));
  return matched || { title: "Lishare", subtitle: "Social media and business workspace", showDot: false };
}

export default function AppShell() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [homeTheme, setHomeTheme] = useState(() => localStorage.getItem("lishareHomeTheme") || "ember");
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);
  const displayName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.name || "User";
  const userHandle = `@${String(user?.email || displayName)
    .split("@")[0]
    .replace(/[^a-zA-Z0-9_]/g, "")
    .toLowerCase() || "lishare"}`;
  const pageMeta = getPageMeta(location.pathname);
  const isHomeRoute = location.pathname.startsWith("/home");
  const primaryLinks = [
    { to: "/home", label: "Feed", icon: "home" },
    { to: "/profile", label: "Profile", icon: "profile" },
    { to: "/friends", label: "Friends", icon: "friends" },
    { to: "/chat", label: "Chat", icon: "chat" }
  ];
  const commerceLinks = [
    { to: "/marketplace", label: "Marketplace", icon: "marketplace" },
    { to: "/orders", label: "Orders", icon: "orders" },
    { to: "/calendar", label: "Calendar", icon: "calendar" },
    { to: "/bookmarks", label: "Bookmarks", icon: "bookmark" },
    { to: "/analytics", label: "Analytics", icon: "analytics" }
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    localStorage.setItem("lishareHomeTheme", homeTheme);
  }, [homeTheme]);

  const shellClassName = `shell ${isHomeRoute ? `shell-home-theme shell-theme-${homeTheme}` : ""}`;

  return (
    <div className={shellClassName}>
      <aside className="shell-sidebar">
        <div className="shell-brand-wrap">
          <div className="shell-brand">
            Lishare
            <span className="shell-brand-mark" aria-hidden="true">
              <ShellActionIcon type="sparkle" />
            </span>
          </div>
          <p className="shell-brand-subtitle">Social & Business Hub</p>
        </div>
        <div className="shell-nav-scroll">
          <nav className="shell-nav" aria-label="Primary">
            <p className="shell-nav-title">Social</p>
            {primaryLinks.map((item) => (
              <NavLink key={item.to} to={item.to} label={item.label} icon={item.icon} />
            ))}
            <p className="shell-nav-title">Productivity</p>
            {commerceLinks.map((item) => (
              <NavLink key={item.to} to={item.to} label={item.label} icon={item.icon} />
            ))}
            {role === "ROLE_BUSINESS" ? <NavLink to="/business" label="Business" icon="business" /> : null}
            {role === "ROLE_ADMIN" ? <NavLink to="/admin" label="Admin" icon="admin" /> : null}
          </nav>
          <section className="shell-side-user-card">
            <div className="shell-side-user-top">
              <div className="avatar">{user?.firstName?.[0] || user?.name?.[0] || "U"}</div>
              <div>
                <p className="shell-user-name">
                  {displayName}
                  <span className="shell-user-verified" aria-hidden="true">
                    <ShellActionIcon type="check" />
                  </span>
                </p>
                <p className="shell-user-role shell-user-handle">{userHandle}</p>
              </div>
              <button type="button" className="shell-side-user-menu" aria-label="User menu">
                <ShellActionIcon type="chevron" />
              </button>
            </div>
            <div className="shell-user-level">
              <ShellActionIcon type="sparkle" />
              <span>Level 12</span>
              <ShellActionIcon type="chevron" />
            </div>
            <span className="shell-user-progress" aria-hidden="true" />
            <p className="shell-user-xp">2,450 / 5,000 XP</p>
          </section>
        </div>
      </aside>

      <div className="shell-main">
        <header className="shell-header">
          <div className="shell-header-left">
            <div className="shell-page-meta">
              <h1 className="shell-page-title">{pageMeta.title}</h1>
              <p className="shell-page-subtitle">
                {pageMeta.showDot ? <span className="shell-subtitle-dot" aria-hidden="true" /> : null}
                {pageMeta.subtitle}
              </p>
            </div>
          </div>
          <div className="shell-header-right">
            <div className="shell-user">
              <div className="avatar">{user?.firstName?.[0] || user?.name?.[0] || "U"}</div>
              <div>
                <p className="shell-user-name">{displayName}</p>
                <p className="shell-user-role shell-user-handle">{userHandle}</p>
              </div>
            </div>
            <div className="shell-header-actions">
              <button type="button" className="shell-icon-action-btn" aria-label="Search" title="Search">
                <ShellActionIcon type="search" />
              </button>
              <NotificationDropdown />
              {isHomeRoute ? (
                <div className="shell-theme-switch" aria-label="Color mode">
                  <button
                    type="button"
                    className="shell-theme-trigger shell-icon-action-btn"
                    onClick={() => setThemeMenuOpen((open) => !open)}
                    aria-label="Change color mode"
                    aria-expanded={themeMenuOpen}
                    title="Change color mode"
                  >
                    <ShellActionIcon type="settings" />
                  </button>
                  {themeMenuOpen ? (
                    <div className="shell-theme-menu">
                      <button
                        type="button"
                        className={`shell-theme-dot shell-theme-dot-ember ${homeTheme === "ember" ? "active" : ""}`}
                        onClick={() => {
                          setHomeTheme("ember");
                          setThemeMenuOpen(false);
                        }}
                        aria-label="Use amber color mode"
                        title="Amber mode"
                      />
                      <button
                        type="button"
                        className={`shell-theme-dot shell-theme-dot-aurora ${homeTheme === "aurora" ? "active" : ""}`}
                        onClick={() => {
                          setHomeTheme("aurora");
                          setThemeMenuOpen(false);
                        }}
                        aria-label="Use aurora color mode"
                        title="Aurora mode"
                      />
                    </div>
                  ) : null}
                </div>
              ) : (
                <button type="button" className="shell-icon-action-btn" aria-label="Settings" title="Settings">
                  <ShellActionIcon type="settings" />
                </button>
              )}
              <button type="button" className="btn btn-secondary shell-logout-btn" onClick={handleLogout}>
                <ShellActionIcon type="logout" />
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="shell-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
