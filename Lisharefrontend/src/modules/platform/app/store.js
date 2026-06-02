import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import axiosInstance from "/src/modules/platform/api/axiosInstance";
import { ENDPOINTS } from "/src/modules/platform/api/endpoints";

const AuthContext = createContext(null);
const AUTH_SESSION_KEY = "lishare-auth-session";
const PUBLIC_AUTH_PATHS = new Set(["/", "/login", "/signup", "/verify", "/forgot-password"]);

function hasKnownSession() {
  try {
    return window.localStorage.getItem(AUTH_SESSION_KEY) === "true";
  } catch {
    return false;
  }
}

function rememberSession(active) {
  try {
    if (active) {
      window.localStorage.setItem(AUTH_SESSION_KEY, "true");
    } else {
      window.localStorage.removeItem(AUTH_SESSION_KEY);
    }
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}

function normalizeUser(payload) {
  if (!payload || typeof payload !== "object") return null;

  const source =
    Object.prototype.hasOwnProperty.call(payload, "success") && Object.prototype.hasOwnProperty.call(payload, "data")
      ? payload.data
      : payload;

  if (!source || typeof source !== "object") return null;

  const firstName = source.firstName ?? source.firstname ?? source.name ?? "";
  const lastName = source.lastName ?? source.lastname ?? "";
  const userId = source.userId ?? source.id ?? null;
  const profileImageUrl = source.profileImageUrl ?? source.imageUrl ?? null;

  return {
    ...source,
    userId,
    id: source.id ?? userId,
    firstName,
    lastName,
    name: source.name ?? firstName,
    profileImageUrl,
    imageUrl: source.imageUrl ?? profileImageUrl
  };
}

export function AuthProvider({ children }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const setNormalizedUser = useCallback((payload) => {
    setUser(normalizeUser(payload));
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(ENDPOINTS.user.me);
      setNormalizedUser(data);
      rememberSession(true);
    } catch {
      setNormalizedUser(null);
      rememberSession(false);
    } finally {
      setLoading(false);
    }
  }, [setNormalizedUser]);

  useEffect(() => {
    if (PUBLIC_AUTH_PATHS.has(location.pathname) && !hasKnownSession()) {
      setNormalizedUser(null);
      setLoading(false);
      return;
    }

    fetchCurrentUser();
  }, [fetchCurrentUser, location.pathname, setNormalizedUser]);

  const logout = useCallback(async () => {
    try {
      await axiosInstance.post(ENDPOINTS.auth.logout);
    } finally {
      setNormalizedUser(null);
      rememberSession(false);
    }
  }, [setNormalizedUser]);

  const value = useMemo(
    () => ({
      user,
      role: user?.role || null,
      loading,
      setUser: setNormalizedUser,
      refreshUser: fetchCurrentUser,
      logout
    }),
    [user, loading, fetchCurrentUser, logout, setNormalizedUser]
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
