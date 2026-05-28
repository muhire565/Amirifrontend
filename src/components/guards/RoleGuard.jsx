import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

export default function RoleGuard({ allowedRoles, children }) {
  const { hasRole, isAuthenticated } = useAuthStore();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRole(...allowedRoles)) {
    // If authenticated but no role permission, send to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children || <Outlet />;
}
