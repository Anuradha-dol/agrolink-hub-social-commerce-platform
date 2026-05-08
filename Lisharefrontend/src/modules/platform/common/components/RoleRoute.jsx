import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "/src/modules/platform/app/store";

export default function RoleRoute({ allowedRoles }) {
  const { role } = useAuth();
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/home" replace />;
  }
  return <Outlet />;
}
