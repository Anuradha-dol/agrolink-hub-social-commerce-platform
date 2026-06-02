import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "/src/modules/platform/app/store";
import { userHasAnyRole } from "/src/modules/platform/common/components/shellNavigation";

export default function RoleRoute({ allowedRoles }) {
  const { user, role } = useAuth();
  if (!userHasAnyRole(user, role, allowedRoles)) {
    return <Navigate to="/home" replace />;
  }
  return <Outlet />;
}