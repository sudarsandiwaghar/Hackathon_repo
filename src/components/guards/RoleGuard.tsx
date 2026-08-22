import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';

interface RoleGuardProps {
  roles: ('admin' | 'employee')[];
  children: React.ReactNode;
  fallbackPath?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  roles,
  children,
  fallbackPath = '/dashboard',
}) => {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};
