import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RoleDefinition, ModuleDefinition, PermissionType } from '../types';
import { DEFAULT_MODULES } from '../config/modules';
import { DEFAULT_ROLES } from '../config/defaultRoles';

interface RoleStore {
  roles: RoleDefinition[];
  modules: ModuleDefinition[];
  permissionTypes: PermissionType[];

  // Role actions
  setRoles: (roles: RoleDefinition[]) => void;
  addRole: (role: RoleDefinition) => void;
  updateRole: (id: string, updates: Partial<RoleDefinition>) => void;
  deleteRole: (id: string) => void;

  // Module actions
  setModules: (modules: ModuleDefinition[]) => void;
  addModule: (mod: ModuleDefinition) => void;
  deleteModule: (key: string) => void;
  addSubModule: (parentKey: string, sub: { key: string; label: string }) => void;
  deleteSubModule: (parentKey: string, subKey: string) => void;
}

export const useRoleStore = create<RoleStore>()(
  persist(
    (set) => ({
      roles: DEFAULT_ROLES,
      modules: DEFAULT_MODULES,
      permissionTypes: ['view', 'edit', 'approve'] as PermissionType[],

      setRoles: (roles) => set({ roles }),
      addRole: (role) => set((s) => ({ roles: [...s.roles, role] })),
      updateRole: (id, updates) =>
        set((s) => ({
          roles: s.roles.map((r) =>
            r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r,
          ),
        })),
      deleteRole: (id) => set((s) => ({ roles: s.roles.filter((r) => r.id !== id) })),

      setModules: (modules) => set({ modules }),
      addModule: (mod) => set((s) => ({ modules: [...s.modules, mod] })),
      deleteModule: (key) =>
        set((s) => ({ modules: s.modules.filter((m) => m.key !== key) })),
      addSubModule: (parentKey, sub) =>
        set((s) => ({
          modules: s.modules.map((m) =>
            m.key === parentKey
              ? { ...m, subModules: [...(m.subModules || []), sub] }
              : m,
          ),
        })),
      deleteSubModule: (parentKey, subKey) =>
        set((s) => ({
          modules: s.modules.map((m) =>
            m.key === parentKey
              ? { ...m, subModules: (m.subModules || []).filter((sub) => sub.key !== subKey) }
              : m,
          ),
        })),
    }),
    { name: 'labwise-rbac' },
  ),
);
