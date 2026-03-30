import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Users, LayoutGrid, Eye, Edit3, CheckCircle2 } from 'lucide-react';
import { useRoleStore } from '../../stores/roleStore';
import Button from '../../components/ui/Button';
import SearchInput from '../../components/ui/SearchInput';
import Modal from '../../components/ui/Modal';
import type { RoleDefinition, PermissionType } from '../../types';

const PERM_COLORS: Record<PermissionType, { dot: string; bg: string; text: string }> = {
  view: { dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700' },
  edit: { dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
  approve: { dot: 'bg-green-500', bg: 'bg-green-50', text: 'text-green-700' },
};

const PERM_ICONS: Record<PermissionType, typeof Eye> = {
  view: Eye,
  edit: Edit3,
  approve: CheckCircle2,
};

export default function RolesPage() {
  const navigate = useNavigate();
  const { roles, modules, permissionTypes, deleteRole } = useRoleStore();
  const [search, setSearch] = useState('');
  const [viewRole, setViewRole] = useState<RoleDefinition | null>(null);

  const moduleRows = useMemo(() => {
    const rows: { key: string; label: string; isParent: boolean; isSub: boolean }[] = [];
    for (const mod of modules) {
      if (mod.subModules && mod.subModules.length > 0) {
        rows.push({ key: mod.key, label: mod.label, isParent: true, isSub: false });
        for (const sub of mod.subModules) {
          rows.push({ key: sub.key, label: sub.label, isParent: false, isSub: true });
        }
      } else {
        rows.push({ key: mod.key, label: mod.label, isParent: false, isSub: false });
      }
    }
    return rows;
  }, [modules]);

  const filteredRoles = useMemo(() => {
    if (!search.trim()) return roles;
    const q = search.toLowerCase();
    return roles.filter(
      (r) => r.label.toLowerCase().includes(q) || r.id.includes(q) || r.description.toLowerCase().includes(q),
    );
  }, [roles, search]);

  const getPermSummary = (role: RoleDefinition) => {
    const parentKeys = new Set(modules.filter((m) => m.subModules?.length).map((m) => m.key));
    return Object.entries(role.permissions)
      .filter(([k, p]) => !parentKeys.has(k) && p.length > 0)
      .map(([key, perms]) => ({ module: moduleRows.find((m) => m.key === key)?.label || key, perms }));
  };

  const getTotalModules = (role: RoleDefinition) => {
    const parentKeys = new Set(modules.filter((m) => m.subModules?.length).map((m) => m.key));
    return Object.entries(role.permissions).filter(([k, p]) => !parentKeys.has(k) && p.length > 0).length;
  };

  const handleDelete = (id: string) => {
    if (roles.find((r) => r.id === id)?.isSystem) return;
    deleteRole(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Role Management</h1>
          <p className="text-sm text-gray-500 mt-1">{roles.length} roles configured</p>
        </div>
        <div className="flex items-center gap-3">
          <SearchInput onSearch={setSearch} placeholder="Search roles..." className="w-56" />
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => navigate('/settings/roles/create')}>
            Create Role
          </Button>
        </div>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredRoles.map((role) => {
          const summary = getPermSummary(role);
          const totalMods = getTotalModules(role);
          return (
            <div
              key={role.id}
              onClick={() => setViewRole(role)}
              className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col hover:shadow-md hover:border-gray-300 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{role.label}</h3>
                    {role.isSystem && (
                      <span className="shrink-0 text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">
                        System
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-gray-400">{role.id}</span>
                </div>
                {!role.isSystem && (
                  <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => navigate(`/settings/roles/edit/${role.id}`)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(role.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-500 line-clamp-2 mb-3">{role.description}</p>

              <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" /> 0 users
                </span>
                <span className="flex items-center gap-1.5">
                  <LayoutGrid className="h-3.5 w-3.5" /> {totalMods} modules
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {summary.slice(0, 4).map(({ module, perms }) => (
                  <div key={module} className="flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1">
                    <span className="text-[11px] text-gray-600 font-medium truncate max-w-[80px]">{module}</span>
                    <div className="flex gap-0.5">
                      {perms.map((p) => (
                        <span key={p} className={`w-1.5 h-1.5 rounded-full ${PERM_COLORS[p].dot}`} title={p} />
                      ))}
                    </div>
                  </div>
                ))}
                {summary.length > 4 && (
                  <span className="text-[11px] text-gray-400 px-2 py-1">+{summary.length - 4} more</span>
                )}
              </div>

              <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">
                  Updated{' '}
                  {new Date(role.updatedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                <span className="text-[11px] text-blue-600 font-medium">View Details →</span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredRoles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-gray-500">{search ? 'No roles match your search.' : 'No roles configured.'}</p>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-5 text-xs text-gray-500">
        {permissionTypes.map((pt) => {
          const Icon = PERM_ICONS[pt];
          return (
            <span key={pt} className="flex items-center gap-1.5">
              <Icon className="h-3.5 w-3.5" />
              <span className={`w-2 h-2 rounded-full ${PERM_COLORS[pt].dot}`} />
              {pt.charAt(0).toUpperCase() + pt.slice(1)}
            </span>
          );
        })}
      </div>

      {/* View Details Modal */}
      <Modal isOpen={!!viewRole} onClose={() => setViewRole(null)} title={viewRole?.label || ''} size="xl" footer={
        <>
          <Button variant="outline" onClick={() => setViewRole(null)}>Close</Button>
          {viewRole && !viewRole.isSystem && (
            <Button onClick={() => { setViewRole(null); navigate(`/settings/roles/edit/${viewRole.id}`); }}>
              Edit Role
            </Button>
          )}
        </>
      }>
        {viewRole && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">{viewRole.description}</p>
              <p className="text-xs text-gray-400 mt-1">
                Updated: {new Date(viewRole.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Module</th>
                    {permissionTypes.map((pt) => (
                      <th key={pt} className="px-3 py-2.5 text-center text-xs font-medium text-gray-500 uppercase w-20">
                        {pt}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {moduleRows.map((mod) => (
                    <tr key={mod.key} className={`border-t border-gray-100 ${mod.isParent ? 'bg-gray-50/50' : ''}`}>
                      <td className={`px-4 py-2 text-sm ${mod.isSub ? 'pl-8 text-gray-500' : 'font-medium text-gray-900'}`}>
                        {mod.label}
                      </td>
                      {permissionTypes.map((pt) => (
                        <td key={pt} className="px-3 py-2 text-center">
                          {mod.isParent ? (
                            <span className="text-gray-300">—</span>
                          ) : viewRole.permissions[mod.key]?.includes(pt) ? (
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${PERM_COLORS[pt].bg}`}>
                              <CheckCircle2 className={`h-3.5 w-3.5 ${PERM_COLORS[pt].text}`} />
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
