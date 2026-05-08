const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:4041").replace(/\/+$/, "");

export function toMediaUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/")) return `${apiBaseUrl}${path}`;
  return `${apiBaseUrl}/${path}`;
}
