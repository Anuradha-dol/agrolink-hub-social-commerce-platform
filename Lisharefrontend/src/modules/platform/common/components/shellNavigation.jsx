import { Link, useLocation } from "react-router-dom";
import { toMediaUrl } from "/src/modules/platform/common/utils/mediaUrl";

export const THEME_MODE_KEY = "lishareThemeMode";

export const NAVIGATION_SECTIONS = [
  {
    title: "Social",
    items: [
      { to: "/home", label: "Home Feed", icon: "home" },
      { to: "/profile", label: "Profile", icon: "profile" },
      { to: "/friends", label: "Friends", icon: "friends" },
      { to: "/chat", label: "Messages", icon: "chat" },
      { to: "/notifications", label: "Notifications", icon: "notifications" }
    ]
  },
  {
    title: "Commerce",
    items: [
      { to: "/marketplace", label: "Marketplace", icon: "marketplace" },
      { to: "/orders", label: "Orders", icon: "orders" },
      { to: "/cart", label: "Cart", icon: "marketplace", roles: ["ROLE_USER", "ROLE_CREATOR"] }
    ]
  },
  {
    title: "Workspace",
    items: [
      { to: "/calendar", label: "Calendar", icon: "calendar" },
      { to: "/analytics", label: "Insights", icon: "analytics" }
    ]
  },
  {
    title: "Account",
    items: [
      { to: "/settings", label: "Settings", icon: "settings" },
      { to: "/support", label: "Support Center", icon: "support", roles: ["ROLE_USER", "ROLE_BUSINESS", "ROLE_FARMER", "ROLE_CREATOR"] }
    ]
  },
  {
    title: "Seller Tools",
    items: [
      { to: "/business", label: "Business Page", icon: "business", roles: ["ROLE_BUSINESS", "ROLE_FARMER"] }
    ]
  },
  {
    title: "Admin Workflow",
    items: [
      { to: "/admin", label: "Command Center", icon: "admin", roles: ["ROLE_ADMIN"] },
      { to: "/admin/users", label: "Users", icon: "profile", roles: ["ROLE_ADMIN"] },
      { to: "/admin/business-users", label: "Business Users", icon: "business", roles: ["ROLE_ADMIN"] },
      { to: "/admin/farmers", label: "Farmer Sellers", icon: "marketplace", roles: ["ROLE_ADMIN"] },
      { to: "/admin/creators", label: "Creators", icon: "analytics", roles: ["ROLE_ADMIN"] },
      { to: "/admin/admins", label: "Admins", icon: "admin", roles: ["ROLE_ADMIN"] },
      { to: "/admin/moderation", label: "Content Moderation", icon: "analytics", roles: ["ROLE_ADMIN"] },
      { to: "/admin/support", label: "Support Tickets", icon: "support", roles: ["ROLE_ADMIN"] }
    ]
  }
];

export const PAGE_META = [
  { key: "/home", title: "Home Feed", subtitle: "Posts, reels, stories and community conversations", showDot: true, searchPlaceholder: "Search people, posts, reels..." },
  { key: "/profile", title: "Profile", subtitle: "Posts, reels, saved items and profile overview", showDot: true, searchPlaceholder: "Search people, posts, profile tags..." },
  { key: "/friends", title: "Friends", subtitle: "Find connections, followers, following and friend requests", searchPlaceholder: "Search friends, followers, people..." },
  { key: "/chat", title: "Messages", subtitle: "Realtime chats, direct messages and group conversations", searchPlaceholder: "Search conversations or people..." },
  { key: "/marketplace", title: "Marketplace", subtitle: "Shop products, compare sellers, manage carts and saved deals", searchPlaceholder: "Search products, sellers, categories..." },
  { key: "/orders", title: "Orders", subtitle: "Track purchases, delivery status, order history and seller updates", searchPlaceholder: "Search orders, products, sellers..." },
  { key: "/cart", title: "Cart", subtitle: "Review selected products, update quantities and place orders", searchPlaceholder: "Search cart products or businesses..." },
  { key: "/calendar", title: "Calendar", subtitle: "Plan events, reminders, farm tasks and business schedules", searchPlaceholder: "Search events, dates, reminders..." },
  { key: "/bookmarks", title: "Cart", subtitle: "Review selected products, update quantities and place orders", searchPlaceholder: "Search cart products or businesses..." },
  { key: "/analytics", title: "Insights", subtitle: "Platform, marketplace, engagement and growth analytics", searchPlaceholder: "Search metrics, products, activity..." },
  { key: "/notifications", title: "Notifications", subtitle: "Requests, alerts, system updates and recent activity", searchPlaceholder: "Search notifications or people..." },
  { key: "/support", title: "Support Center", subtitle: "Submit issues, review admin replies and manage support tickets", searchPlaceholder: "Search tickets, topics, reviews..." },
  { key: "/settings", title: "Settings", subtitle: "Account, email, password, privacy and profile media controls", searchPlaceholder: "Search settings, account options..." },
  { key: "/business", title: "Business", subtitle: "Manage business pages, products, seller profile and publishing", searchPlaceholder: "Search products, pages, orders..." },
  { key: "/admin/users", title: "Admin Users", subtitle: "Regular account management, safety actions and deletion notices", searchPlaceholder: "Search users, emails, roles..." },
  { key: "/admin/business-users", title: "Business Users", subtitle: "Seller accounts, marketplace access and business compliance", searchPlaceholder: "Search business sellers..." },
  { key: "/admin/farmers", title: "Farmer Sellers", subtitle: "Farm seller account management, marketplace listings and trust review", searchPlaceholder: "Search farmer sellers..." },
  { key: "/admin/creators", title: "Creators", subtitle: "Creator account management, content quality and platform growth", searchPlaceholder: "Search creators..." },
  { key: "/admin/admins", title: "Admin Accounts", subtitle: "Platform command users, roles and admin access control", searchPlaceholder: "Search admin accounts..." },
  { key: "/admin/moderation", title: "Content Moderation", subtitle: "Reported content review, safety decisions and fair outcomes", searchPlaceholder: "Search reports or content..." },
  { key: "/admin/support", title: "Support Tickets", subtitle: "Problem reports, admin responses and user support workflow", searchPlaceholder: "Search support tickets..." },
  { key: "/admin", title: "Admin Dashboard", subtitle: "Moderation, user management and platform command controls", searchPlaceholder: "Search admin tools, users, tickets..." }
];

