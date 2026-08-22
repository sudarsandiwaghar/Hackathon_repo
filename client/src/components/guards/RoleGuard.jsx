import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Wraps routes that require a specific role.
 * Must be used inside ProtectedRoute (auth already checked).
 *
 * Usage:
 *   <RoleGuard roles={['admin']}>
 *     <AdminDashboard />
 *   </RoleGuard>
 */
const RoleGuard = ({ roles, children, fallback = '/dashboard' }) => {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default RoleGuard;
