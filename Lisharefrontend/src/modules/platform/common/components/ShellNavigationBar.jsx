import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "/src/modules/platform/app/store";
import NotificationDropdown from "/src/modules/social/notification/components/NotificationDropdown";
import { Icon } from "/src/modules/platform/common/ui/DashboardUI";
import { getPageMeta, getShellUser, ShellActionIcon } from "/src/modules/platform/common/components/shellNavigation";

export default function ShellNavigationBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [headerSearch, setHeaderSearch] = useState("");
  const pageMeta = getPageMeta(location.pathname);
  const { displayName, userHandle, avatarSrc, avatarInitial } = getShellUser(user);
  const isHomeFeed = location.pathname === "/home" || location.pathname.startsWith("/home/");

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const handleHeaderSearch = (event) => {
    event.preventDefault();
    const query = headerSearch.trim();
    if (!query) return;
    navigate(`/friends?query=${encodeURIComponent(query)}`);
  };

  return (
    <header className={`shell-header ${isHomeFeed ? "shell-header-home-feed" : ""}`}>
      <div className="shell-header-left">
        <div className="shell-page-meta">
          {isHomeFeed ? (
            <h1 className="shell-page-title shell-page-title-plant" aria-label={pageMeta.title}>
              <span className="plant-title-word plant-title-home">
                Home
                <span className="plant-sprout plant-sprout-left" aria-hidden="true" />
                <span className="plant-sprout plant-sprout-top" aria-hidden="true" />
              </span>
              {" "}
              <span className="plant-title-word plant-title-feed">
                Feed
                <span className="plant-sprout plant-sprout-right" aria-hidden="true" />
              </span>
            </h1>
          ) : (
            <h1 className="shell-page-title">{pageMeta.title}</h1>
          )}
          <p className="shell-page-subtitle">
            {pageMeta.showDot ? <span className="shell-subtitle-dot" aria-hidden="true" /> : null}
            {pageMeta.subtitle}
          </p>
        </div>
      </div>

      <div className="shell-header-right">
        <form className="shell-header-search" aria-label="Search AgroLink Hub" onSubmit={handleHeaderSearch}>
          <Icon name="search" />
          <input
            value={headerSearch}
            onChange={(event) => setHeaderSearch(event.target.value)}
            placeholder="Search people, posts, products..."
          />
          <kbd>Ctrl K</kbd>
        </form>

        <div className="shell-user">
          <div className="avatar">{avatarSrc ? <img src={avatarSrc} alt={displayName} /> : avatarInitial}</div>
          <div>
            <p className="shell-user-name">{displayName}</p>
            <p className="shell-user-role shell-user-handle">{userHandle}</p>
          </div>
        </div>

        <div className="shell-header-actions">
          <NotificationDropdown />
          <button type="button" className="btn btn-secondary shell-logout-btn" onClick={handleLogout}>
            <ShellActionIcon type="logout" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
