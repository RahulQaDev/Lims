import { useAuthStore } from '../stores/authStore';
import { useRoleStore } from '../stores/roleStore';
import type { PermissionType } from '../types';

/**
 * RBAC permission hook.
 * Uses server-provided permissions (from login) as primary source,
 * falls back to roleStore lookup.
 */
export function usePermission() {
  const user = useAuthStore((s) => s.user);
  const serverPermissions = useAuthStore((s) => s.serverPermissions);
  const roles = useRoleStore((s) => s.roles);

  const userRole = user?.role ?? '';

  // Prefer server-provided permissions, fallback to roleStore
  const roleDef = roles.find((r) => r.id === userRole);
  const permissions = serverPermissions ?? roleDef?.permissions ?? {};

  /** Does the user have at least one permission on a given sub-module key? */
  const hasAccess = (moduleKey: string): boolean => {
    if (userRole === 'admin') return true;
    const perms = permissions[moduleKey];
    return !!perms && perms.length > 0;
  };

  /** Does the user have a specific permission type on a sub-module key? */
  const hasPermission = (moduleKey: string, type: PermissionType): boolean => {
    if (userRole === 'admin') return true;
    return permissions[moduleKey]?.includes(type) ?? false;
  };

  /** Can view */
  const canView = (moduleKey: string) => hasPermission(moduleKey, 'view');
  /** Can edit */
  const canEdit = (moduleKey: string) => hasPermission(moduleKey, 'edit');
  /** Can approve */
  const canApprove = (moduleKey: string) => hasPermission(moduleKey, 'approve');

  return { hasAccess, hasPermission, canView, canEdit, canApprove, permissions, userRole };
}
