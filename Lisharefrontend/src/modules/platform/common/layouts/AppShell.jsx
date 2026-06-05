import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import ShellNavigationBar from "/src/modules/platform/common/components/ShellNavigationBar";
import ShellSidebar from "/src/modules/platform/common/components/ShellSidebar";
import { THEME_MODE_KEY } from "/src/modules/platform/common/components/shellNavigation";

const SIDEBAR_COLLAPSED_KEY = "lishareSidebarCollapsed";

export default function AppShell() {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true");
  const pathname = location.pathname;
  const greenSidebarRoutes = ["/home", "/marketplace", "/orders", "/bookmarks", "/calendar"];
  const usesGreenSidebar = greenSidebarRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const usesProfileSidebar = pathname === "/profile" || pathname.startsWith("/profile/");
  const sidebarThemeClass = usesProfileSidebar
    ? "shell-sidebar-profile-theme"
    : usesGreenSidebar
      ? "shell-sidebar-green-theme"
      : "shell-sidebar-neutral-theme";

  useEffect(() => {
    localStorage.setItem(THEME_MODE_KEY, "light");
  }, []);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  return (
    <div className={`shell shell-home-theme shell-theme-light ${sidebarThemeClass} ${sidebarCollapsed ? "shell-sidebar-collapsed" : ""}`}>
      <ShellSidebar collapsed={sidebarCollapsed} onToggleCollapsed={() => setSidebarCollapsed((collapsed) => !collapsed)} />
      <div className="shell-main">
        <ShellNavigationBar />
        <main className="shell-content">
          <div className="shell-page-transition" key={location.pathname}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
