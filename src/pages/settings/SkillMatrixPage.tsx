import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  GraduationCap,
  Star,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Filter,
  Plus,
  Search,
  X,
} from 'lucide-react';
import * as skillService from '../../services/skill.service';
import type { SkillLevel } from '../../services/skill.service';
import { get } from '../../services/api';
import type { ApiResponse, Department } from '../../types';
import { usePermission } from '../../hooks/usePermission';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Loader from '../../components/ui/Loader';

const LEVEL_OPTIONS: { value: SkillLevel; label: string; icon: React.ReactNode }[] = [
  { value: 'expert', label: 'Expert', icon: <Star className="h-4 w-4 fill-amber-500 text-amber-500" /> },
  { value: 'trained', label: 'Trained', icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> },
  { value: 'in_training', label: 'In Training', icon: <Clock className="h-4 w-4 text-yellow-500" /> },
  { value: 'not_trained', label: 'Not Trained', icon: <XCircle className="h-4 w-4 text-red-300" /> },
];

function levelIcon(level: SkillLevel | undefined) {
  switch (level) {
    case 'expert': return <Star className="h-4 w-4 fill-amber-500 text-amber-500" />;
    case 'trained': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'in_training': return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'not_trained': return <XCircle className="h-4 w-4 text-red-300" />;
    default: return <span className="text-gray-300">-</span>;
  }
}

function Avatar({ name }: { name: string }) {
  const initials = name.trim().split(/\s+/).map((p) => p.charAt(0)).slice(0, 2).join('').toUpperCase() || '?';
  return (
    <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-semibold shrink-0">
      {initials}
    </div>
  );
}

