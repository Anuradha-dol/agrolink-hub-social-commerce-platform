import { useAuth } from "/src/modules/platform/app/store";
import agroLinkHubLogo from "/src/assets/branding/agrolink-hub-logo.svg";
import { getNavigationSections, getShellUser, normalizeRoles, ShellActionIcon, ShellNavLink } from "/src/modules/platform/common/components/shellNavigation";

const SIDEBAR_ROLE_META = {
  ROLE_ADMIN: { label: "Admin", tone: "admin" },
  ROLE_BUSINESS: { label: "Business Seller", tone: "business" },
  ROLE_FARMER: { label: "Farmer Seller", tone: "farmer" },
  ROLE_CREATOR: { label: "Creator", tone: "creator" },
  ROLE_USER: { label: "Member", tone: "member" }
};

export default function ShellSidebar({ collapsed = false, onToggleCollapsed }) {
  const { user, role } = useAuth();
  const navigationSections = getNavigationSections(user, role);
  const primaryRole = normalizeRoles(role, user?.role, user?.roles, user?.authority, user?.authorities)[0] || "ROLE_USER";
  const roleMeta = SIDEBAR_ROLE_META[primaryRole] || SIDEBAR_ROLE_META.ROLE_USER;
  const {
    displayName,
    userHandle,
    verifiedXp,
    verifiedLevel,
    nextLevelXp,
    xpProgress,
    hasVerifiedBadge,
    avatarSrc,
    avatarInitial
  } = getShellUser(user);

  return (
    <aside className={`shell-sidebar ${collapsed ? "is-collapsed" : ""}`} data-role-tone={roleMeta.tone}>
      <div className="shell-brand-wrap">
        <div className="shell-brand-logo" aria-hidden="true">
          <img src={agroLinkHubLogo} alt="" />
        </div>
        <div className="shell-brand-copy">
          <div className="shell-brand-name" aria-label="AgroLink Hub">
            <span className="shell-brand-agro">AgroLink</span>
            {" "}
            <span className="shell-brand-hub">Hub</span>
          </div>
        </div>
        <button
          type="button"
          className="shell-sidebar-toggle"
          onClick={onToggleCollapsed}
          title={collapsed ? "Open sidebar" : "Minimize sidebar"}
          aria-label={collapsed ? "Open sidebar" : "Minimize sidebar"}
          aria-expanded={!collapsed}
        >
          <span className="shell-sidebar-toggle-glow" aria-hidden="true" />
          <ShellActionIcon type="sidebarToggle" />
        </button>
      </div>

      <div className="shell-nav-scroll">
        <nav className="shell-nav" aria-label="Primary">
          {navigationSections.map((section) => {
            const sectionKey = section.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            return (
              <div className="shell-nav-section" data-nav-section={sectionKey} key={section.title}>
                <p className="shell-nav-title">{section.title}</p>
                {section.items.map((item) => (
                  <ShellNavLink key={item.to} to={item.to} label={item.label} icon={item.icon} />
                ))}
              </div>
            );
          })}
        </nav>

        <section className="shell-side-user-card">
          <div className="shell-side-user-top">
            <div className="avatar">{avatarSrc ? <img src={avatarSrc} alt={displayName} /> : avatarInitial}</div>
            <div className="shell-side-user-copy">
              <p className="shell-user-name">
                {displayName}
                {hasVerifiedBadge ? (
                  <span className="shell-user-verified" aria-hidden="true">
                    <ShellActionIcon type="check" />
                  </span>
                ) : null}
              </p>
              <p className="shell-user-role shell-user-handle">{userHandle}</p>
              <p className="shell-user-role shell-user-role-label">{roleMeta.label}</p>
            </div>
            <button type="button" className="shell-side-user-menu" aria-label="User menu">
              <ShellActionIcon type="more" />
            </button>
          </div>
          <div className="shell-xp-heading">
            <div className="shell-user-level" data-level={verifiedLevel}>
              <ShellActionIcon type="sparkle" />
              <span>Level {verifiedLevel}</span>
              <ShellActionIcon type="chevron" />
            </div>
            <p className="shell-user-xp">{verifiedXp.toLocaleString()} / {nextLevelXp.toLocaleString()} verified XP</p>
          </div>
          <span
            className="shell-user-progress"
            style={{ "--shell-xp-progress": `${xpProgress}%` }}
            aria-hidden="true"
          />
        </section>
      </div>
    </aside>
  );
}
