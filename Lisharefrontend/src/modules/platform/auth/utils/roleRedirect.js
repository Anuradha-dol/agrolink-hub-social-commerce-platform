function normalizeRole(role) {
  const value = String(role || "").trim().toUpperCase();
  if (!value) return "";
  return value.startsWith("ROLE_") ? value : `ROLE_${value}`;
}

export function getRoleLandingPath(role) {
  switch (normalizeRole(role)) {
    case "ROLE_ADMIN":
      return "/admin";
    case "ROLE_BUSINESS":
    case "ROLE_FARMER":
      return "/business";
    case "ROLE_CREATOR":
    case "ROLE_USER":
    default:
      return "/home";
  }
}

export function getUserLandingPath(user) {
  return getRoleLandingPath(user?.role || user?.roles?.[0] || user?.authority);
}