export default function SkillMatrixPage() {
  const { canEdit } = usePermission();
  const editable = canEdit('skill-matrix');
  const queryClient = useQueryClient();

  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [editingCell, setEditingCell] = useState<{ userId: number; skillId: number; level: SkillLevel; userName: string; skillName: string } | null>(null);
  const [newSkillOpen, setNewSkillOpen] = useState(false);
  const [skillForm, setSkillForm] = useState({ name: '', category: '', description: '' });

  // Fetch departments for filter
  const { data: deptData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => get<ApiResponse<Department[]>>('/departments').then((r) => r.data),
  });

  // Fetch skill matrix
  const deptId = deptFilter === 'all' ? undefined : Number(deptFilter);
  const { data: matrix, isLoading } = useQuery({
    queryKey: ['skill-matrix', deptId],
    queryFn: () => skillService.getMatrix(deptId),
  });

  // Update cell mutation
  const updateCellMutation = useMutation({
    mutationFn: ({ userId, skillId, level }: { userId: number; skillId: number; level: SkillLevel }) =>
      skillService.updateCell(userId, skillId, { level }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skill-matrix'] });
      toast.success('Skill level updated');
      setEditingCell(null);
    },
    onError: () => toast.error('Failed to update skill level'),
  });

  // Create skill mutation
  const createSkillMutation = useMutation({
    mutationFn: (data: { name: string; category?: string; description?: string }) => skillService.createSkill(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skill-matrix'] });
      toast.success('Skill created');
      setNewSkillOpen(false);
      setSkillForm({ name: '', category: '', description: '' });
    },
    onError: () => toast.error('Failed to create skill'),
  });

  const levelMap = useMemo(() => {
    const m = new Map<string, SkillLevel>();
    matrix?.matrix.forEach((e) => m.set(`${e.userId}-${e.skillId}`, e.level));
    return m;
  }, [matrix]);

  const filteredEmployees = useMemo(() => {
    if (!matrix) return [];
    if (!search.trim()) return matrix.employees;
    const q = search.toLowerCase();
    return matrix.employees.filter((e) =>
      e.fullName.toLowerCase().includes(q) || e.username.toLowerCase().includes(q) || e.role.toLowerCase().includes(q),
    );
  }, [matrix, search]);

  const skills = matrix?.skills ?? [];

  // Coverage: how many employees are trained or expert in each skill
  const coverageByskill = useMemo(() => {
    const cov: Record<number, number> = {};
    for (const skill of skills) {
      cov[skill.id] = filteredEmployees.filter((emp) => {
        const lvl = levelMap.get(`${emp.id}-${skill.id}`);
        return lvl === 'trained' || lvl === 'expert';
      }).length;
    }
    return cov;
  }, [skills, filteredEmployees, levelMap]);

  const criticalRisks = skills.filter((s) => coverageByskill[s.id] === 1);
  const moderateRisks = skills.filter((s) => coverageByskill[s.id] === 2);

  const coverageColor = (score: number) => {
    if (score <= 1) return 'bg-red-100 text-red-700 border-red-200';
    if (score === 2) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  const openCellEditor = (userId: number, skillId: number, userName: string, skillName: string) => {
    if (!editable) return;
    const level = levelMap.get(`${userId}-${skillId}`) ?? 'not_trained';
    setEditingCell({ userId, skillId, level, userName, skillName });
  };

  if (isLoading) return <Loader fullScreen text="Loading skill matrix..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-blue-600" />
            Skill Matrix
          </h1>
          <p className="text-sm text-gray-500 mt-1">Track employee competencies and identify training gaps</p>
        </div>
        {editable && (
          <Button onClick={() => setNewSkillOpen(true)} icon={<Plus className="h-4 w-4" />}>
            Add Skill
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Departments</option>
            {deptData?.map((d) => (
              <option key={d.id} value={String(d.id)}>{d.name}</option>
            ))}
          </select>
        </div>
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-4 text-xs ml-auto">
          <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> Expert</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Trained</span>
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-yellow-500" /> In Training</span>
          <span className="flex items-center gap-1"><XCircle className="h-3.5 w-3.5 text-red-300" /> Not Trained</span>
        </div>
      </div>

      {/* Matrix */}
      {skills.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <GraduationCap className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No skills defined yet.</p>
          {editable && (
            <Button onClick={() => setNewSkillOpen(true)} icon={<Plus className="h-4 w-4" />} className="mt-4">
              Add First Skill
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-2.5 text-left font-medium text-gray-700 sticky left-0 bg-gray-50 z-10 min-w-[200px] border-r border-gray-200">
                    Employee
                  </th>
                  {skills.map((s) => (
                    <th key={s.id} className="px-2 py-2.5 text-center font-medium text-gray-600 min-w-[90px]" title={s.description}>
                      <div className="whitespace-nowrap text-[10px]">{s.name}</div>
                      {s.category && <div className="text-[9px] text-gray-400 font-normal">{s.category}</div>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-blue-50/30">
                    <td className="px-3 py-2 sticky left-0 bg-white z-10 border-r border-gray-100 hover:bg-blue-50/30">
                      <div className="flex items-center gap-2">
                        <Avatar name={emp.fullName} />
                        <div>
                          <p className="font-medium text-gray-900 text-xs">{emp.fullName}</p>
                          <p className="text-[10px] text-gray-400">{emp.role.replace(/_/g, ' ')}</p>
                        </div>
                      </div>
                    </td>
                    {skills.map((s) => {
                      const level = levelMap.get(`${emp.id}-${s.id}`);
                      return (
                        <td
                          key={s.id}
                          className={`px-2 py-2 text-center ${editable ? 'cursor-pointer hover:bg-blue-100' : ''}`}
                          onClick={() => openCellEditor(emp.id, s.id, emp.fullName, s.name)}
                        >
                          <div className="flex items-center justify-center">
                            {levelIcon(level)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {/* Coverage row */}
                <tr className="bg-gray-50 border-t-2 border-gray-300">
                  <td className="px-3 py-2.5 sticky left-0 bg-gray-50 z-10 text-xs font-bold text-gray-700 border-r border-gray-200">
                    Coverage Score
                  </td>
                  {skills.map((s) => (
                    <td key={s.id} className="px-2 py-2.5 text-center">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border ${coverageColor(coverageByskill[s.id] ?? 0)}`}>
                        {coverageByskill[s.id] ?? 0}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Risk report */}
      {skills.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <h4 className="font-semibold text-red-800">Critical Risk — Single Point of Failure</h4>
              <Badge variant="red">{criticalRisks.length}</Badge>
            </div>
            {criticalRisks.length === 0 ? (
              <p className="text-sm text-red-600 italic">No critical risks detected</p>
            ) : (
              <ul className="space-y-2">
                {criticalRisks.map((s) => {
                  const sole = filteredEmployees.find((e) => {
                    const lvl = levelMap.get(`${e.id}-${s.id}`);
                    return lvl === 'trained' || lvl === 'expert';
                  });
                  return (
                    <li key={s.id} className="flex items-center justify-between p-2 bg-red-100/50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-red-800">{s.name}</p>
                        <p className="text-xs text-red-600">Only: {sole?.fullName || 'Unknown'}</p>
                      </div>
                      <Badge variant="red">1 person</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <h4 className="font-semibold text-yellow-800">Moderate Risk — Limited Coverage</h4>
              <Badge variant="yellow">{moderateRisks.length}</Badge>
            </div>
            {moderateRisks.length === 0 ? (
              <p className="text-sm text-yellow-600 italic">No moderate risks detected</p>
            ) : (
              <ul className="space-y-2">
                {moderateRisks.map((s) => (
                  <li key={s.id} className="flex items-center justify-between p-2 bg-yellow-100/50 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800">{s.name}</p>
                    <Badge variant="yellow">2 persons</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Cell edit modal */}
      {editingCell && (
        <Modal isOpen onClose={() => setEditingCell(null)} title="Update Skill Level">
          <div className="space-y-4">
            <div className="text-sm">
              <span className="font-medium">{editingCell.userName}</span>
              <span className="text-gray-500"> — </span>
              <span className="text-blue-600 font-medium">{editingCell.skillName}</span>
            </div>
            <div className="space-y-2">
              {LEVEL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => updateCellMutation.mutate({ userId: editingCell.userId, skillId: editingCell.skillId, level: opt.value })}
                  disabled={updateCellMutation.isPending}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all text-left ${
                    editingCell.level === opt.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                  }`}
                >
                  {opt.icon}
                  <span className="font-medium text-sm">{opt.label}</span>
                  {editingCell.level === opt.value && (
                    <CheckCircle2 className="h-4 w-4 text-blue-500 ml-auto" />
                  )}
                </button>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setEditingCell(null)} icon={<X className="h-4 w-4" />}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* New skill modal */}
      {newSkillOpen && (
        <Modal isOpen onClose={() => setNewSkillOpen(false)} title="Add Skill">
          <div className="space-y-4">
            <Input
              label="Skill Name *"
              value={skillForm.name}
              onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
              placeholder="e.g. HPLC, Sterility Testing"
            />
            <Select
              label="Category"
              value={skillForm.category}
              onChange={(e) => setSkillForm({ ...skillForm, category: e.target.value })}
              options={[
                { value: '', label: '-- None --' },
                { value: 'instrument', label: 'Instrument' },
                { value: 'technique', label: 'Technique' },
                { value: 'qa', label: 'Quality Assurance' },
                { value: 'expertise', label: 'Expertise' },
                { value: 'soft-skill', label: 'Soft Skill' },
              ]}
            />
            <Input
              label="Description"
              value={skillForm.description}
              onChange={(e) => setSkillForm({ ...skillForm, description: e.target.value })}
              placeholder="Brief description"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setNewSkillOpen(false)}>Cancel</Button>
              <Button
                onClick={() => createSkillMutation.mutate(skillForm)}
                loading={createSkillMutation.isPending}
                disabled={!skillForm.name.trim()}
              >
                Create
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