function normalizeRoleName(role) {
  const clean = String(role || "").trim().toUpperCase();
  if (!clean) return "";
  return clean.startsWith("ROLE_") ? clean : `ROLE_${clean}`;
}

export function normalizeRoles(...sources) {
  const roles = [];
  const collect = (value) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach(collect);
      return;
    }
    if (typeof value === "object") {
      collect(value.role ?? value.authority ?? value.name);
      return;
    }
    const normalized = normalizeRoleName(value);
    if (normalized) roles.push(normalized);
  };

  sources.forEach(collect);
  return [...new Set(roles)];
}

export function userHasAnyRole(user, role, allowedRoles = []) {
  if (!allowedRoles.length) return true;
  const userRoles = normalizeRoles(role, user?.role, user?.roles, user?.authority, user?.authorities);
  if (!userRoles.length && user) userRoles.push("ROLE_USER");
  const allowed = allowedRoles.map(normalizeRoleName);
  return allowed.some((allowedRole) => userRoles.includes(allowedRole));
}

export function getNavigationSections(user, role) {
  return NAVIGATION_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => userHasAnyRole(user, role, item.roles))
  })).filter((section) => section.items.length > 0);
}

export function getPageMeta(pathname) {
  return PAGE_META.find((item) => pathname.startsWith(item.key)) || {
    title: "AgroLink Hub",
    subtitle: "Agriculture, social and marketplace workspace",
    showDot: false
  };
}

export function getShellUser(user) {
  const displayName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || user?.name || "User";
  const userHandle = `@${String(user?.email || displayName)
    .split("@")[0]
    .replace(/[^a-zA-Z0-9_]/g, "")
    .toLowerCase() || "agrolink"}`;
  const verifiedXp = Number(user?.verifiedXp ?? user?.xp ?? user?.experiencePoints ?? 0);
  const verifiedLevel = Number(user?.level ?? Math.floor(Math.max(0, verifiedXp) / 1000) + 1);
  const nextLevelXp = Math.max(1000, verifiedLevel * 1000);
  const levelStartXp = Math.max(0, (verifiedLevel - 1) * 1000);
  const xpIntoLevel = Math.max(0, verifiedXp - levelStartXp);
  const xpNeededForLevel = Math.max(1, nextLevelXp - levelStartXp);
  const xpProgress = Math.min(100, Math.max(0, (xpIntoLevel / xpNeededForLevel) * 100));
  const avatarSource = user?.profileImageUrl || user?.imageUrl || "";

  return {
    displayName,
    userHandle,
    verifiedXp,
    verifiedLevel,
    nextLevelXp,
    xpProgress,
    hasVerifiedBadge: verifiedXp >= 100,
    avatarSrc: avatarSource ? toMediaUrl(avatarSource) : "",
    avatarInitial: user?.firstName?.[0] || user?.name?.[0] || "U"
  };
}

