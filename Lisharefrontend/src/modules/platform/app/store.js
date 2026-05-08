import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from "react";
import axiosInstance from "/src/modules/platform/api/axiosInstance";
import { ENDPOINTS } from "/src/modules/platform/api/endpoints";

const AuthContext = createContext(null);

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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const setNormalizedUser = useCallback((payload) => {
    setUser(normalizeUser(payload));
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get(ENDPOINTS.user.me);
      setNormalizedUser(data);
    } catch {
      setNormalizedUser(null);
    } finally {
      setLoading(false);
    }
  }, [setNormalizedUser]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const logout = useCallback(async () => {
    try {
      await axiosInstance.post(ENDPOINTS.auth.logout);
    } finally {
      setNormalizedUser(null);
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
