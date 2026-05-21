import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission';

interface RoleGuardProps {
  /** The RBAC sub-module key required to view this route */
  permissionKey: string;
  children: ReactNode;
}

/**
 * Wraps a route element and redirects to /dashboard if the current user
 * does not have at least "view" access on the given permission key.
 */
export default function RoleGuard({ permissionKey, children }: RoleGuardProps) {
  const { hasAccess, userRole } = usePermission();

  // Admin always has access
  if (userRole === 'admin' || hasAccess(permissionKey)) {
    return <>{children}</>;
  }

  return <Navigate to="/dashboard" replace />;
}
