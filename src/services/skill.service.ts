import { get, post, put, del } from './api';
import type { ApiResponse } from '../types';

export type SkillLevel = 'not_trained' | 'in_training' | 'trained' | 'expert';

export interface Skill {
  id: number;
  name: string;
  code?: string;
  description?: string;
  departmentId?: number;
  category?: string;
  isActive: boolean;
  department?: { id: number; name: string; code: string };
}

export interface SkillEmployee {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
  departmentAssignments?: {
    id: number;
    departmentId: number;
    role: string;
    department?: { id: number; name: string; code: string };
  }[];
}

export interface SkillMatrixEntry {
  id: number;
  userId: number;
  skillId: number;
  level: SkillLevel;
  certifiedDate?: string;
  expiresAt?: string;
  notes?: string;
}

export interface SkillMatrix {
  skills: Skill[];
  employees: SkillEmployee[];
  matrix: SkillMatrixEntry[];
}

export async function getSkills(params?: { departmentId?: number; category?: string }): Promise<Skill[]> {
  const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
  const res = await get<ApiResponse<Skill[]>>(`/skills${qs}`);
  return res.data;
}

export async function createSkill(data: Partial<Skill>): Promise<Skill> {
  const res = await post<ApiResponse<Skill>>('/skills', data);
  return res.data;
}

export async function updateSkill(id: number, data: Partial<Skill>): Promise<Skill> {
  const res = await put<ApiResponse<Skill>>(`/skills/${id}`, data);
  return res.data;
}

export async function deleteSkill(id: number): Promise<void> {
  await del<ApiResponse<null>>(`/skills/${id}`);
}

export async function getMatrix(departmentId?: number): Promise<SkillMatrix> {
  const qs = departmentId ? `?departmentId=${departmentId}` : '';
  const res = await get<ApiResponse<SkillMatrix>>(`/skills/matrix${qs}`);
  return res.data;
}

export async function updateCell(userId: number, skillId: number, data: { level: SkillLevel; notes?: string }): Promise<SkillMatrixEntry> {
  const res = await put<ApiResponse<SkillMatrixEntry>>(`/skills/matrix/${userId}/${skillId}`, data);
  return res.data;
}

export async function updateMatrix(entries: { userId: number; skillId: number; level: SkillLevel; notes?: string }[]): Promise<void> {
  await put<ApiResponse<SkillMatrixEntry[]>>('/skills/matrix', { entries });
}