export function NavIcon({ name }) {
  const paths = {
    home: "M3 10.5L12 3l9 7.5v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
    profile: "M12 12a4.2 4.2 0 1 0-4.2-4.2A4.2 4.2 0 0 0 12 12zm0 2.2c-4.34 0-7.8 2.27-7.8 5.08 0 .4.32.72.72.72h14.16a.72.72 0 0 0 .72-.72c0-2.81-3.46-5.08-7.8-5.08z",
    friends: "M8.2 11a3.4 3.4 0 1 0-3.4-3.4A3.4 3.4 0 0 0 8.2 11zm7.6 0a3.4 3.4 0 1 0-3.4-3.4 3.4 3.4 0 0 0 3.4 3.4zM8.2 13.4c-3.18 0-5.7 1.64-5.7 3.67 0 .4.32.73.72.73h9.96a.72.72 0 0 0 .72-.73c0-2.03-2.52-3.67-5.7-3.67zm7.6.2c-.77 0-1.5.1-2.18.29 1.22.8 1.98 1.86 1.98 3.02h4.56a.72.72 0 0 0 .72-.73c0-1.44-2.12-2.58-5.08-2.58z",
    chat: "M5 4h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4.5 3.2a.8.8 0 0 1-1.26-.65V6a2 2 0 0 1 2-2z",
    notifications: "M12 22a2.6 2.6 0 0 0 2.5-2h-5A2.6 2.6 0 0 0 12 22zM18 16v-5a6 6 0 1 0-12 0v5l-1.5 2h15z",
    marketplace: "M4 7h16l-1.1 12.1a1 1 0 0 1-1 .9H6.1a1 1 0 0 1-1-.9zM7.5 7l1.1-2.4A2.8 2.8 0 0 1 11.2 3h1.6a2.8 2.8 0 0 1 2.6 1.6L16.5 7",
    orders: "M5 5h14v4H5zM5 11h14v8H5zM8 13.5h3.8M8 16.5h6.5",
    calendar: "M7 3v2.4M17 3v2.4M4.6 7h14.8a1.2 1.2 0 0 1 1.2 1.2v10.2a1.2 1.2 0 0 1-1.2 1.2H4.6a1.2 1.2 0 0 1-1.2-1.2V8.2A1.2 1.2 0 0 1 4.6 7zm3.2 4h2.8v2.4H7.8zm5.6 0h2.8v2.4h-2.8z",
    bookmark: "M7 3h10a1 1 0 0 1 1 1v17l-6-4-6 4V4a1 1 0 0 1 1-1z",
    analytics: "M4 20V9M9 20V5M14 20v-7M19 20v-3",
    support: "M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-6l-4.5 3.2A.8.8 0 0 1 7.2 19v-2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm4 5a3 3 0 0 1 6 0c0 2.2-3 2.2-3 4M12 17h.1",
    settings: "M12 8.4a3.6 3.6 0 1 0 0 7.2 3.6 3.6 0 0 0 0-7.2zM12 3v2.2M12 18.8V21M4.2 6.2l1.6 1.6M18.2 17.8l1.6 1.6M3 12h2.2M18.8 12H21M4.2 17.8l1.6-1.6M18.2 7.8l1.6-1.6",
    business: "M4 20V7.8a1 1 0 0 1 1-1h5.6V4.7a.9.9 0 0 1 .9-.9h.9a.9.9 0 0 1 .9.9v2.1H19a1 1 0 0 1 1 1V20M8 20v-5.2h8V20",
    admin: "M12 3l7.2 4v5.6c0 4.2-3 7.2-7.2 8.4-4.2-1.2-7.2-4.2-7.2-8.4V7zM9 11.4l2 2 4-4"
  };

  return (
    <svg className="shell-nav-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name] || paths.home} />
    </svg>
  );
}

export function ShellActionIcon({ type, className = "" }) {
  const classNames = `shell-inline-icon ${className}`.trim();
  const icons = {
    sparkle: <path d="M12 3.5 13.8 8l4.7 1.3-4.7 1.3L12 15l-1.8-4.4-4.7-1.3L10.2 8z" />,
    check: <path d="m5 12 4 4 10-10" />,
    chevron: <path d="m9 6 6 6-6 6" />,
    sidebarToggle: (
      <>
        <path d="m14.5 6-5 6 5 6" />
        <path d="m19 6-5 6 5 6" />
      </>
    ),
    more: <path d="M6 12h.1M12 12h.1M18 12h.1" />,
    logout: <path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 16l4-4-4-4M20 12H10" />,
    settings: (
      <>
        <circle cx="12" cy="12" r="2.8" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4" />
      </>
    )
  };

  return (
    <svg className={classNames} viewBox="0 0 24 24" aria-hidden="true">
      {icons[type] || icons.settings}
    </svg>
  );
}

export function ShellNavLink({ to, label, icon }) {
  const location = useLocation();
  const active = to === "/admin"
    ? location.pathname === "/admin"
    : location.pathname === to || location.pathname.startsWith(`${to}/`);
  const startNavigationMotion = () => {
    if (active || typeof document === "undefined") return;
    document.body.classList.add("route-is-changing");
    window.setTimeout(() => document.body.classList.remove("route-is-changing"), 520);
  };

  return (
    <Link className={`shell-nav-link ${active ? "active" : ""}`} to={to} title={label} onClick={startNavigationMotion}>
      <span className="shell-nav-icon-wrap" aria-hidden="true">
        <NavIcon name={icon} />
      </span>
      <span className="shell-nav-label">{label}</span>
    </Link>
  );
}
