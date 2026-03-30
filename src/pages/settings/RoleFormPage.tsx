import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, AlertTriangle, Info } from 'lucide-react';
import { useRoleStore } from '../../stores/roleStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import type { PermissionType } from '../../types';

const PERM_CONFIG: Record<PermissionType, { bg: string; text: string; dot: string; activeBg: string; label: string; desc: string }> = {
  view: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', activeBg: 'bg-blue-500', label: 'View', desc: 'Can see all information but cannot edit' },
  edit: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', activeBg: 'bg-amber-500', label: 'Edit', desc: 'Can make entries and save changes' },
  approve: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500', activeBg: 'bg-green-500', label: 'Approve', desc: 'Read-only + approve or reject decisions' },
};

export default function RoleFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { roles, modules, permissionTypes, addRole, updateRole } = useRoleStore();
  const isEdit = !!id;
  const existingRole = isEdit ? roles.find((r) => r.id === id) : null;

  const [roleName, setRoleName] = useState('');
  const [reason, setReason] = useState('');
  const [selectedParents, setSelectedParents] = useState<Set<string>>(new Set());
  const [selectedSubs, setSelectedSubs] = useState<Set<string>>(new Set());
  const [permissions, setPermissions] = useState<Record<string, PermissionType[]>>({});

  useEffect(() => {
    if (!existingRole) return;
    setRoleName(existingRole.label);
    setReason(existingRole.description);
    const parents = new Set<string>();
    const subs = new Set<string>();
    for (const mod of modules) {
      if (mod.subModules && mod.subModules.length > 0) {
        const hasAnySub = mod.subModules.some((s) => (existingRole.permissions[s.key] || []).length > 0);
        if (hasAnySub) {
          parents.add(mod.key);
          for (const sub of mod.subModules) {
            if ((existingRole.permissions[sub.key] || []).length > 0) subs.add(sub.key);
          }
        }
      } else {
        if ((existingRole.permissions[mod.key] || []).length > 0) parents.add(mod.key);
      }
    }
    setSelectedParents(parents);
    setSelectedSubs(subs);
    setPermissions({ ...existingRole.permissions });
  }, [existingRole, modules]);

  const permissionTargets = useMemo(() => {
    const targets: { key: string; label: string; parentLabel?: string }[] = [];
    for (const mod of modules) {
      if (mod.subModules && mod.subModules.length > 0) {
        if (selectedParents.has(mod.key)) {
          for (const sub of mod.subModules) {
            if (selectedSubs.has(sub.key)) {
              targets.push({ key: sub.key, label: sub.label, parentLabel: mod.label });
            }
          }
        }
      } else {
        if (selectedParents.has(mod.key)) {
          targets.push({ key: mod.key, label: mod.label });
        }
      }
    }
    return targets;
  }, [modules, selectedParents, selectedSubs]);

  const toggleParent = (key: string) => {
    setSelectedParents((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        const mod = modules.find((m) => m.key === key);
        if (mod?.subModules) {
          for (const sub of mod.subModules) {
            setSelectedSubs((s) => { const n = new Set(s); n.delete(sub.key); return n; });
            setPermissions((p) => { const n = { ...p }; delete n[sub.key]; return n; });
          }
        }
        setPermissions((p) => { const n = { ...p }; delete n[key]; return n; });
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleSub = (subKey: string) => {
    setSelectedSubs((prev) => {
      const next = new Set(prev);
      if (next.has(subKey)) {
        next.delete(subKey);
        setPermissions((p) => { const n = { ...p }; delete n[subKey]; return n; });
      } else {
        next.add(subKey);
      }
      return next;
    });
  };

  const togglePerm = (moduleKey: string, perm: PermissionType) => {
    setPermissions((prev) => {
      const existing = prev[moduleKey] || [];
      const next = existing.includes(perm) ? existing.filter((p) => p !== perm) : [...existing, perm];
      return { ...prev, [moduleKey]: next };
    });
  };

  const canSubmit = roleName.trim() !== '' && reason.trim() !== '' && permissionTargets.length > 0 && permissionTargets.every((t) => (permissions[t.key] || []).length > 0);

  const handleSubmit = () => {
    if (!canSubmit) return;
    const now = new Date().toISOString();
    if (isEdit && existingRole) {
      updateRole(existingRole.id, { label: roleName, description: reason, permissions });
    } else {
      addRole({
        id: roleName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
        label: roleName,
        description: reason,
        permissions,
        createdAt: now,
        updatedAt: now,
      });
    }
    navigate('/settings/roles');
  };

  const validationHint = !roleName.trim() ? 'Enter role name' : !reason.trim() ? 'Enter reason' : permissionTargets.length === 0 ? 'Select modules' : 'Set all permissions';

  return (
    <div className="min-h-[calc(100vh-130px)] flex flex-col">
      {/* Top bar */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/settings/roles')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Roles
        </button>
        <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit Role' : 'Create New Role'}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isEdit ? 'Modify role details, module access, and permissions.' : 'Define a new role by filling in the details below.'}
        </p>
      </div>

      {/* Form sections */}
      <div className="flex-1 space-y-6 pb-24">
        {/* ── Section 1: Basic Info ── */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-5 py-3 flex items-center gap-3 border-b border-gray-100">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">1</span>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Basic Information</h3>
              <p className="text-xs text-gray-500">Role name and purpose</p>
            </div>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Input
                label="Role Name *"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="e.g., Inside Sales, Account Manager"
              />
              {roleName.trim() && (
                <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Auto-generated ID: <span className="font-mono text-gray-500">{roleName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}</span>
                </p>
              )}
            </div>
            <Input
              label="Reason to Create *"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this role needed? What will users do?"
            />
          </div>
        </section>

        {/* ── Section 2: Module Access ── */}
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-5 py-3 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">2</span>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Module Access</h3>
                <p className="text-xs text-gray-500">Select which modules this role can access</p>
              </div>
            </div>
            <span className="text-xs text-gray-400">{selectedParents.size} of {modules.length} selected</span>
          </div>
          <div className="p-5 space-y-3">
            {modules.map((mod) => {
              const isSelected = selectedParents.has(mod.key);
              const hasSubs = mod.subModules && mod.subModules.length > 0;
              return (
                <div key={mod.key} className={`rounded-lg border-2 transition-all ${isSelected ? 'border-blue-500 bg-blue-50/30' : 'border-gray-200'}`}>
                  <button
                    type="button"
                    onClick={() => toggleParent(mod.key)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'}`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                      <div>
                        <span className={`text-sm font-semibold ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>{mod.label}</span>
                        {hasSubs && <span className="text-[11px] text-gray-400 ml-2">({mod.subModules!.length} sub-modules)</span>}
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-gray-400">{mod.key}</span>
                  </button>
                  {isSelected && hasSubs && (
                    <div className="px-4 pb-3">
                      <div className="ml-8 flex flex-wrap gap-2">
                        {mod.subModules!.map((sub) => {
                          const subSel = selectedSubs.has(sub.key);
                          return (
                            <button
                              key={sub.key}
                              type="button"
                              onClick={() => toggleSub(sub.key)}
                              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                                subSel ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                              }`}
                            >
                              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${subSel ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'}`}>
                                {subSel && <Check className="w-2 h-2" />}
                              </div>
                              {sub.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Section 3: Permissions ── */}
        {permissionTargets.length > 0 && (
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-5 py-3 flex items-center gap-3 border-b border-gray-100">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">3</span>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Set Permissions</h3>
                <p className="text-xs text-gray-500">Define what each module can do</p>
              </div>
            </div>

            {/* Legend */}
            <div className="px-5 pt-4 pb-2 flex flex-wrap gap-3">
              {permissionTypes.map((pt) => (
                <div key={pt} className={`flex items-center gap-2 rounded-lg px-3 py-2 ${PERM_CONFIG[pt].bg}`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${PERM_CONFIG[pt].dot}`} />
                  <span className={`text-xs font-semibold ${PERM_CONFIG[pt].text}`}>{PERM_CONFIG[pt].label}</span>
                  <span className="text-[10px] text-gray-500 ml-1">{PERM_CONFIG[pt].desc}</span>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="px-5 pb-5">
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module</th>
                      {permissionTypes.map((pt) => (
                        <th key={pt} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                          <span className="flex items-center justify-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${PERM_CONFIG[pt].dot}`} />
                            {PERM_CONFIG[pt].label}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {permissionTargets.map((target) => (
                      <tr key={target.key} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          {target.parentLabel && <span className="text-[10px] uppercase tracking-wider text-gray-400 block mb-0.5">{target.parentLabel}</span>}
                          <span className="text-sm font-medium text-gray-900">{target.label}</span>
                        </td>
                        {permissionTypes.map((pt) => {
                          const isActive = (permissions[target.key] || []).includes(pt);
                          return (
                            <td key={pt} className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => togglePerm(target.key, pt)}
                                className={`w-8 h-8 rounded-lg border-2 inline-flex items-center justify-center transition-all ${
                                  isActive ? `${PERM_CONFIG[pt].activeBg} border-transparent text-white shadow-sm` : 'border-gray-300 hover:border-gray-400'
                                }`}
                              >
                                {isActive && <Check className="w-4 h-4" />}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {permissionTargets.some((t) => (permissions[t.key] || []).length === 0) && (
                <p className="text-xs text-amber-600 mt-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Each module must have at least one permission selected
                </p>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-6 py-3 shadow-lg">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/settings/roles')}>Cancel</Button>
          <div className="flex items-center gap-4">
            {!canSubmit && <span className="text-xs text-gray-400 hidden sm:block">{validationHint}</span>}
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              {isEdit ? 'Update Role' : 'Create Role'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
