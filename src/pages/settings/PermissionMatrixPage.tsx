import { useState, useMemo } from 'react';
import { Check, Save, Eye, Edit3, CheckCircle2 } from 'lucide-react';
import { useRoleStore } from '../../stores/roleStore';
import Button from '../../components/ui/Button';
import type { PermissionType } from '../../types';

const PERM_CONFIG: Record<PermissionType, { dot: string; activeBg: string; label: string }> = {
  view: { dot: 'bg-blue-500', activeBg: 'bg-blue-500', label: 'View' },
  edit: { dot: 'bg-amber-500', activeBg: 'bg-amber-500', label: 'Edit' },
  approve: { dot: 'bg-green-500', activeBg: 'bg-green-500', label: 'Approve' },
};

const PERM_ICONS: Record<PermissionType, typeof Eye> = { view: Eye, edit: Edit3, approve: CheckCircle2 };

export default function PermissionMatrixPage() {
  const { roles, modules, permissionTypes, setRoles } = useRoleStore();
  const [localRoles, setLocalRoles] = useState(roles);
  const [dirty, setDirty] = useState(false);

  const moduleRows = useMemo(() => {
    const rows: { key: string; label: string; isParent: boolean; isSub: boolean }[] = [];
    for (const mod of modules) {
      if (mod.subModules && mod.subModules.length > 0) {
        rows.push({ key: mod.key, label: mod.label, isParent: true, isSub: false });
        for (const sub of mod.subModules) rows.push({ key: sub.key, label: sub.label, isParent: false, isSub: true });
      } else {
        rows.push({ key: mod.key, label: mod.label, isParent: false, isSub: false });
      }
    }
    return rows;
  }, [modules]);

  const togglePerm = (roleId: string, modKey: string, perm: PermissionType) => {
    setLocalRoles((prev) =>
      prev.map((r) => {
        if (r.id !== roleId || r.isSystem) return r;
        const existing = r.permissions[modKey] || [];
        const next = existing.includes(perm) ? existing.filter((p) => p !== perm) : [...existing, perm];
        return { ...r, permissions: { ...r.permissions, [modKey]: next } };
      }),
    );
    setDirty(true);
  };

  const handleSave = () => {
    setRoles(localRoles.map((r) => ({ ...r, updatedAt: new Date().toISOString() })));
    setDirty(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Permission Matrix</h1>
          <p className="text-sm text-gray-500 mt-1">
            {localRoles.length} roles × {moduleRows.filter((m) => !m.isParent).length} modules
          </p>
        </div>
        <div className="flex items-center gap-3">
          {dirty && <span className="text-xs text-amber-600">Unsaved changes</span>}
          <Button icon={<Save className="h-4 w-4" />} onClick={handleSave} disabled={!dirty}>
            Save Changes
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 text-xs text-gray-500">
        {permissionTypes.map((pt) => {
          const Icon = PERM_ICONS[pt];
          return (
            <span key={pt} className="flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5" />
              <span className={`w-2 h-2 rounded-full ${PERM_CONFIG[pt].dot}`} />
              {PERM_CONFIG[pt].label}
            </span>
          );
        })}
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gray-300" /> No access
        </span>
      </div>

      {/* Matrix Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-auto">
        <table className="w-full min-w-[800px]">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="sticky left-0 z-20 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[200px]">
                Module
              </th>
              {localRoles.map((role) => (
                <th key={role.id} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase min-w-[100px]">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="truncate max-w-[90px]">{role.label}</span>
                    {role.isSystem && <span className="text-[9px] text-purple-500 font-normal">(system)</span>}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {moduleRows.map((mod) => (
              <tr key={mod.key} className={`border-t border-gray-100 ${mod.isParent ? 'bg-gray-50/80' : ''}`}>
                <td className={`sticky left-0 z-10 bg-white px-4 py-2 text-sm ${mod.isParent ? 'bg-gray-50/80 font-semibold text-gray-900' : mod.isSub ? 'pl-8 text-gray-600' : 'font-medium text-gray-900'}`}>
                  {mod.label}
                </td>
                {localRoles.map((role) => (
                  <td key={role.id} className="px-2 py-2 text-center">
                    {mod.isParent ? (
                      <span className="text-gray-200">—</span>
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        {permissionTypes.map((pt) => {
                          const isActive = (role.permissions[mod.key] || []).includes(pt);
                          return (
                            <button
                              key={pt}
                              onClick={() => togglePerm(role.id, mod.key, pt)}
                              disabled={role.isSystem}
                              title={`${pt} – ${role.label}`}
                              className={`w-6 h-6 rounded border inline-flex items-center justify-center transition-all ${
                                role.isSystem ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                              } ${
                                isActive
                                  ? `${PERM_CONFIG[pt].activeBg} border-transparent text-white`
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              {isActive && <Check className="w-3 h-3" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
