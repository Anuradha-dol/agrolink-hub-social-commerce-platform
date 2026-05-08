import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "/src/modules/platform/app/store";
import LoadingState from "./LoadingState";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingState text="Checking session..." />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  return <Outlet />;
}
