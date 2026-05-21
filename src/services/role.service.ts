import { get, post, put, del } from './api';
import type { ApiResponse, RoleDefinition } from '../types';

export async function fetchRoles(): Promise<RoleDefinition[]> {
  const res = await get<ApiResponse<RoleDefinition[]>>('/roles');
  return res.data;
}

export async function fetchRole(id: string): Promise<RoleDefinition> {
  const res = await get<ApiResponse<RoleDefinition>>(`/roles/${id}`);
  return res.data;
}

export async function createRole(
  data: Omit<RoleDefinition, 'createdAt' | 'updatedAt' | 'userCount' | 'isActive'>,
): Promise<RoleDefinition> {
  const res = await post<ApiResponse<RoleDefinition>>('/roles', data);
  return res.data;
}

export async function updateRole(
  id: string,
  data: Partial<RoleDefinition>,
): Promise<RoleDefinition> {
  const res = await put<ApiResponse<RoleDefinition>>(`/roles/${id}`, data);
  return res.data;
}

export async function deleteRole(id: string): Promise<void> {
  await del<ApiResponse<null>>(`/roles/${id}`);
}

export async function savePermissionMatrix(
  roles: { id: string; permissions: Record<string, string[]> }[],
): Promise<void> {
  await put<ApiResponse<null>>('/roles/matrix', { roles });
}
