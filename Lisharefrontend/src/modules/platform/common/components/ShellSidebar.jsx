import { useAuth } from "/src/modules/platform/app/store";
import agroLinkHubLogo from "/src/assets/branding/agrolink-hub-logo.svg";
import { getNavigationSections, getShellUser, ShellActionIcon, ShellNavLink } from "/src/modules/platform/common/components/shellNavigation";

export default function ShellSidebar({ collapsed = false, onToggleCollapsed }) {
  const { user, role } = useAuth();
  const navigationSections = getNavigationSections(user, role);
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
    <aside className={`shell-sidebar ${collapsed ? "is-collapsed" : ""}`}>
      <div className="shell-brand-wrap">
        <div className="shell-brand-logo" aria-hidden="true">
          <img src={agroLinkHubLogo} alt="" />
        </div>
        <span className="shell-brand-divider" aria-hidden="true" />
        <div className="shell-brand-copy">
          <div className="shell-brand-name" aria-label="AgroLink Hub">
            <span className="shell-brand-agro">AgroLink</span>
            <span className="shell-brand-hub">Hub</span>
          </div>
          <p className="shell-brand-subtitle">
            <span>Connect</span>
            <i aria-hidden="true" />
            <span>Share</span>
            <i aria-hidden="true" />
            <span>Sell</span>
            <i aria-hidden="true" />
            <span>Grow Together</span>
          </p>
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
          <ShellActionIcon type="chevron" />
        </button>
      </div>

      <div className="shell-nav-scroll">
        <nav className="shell-nav" aria-label="Primary">
          {navigationSections.map((section) => (
            <div className="shell-nav-section" key={section.title}>
              <p className="shell-nav-title">{section.title}</p>
              {section.items.map((item) => (
                <ShellNavLink key={item.to} to={item.to} label={item.label} icon={item.icon} />
              ))}
            </div>
          ))}
        </nav>

        <section className="shell-side-user-card">
          <div className="shell-side-user-top">
            <div className="avatar">{avatarSrc ? <img src={avatarSrc} alt={displayName} /> : avatarInitial}</div>
            <div>
              <p className="shell-user-name">
                {displayName}
                {hasVerifiedBadge ? (
                  <span className="shell-user-verified" aria-hidden="true">
                    <ShellActionIcon type="check" />
                  </span>
                ) : null}
              </p>
              <p className="shell-user-role shell-user-handle">{userHandle}</p>
            </div>
            <button type="button" className="shell-side-user-menu" aria-label="User menu">
              <ShellActionIcon type="chevron" />
            </button>
          </div>
          <div className="shell-user-level">
            <ShellActionIcon type="sparkle" />
            <span>Level {verifiedLevel}</span>
            <ShellActionIcon type="chevron" />
          </div>
          <span
            className="shell-user-progress"
            style={{ background: `linear-gradient(90deg, #1fcf76 0%, #2563eb ${xpProgress}%, rgba(255,255,255,.1) ${xpProgress}%)` }}
            aria-hidden="true"
          />
          <p className="shell-user-xp">{verifiedXp.toLocaleString()} / {nextLevelXp.toLocaleString()} verified XP</p>
        </section>
      </div>
    </aside>
  );
}
