import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Users,
  UserMinus,
  Shield,
  GraduationCap,
  Award,
  History,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Star,
  ArrowRight,
  ChevronDown,
  RefreshCw,
  UserCheck,
  UserX,
  ClipboardList,
  FlaskConical,
  FileCheck,
  Layers,
  Calendar,
  Building2,
  TrendingUp,
  Eye,
  Download,
  Filter,
  Check,
  Clock,
  Zap,
  ShieldCheck,
  Target,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import SearchInput from '../../components/ui/SearchInput';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

// ════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════

type TabKey = 'offboarding' | 'backup' | 'crosstraining' | 'succession' | 'history';

interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  yearsExp: number;
  currentLoad: number;
  status: 'active' | 'inactive' | 'on_leave';
  skills: string[];
  primaryBackup?: string;
  secondaryBackup?: string;
  autoActivate?: boolean;
  autoActivateDays?: number;
}

interface PendingTask {
  id: string;
  title: string;
  type: 'test' | 'review' | 'approval' | 'sample';
  sampleCode: string;
  client: string;
  dueDate: string;
  assignedTo: string;
  suggestedReplacement: string;
  selected: boolean;
}

interface SkillEntry {
  employeeId: string;
  skill: string;
  level: 'trained' | 'in_training' | 'not_trained' | 'expert';
}

interface TransitionRecord {
  id: string;
  date: string;
  departingEmployee: string;
  department: string;
  tasksReassigned: number;
  reassignedTo: string[];
  doneBy: string;
  status: 'completed' | 'partial' | 'issues';
  notes: string;
}

interface DepartmentSuccession {
  department: string;
  head: string;
  headId: string;
  successor: string;
  successorId: string;
  teamSize: number;
  positionsCovered: number;
  totalPositions: number;
  roles: { role: string; current: string; backup: string; ready: boolean }[];
}

// ════════════════════════════════════════════════════════════════
// MOCK DATA
// ════════════════════════════════════════════════════════════════

const EMPLOYEES: Employee[] = [
  { id: 'E001', name: 'Dr. Ananya Sharma', role: 'Senior Analyst', department: 'Chemistry', email: 'ananya@lab.com', yearsExp: 8, currentLoad: 14, status: 'active', skills: ['HPLC', 'GC-MS', 'Titration', 'Spectroscopy'] },
  { id: 'E002', name: 'Rajesh Kumar', role: 'Analyst', department: 'Chemistry', email: 'rajesh@lab.com', yearsExp: 4, currentLoad: 11, status: 'active', skills: ['HPLC', 'Titration', 'Karl Fischer'] },
  { id: 'E003', name: 'Priya Patel', role: 'Analyst', department: 'Chemistry', email: 'priya@lab.com', yearsExp: 3, currentLoad: 9, status: 'active', skills: ['GC-MS', 'Spectroscopy', 'Dissolution'] },
  { id: 'E004', name: 'Dr. Vikram Singh', role: 'Department Head', department: 'Chemistry', email: 'vikram@lab.com', yearsExp: 15, currentLoad: 6, status: 'active', skills: ['HPLC', 'GC-MS', 'Titration', 'Spectroscopy', 'Method Development'] },
  { id: 'E005', name: 'Meera Reddy', role: 'Junior Analyst', department: 'Chemistry', email: 'meera@lab.com', yearsExp: 1, currentLoad: 12, status: 'active', skills: ['Titration', 'Dissolution'] },
  { id: 'E006', name: 'Dr. Sanjay Gupta', role: 'Department Head', department: 'Microbiology', email: 'sanjay@lab.com', yearsExp: 12, currentLoad: 5, status: 'active', skills: ['Sterility Testing', 'Endotoxin', 'Environmental Monitoring', 'Microbial Limits'] },
  { id: 'E007', name: 'Kavita Nair', role: 'Senior Analyst', department: 'Microbiology', email: 'kavita@lab.com', yearsExp: 7, currentLoad: 13, status: 'active', skills: ['Sterility Testing', 'Microbial Limits', 'Environmental Monitoring'] },
  { id: 'E008', name: 'Amit Deshmukh', role: 'Analyst', department: 'Microbiology', email: 'amit@lab.com', yearsExp: 3, currentLoad: 10, status: 'active', skills: ['Endotoxin', 'Microbial Limits'] },
  { id: 'E009', name: 'Sneha Joshi', role: 'Analyst', department: 'Microbiology', email: 'sneha@lab.com', yearsExp: 2, currentLoad: 8, status: 'active', skills: ['Sterility Testing', 'Environmental Monitoring'] },
  { id: 'E010', name: 'Dr. Fatima Khan', role: 'Senior Analyst', department: 'Instrumentation', email: 'fatima@lab.com', yearsExp: 9, currentLoad: 7, status: 'active', skills: ['ICP-OES', 'AAS', 'XRF', 'UV-Vis'] },
  { id: 'E011', name: 'Arjun Mehta', role: 'Analyst', department: 'Instrumentation', email: 'arjun@lab.com', yearsExp: 5, currentLoad: 11, status: 'active', skills: ['ICP-OES', 'AAS', 'UV-Vis'] },
  { id: 'E012', name: 'Deepa Iyer', role: 'Department Head', department: 'Instrumentation', email: 'deepa@lab.com', yearsExp: 14, currentLoad: 4, status: 'active', skills: ['ICP-OES', 'AAS', 'XRF', 'UV-Vis', 'FTIR'] },
  { id: 'E013', name: 'Rahul Verma', role: 'Junior Analyst', department: 'Instrumentation', email: 'rahul@lab.com', yearsExp: 1, currentLoad: 13, status: 'active', skills: ['UV-Vis', 'FTIR'] },
  { id: 'E014', name: 'Neha Agarwal', role: 'QA Reviewer', department: 'Quality Assurance', email: 'neha@lab.com', yearsExp: 6, currentLoad: 15, status: 'active', skills: ['Data Review', 'SOP Management', 'CAPA', 'Audit'] },
  { id: 'E015', name: 'Suresh Pillai', role: 'QA Reviewer', department: 'Quality Assurance', email: 'suresh@lab.com', yearsExp: 4, currentLoad: 12, status: 'active', skills: ['Data Review', 'SOP Management', 'Deviation'] },
  { id: 'E016', name: 'Dr. Lakshmi Rao', role: 'QA Head', department: 'Quality Assurance', email: 'lakshmi@lab.com', yearsExp: 16, currentLoad: 3, status: 'active', skills: ['Data Review', 'SOP Management', 'CAPA', 'Audit', 'Regulatory'] },
  { id: 'E017', name: 'Karthik Sundaram', role: 'Analyst', department: 'Chemistry', email: 'karthik@lab.com', yearsExp: 5, currentLoad: 10, status: 'active', skills: ['HPLC', 'Karl Fischer', 'Dissolution', 'Method Development'] },
  { id: 'E018', name: 'Pooja Bhat', role: 'Junior Analyst', department: 'Microbiology', email: 'pooja@lab.com', yearsExp: 1, currentLoad: 9, status: 'active', skills: ['Endotoxin'] },
  { id: 'E019', name: 'Manish Tiwari', role: 'Analyst', department: 'Instrumentation', email: 'manish@lab.com', yearsExp: 3, currentLoad: 10, status: 'active', skills: ['AAS', 'XRF', 'FTIR'] },
  { id: 'E020', name: 'Divya Menon', role: 'Senior Analyst', department: 'Quality Assurance', email: 'divya@lab.com', yearsExp: 8, currentLoad: 11, status: 'active', skills: ['Data Review', 'CAPA', 'Audit', 'Deviation'] },
  { id: 'E021', name: 'Arun Prasad', role: 'Lab Manager', department: 'Administration', email: 'arun@lab.com', yearsExp: 10, currentLoad: 8, status: 'active', skills: ['Lab Management', 'Scheduling', 'Resource Planning'] },
  { id: 'E022', name: 'Ritu Saxena', role: 'Sample Coordinator', department: 'Administration', email: 'ritu@lab.com', yearsExp: 4, currentLoad: 14, status: 'active', skills: ['Sample Management', 'Client Communication', 'Scheduling'] },
];

const DEPARTMENTS = ['Chemistry', 'Microbiology', 'Instrumentation', 'Quality Assurance', 'Administration'];

const ALL_SKILLS = [
  'HPLC', 'GC-MS', 'Titration', 'Spectroscopy', 'Karl Fischer', 'Dissolution',
  'Method Development', 'Sterility Testing', 'Endotoxin', 'Environmental Monitoring',
  'Microbial Limits', 'ICP-OES', 'AAS', 'XRF', 'UV-Vis', 'FTIR',
  'Data Review', 'SOP Management', 'CAPA', 'Audit', 'Deviation', 'Regulatory',
  'Lab Management', 'Scheduling', 'Resource Planning', 'Sample Management', 'Client Communication',
];

const SKILL_MATRIX: SkillEntry[] = [];
for (const emp of EMPLOYEES) {
  for (const skill of ALL_SKILLS) {
    if (emp.skills.includes(skill)) {
      const level = emp.yearsExp >= 7 ? 'expert' : emp.yearsExp >= 3 ? 'trained' : 'in_training';
      SKILL_MATRIX.push({ employeeId: emp.id, skill, level });
    } else {
      SKILL_MATRIX.push({ employeeId: emp.id, skill, level: 'not_trained' });
    }
  }
}

function generatePendingTasks(empId: string): PendingTask[] {
  const emp = EMPLOYEES.find((e) => e.id === empId);
  if (!emp) return [];
  const dept = emp.department;
  const sameRole = EMPLOYEES.filter((e) => e.id !== empId && e.department === dept && e.status === 'active');
  const sorted = [...sameRole].sort((a, b) => a.currentLoad - b.currentLoad);
  const suggest = sorted[0]?.name || 'N/A';
  const clients = ['PharmaCorp Ltd', 'BioGen Solutions', 'MediVita Inc', 'NovaChem Pvt', 'AquaPure Labs', 'GreenLeaf Pharma'];
  const types: PendingTask['type'][] = ['test', 'review', 'approval', 'sample'];
  const titles = [
    'HPLC Assay Analysis', 'Dissolution Test - Batch 445', 'Microbial Limit Test',
    'Water Testing - pH & Conductivity', 'Raw Material Identity Test', 'Stability Study T6M',
    'Endotoxin Testing - Lot 892', 'Heavy Metals Analysis', 'Content Uniformity',
    'Sterility Test - Injectable Batch', 'Karl Fischer Moisture', 'Related Substances by GC',
    'Residual Solvents Analysis', 'Environmental Monitoring Review', 'Method Validation Report',
  ];
  const count = Math.min(emp.currentLoad, titles.length);
  const tasks: PendingTask[] = [];
  for (let i = 0; i < count; i++) {
    const t = types[i % types.length];
    const sugIdx = i % sorted.length;
    tasks.push({
      id: `T${empId}-${i}`,
      title: titles[i],
      type: t,
      sampleCode: `SMP-2026-${String(1000 + i * 7).padStart(4, '0')}`,
      client: clients[i % clients.length],
      dueDate: new Date(Date.now() + (i + 1) * 86400000).toISOString().slice(0, 10),
      assignedTo: empId,
      suggestedReplacement: sorted[sugIdx]?.name || suggest,
      selected: false,
    });
  }
  return tasks;
}

const TRANSITION_HISTORY: TransitionRecord[] = [
  { id: 'TH001', date: '2026-02-15', departingEmployee: 'Nikhil Banerjee', department: 'Chemistry', tasksReassigned: 12, reassignedTo: ['Rajesh Kumar', 'Priya Patel'], doneBy: 'Dr. Vikram Singh', status: 'completed', notes: 'Smooth transition. All tasks completed on time.' },
  { id: 'TH002', date: '2026-01-28', departingEmployee: 'Swati Kulkarni', department: 'Microbiology', tasksReassigned: 8, reassignedTo: ['Kavita Nair', 'Amit Deshmukh'], doneBy: 'Dr. Sanjay Gupta', status: 'completed', notes: 'Minor delays on 2 endotoxin tests.' },
  { id: 'TH003', date: '2025-12-10', departingEmployee: 'Rohan Malhotra', department: 'Instrumentation', tasksReassigned: 15, reassignedTo: ['Dr. Fatima Khan', 'Arjun Mehta', 'Manish Tiwari'], doneBy: 'Deepa Iyer', status: 'issues', notes: '3 tasks overdue after transfer due to equipment calibration backlog.' },
  { id: 'TH004', date: '2025-11-22', departingEmployee: 'Geeta Nambiar', department: 'Quality Assurance', tasksReassigned: 6, reassignedTo: ['Neha Agarwal'], doneBy: 'Dr. Lakshmi Rao', status: 'completed', notes: 'All reviews transferred and completed within SLA.' },
  { id: 'TH005', date: '2025-10-05', departingEmployee: 'Vivek Sharma', department: 'Chemistry', tasksReassigned: 18, reassignedTo: ['Dr. Ananya Sharma', 'Karthik Sundaram', 'Meera Reddy'], doneBy: 'Dr. Vikram Singh', status: 'partial', notes: '2 method validation tasks could not be reassigned - required specialized training.' },
  { id: 'TH006', date: '2025-09-14', departingEmployee: 'Anjali Das', department: 'Microbiology', tasksReassigned: 10, reassignedTo: ['Sneha Joshi', 'Pooja Bhat'], doneBy: 'Dr. Sanjay Gupta', status: 'completed', notes: 'Completed. Pooja received emergency training on sterility testing.' },
];

const SUCCESSION_DATA: DepartmentSuccession[] = [
  {
    department: 'Chemistry', head: 'Dr. Vikram Singh', headId: 'E004', successor: 'Dr. Ananya Sharma', successorId: 'E001', teamSize: 6, positionsCovered: 5, totalPositions: 6,
    roles: [
      { role: 'Department Head', current: 'Dr. Vikram Singh', backup: 'Dr. Ananya Sharma', ready: true },
      { role: 'Senior Analyst', current: 'Dr. Ananya Sharma', backup: 'Karthik Sundaram', ready: true },
      { role: 'Analyst (HPLC)', current: 'Rajesh Kumar', backup: 'Karthik Sundaram', ready: true },
      { role: 'Analyst (GC-MS)', current: 'Priya Patel', backup: 'Dr. Ananya Sharma', ready: true },
      { role: 'Analyst (Wet Chem)', current: 'Karthik Sundaram', backup: 'Rajesh Kumar', ready: true },
      { role: 'Junior Analyst', current: 'Meera Reddy', backup: '', ready: false },
    ],
  },
  {
    department: 'Microbiology', head: 'Dr. Sanjay Gupta', headId: 'E006', successor: 'Kavita Nair', successorId: 'E007', teamSize: 5, positionsCovered: 3, totalPositions: 5,
    roles: [
      { role: 'Department Head', current: 'Dr. Sanjay Gupta', backup: 'Kavita Nair', ready: true },
      { role: 'Senior Analyst', current: 'Kavita Nair', backup: 'Sneha Joshi', ready: true },
      { role: 'Analyst (Endotoxin)', current: 'Amit Deshmukh', backup: 'Pooja Bhat', ready: false },
      { role: 'Analyst (Sterility)', current: 'Sneha Joshi', backup: '', ready: false },
      { role: 'Junior Analyst', current: 'Pooja Bhat', backup: 'Amit Deshmukh', ready: true },
    ],
  },
  {
    department: 'Instrumentation', head: 'Deepa Iyer', headId: 'E012', successor: 'Dr. Fatima Khan', successorId: 'E010', teamSize: 4, positionsCovered: 3, totalPositions: 4,
    roles: [
      { role: 'Department Head', current: 'Deepa Iyer', backup: 'Dr. Fatima Khan', ready: true },
      { role: 'Senior Analyst', current: 'Dr. Fatima Khan', backup: 'Arjun Mehta', ready: true },
      { role: 'Analyst', current: 'Arjun Mehta', backup: 'Manish Tiwari', ready: true },
      { role: 'Junior Analyst', current: 'Rahul Verma', backup: '', ready: false },
    ],
  },
  {
    department: 'Quality Assurance', head: 'Dr. Lakshmi Rao', headId: 'E016', successor: 'Divya Menon', successorId: 'E020', teamSize: 4, positionsCovered: 4, totalPositions: 4,
    roles: [
      { role: 'QA Head', current: 'Dr. Lakshmi Rao', backup: 'Divya Menon', ready: true },
      { role: 'Senior Reviewer', current: 'Divya Menon', backup: 'Neha Agarwal', ready: true },
      { role: 'QA Reviewer 1', current: 'Neha Agarwal', backup: 'Suresh Pillai', ready: true },
      { role: 'QA Reviewer 2', current: 'Suresh Pillai', backup: 'Neha Agarwal', ready: true },
    ],
  },
];

// ════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ════════════════════════════════════════════════════════════════

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').filter((_, i, a) => i === 0 || i === a.length - 1).map((n) => n[0]).join('').toUpperCase();
  const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500'];
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const cls = colors[hash % colors.length];
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-14 h-14 text-lg' : 'w-10 h-10 text-sm';
  return <div className={`${sz} ${cls} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}>{initials}</div>;
}

function TabButton({ active, onClick, icon: Icon, label, count }: { active: boolean; onClick: () => void; icon: React.ElementType; label: string; count?: number }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
        active ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
      {count !== undefined && (
        <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full font-semibold ${active ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

// ════════════════════════════════════════════════════════════════
// TAB 1: OFFBOARDING
// ════════════════════════════════════════════════════════════════

function OffboardingTab() {
  const [search, setSearch] = useState('');
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [tasks, setTasks] = useState<PendingTask[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [reassignMode, setReassignMode] = useState<'all' | 'selected'>('all');
  const [reassigned, setReassigned] = useState(false);
  const [reassignSummary, setReassignSummary] = useState({ tasks: 0, employees: 0 });
  const [deactivate, setDeactivate] = useState(false);
  const [revokeAccess, setRevokeAccess] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return [];
    const q = search.toLowerCase();
    return EMPLOYEES.filter((e) => e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q) || e.department.toLowerCase().includes(q));
  }, [search]);

  const selectEmployee = (emp: Employee) => {
    setSelectedEmp(emp);
    setTasks(generatePendingTasks(emp.id));
    setReassigned(false);
    setSearch('');
  };

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t)));
  };

  const toggleAll = () => {
    const allSelected = tasks.every((t) => t.selected);
    setTasks((prev) => prev.map((t) => ({ ...t, selected: !allSelected })));
  };

  const changeReplacement = (taskId: string, newPerson: string) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, suggestedReplacement: newPerson } : t)));
  };

  const handleReassign = () => {
    const toReassign = reassignMode === 'all' ? tasks : tasks.filter((t) => t.selected);
    const uniqueEmployees = new Set(toReassign.map((t) => t.suggestedReplacement));
    setReassignSummary({ tasks: toReassign.length, employees: uniqueEmployees.size });
    setReassigned(true);
    setShowConfirm(false);
    toast.success(`${toReassign.length} tasks reassigned successfully`);
  };

  const pendingCounts = useMemo(() => {
    const counts = { test: 0, review: 0, approval: 0, sample: 0 };
    for (const t of tasks) counts[t.type]++;
    return counts;
  }, [tasks]);

  const sameRoleEmployees = useMemo(() => {
    if (!selectedEmp) return [];
    return EMPLOYEES.filter((e) => e.id !== selectedEmp.id && e.department === selectedEmp.department && e.status === 'active');
  }, [selectedEmp]);

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="relative">
        <SearchInput value={search} onSearch={setSearch} placeholder="Search employee by name, ID, or department..." className="max-w-xl" />
        {search && filtered.length > 0 && !selectedEmp && (
          <div className="absolute top-full left-0 mt-1 w-full max-w-xl bg-white border border-gray-200 rounded-xl shadow-xl z-20 max-h-64 overflow-y-auto">
            {filtered.map((emp) => (
              <button key={emp.id} onClick={() => selectEmployee(emp)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left border-b border-gray-100 last:border-0">
                <Avatar name={emp.name} size="sm" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                  <p className="text-xs text-gray-500">{emp.role} - {emp.department}</p>
                </div>
                <Badge variant="blue" className="ml-auto">{emp.id}</Badge>
              </button>
            ))}
          </div>
        )}
      </div>

      {!selectedEmp && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <UserMinus className="h-16 w-16 mb-4 text-gray-300" />
          <p className="text-lg font-medium text-gray-500">Select an employee to begin offboarding</p>
          <p className="text-sm mt-1">Search by name, ID, or department above</p>
        </div>
      )}

      {selectedEmp && !reassigned && (
        <>
          {/* Employee card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start gap-5">
              <Avatar name={selectedEmp.name} size="lg" />
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-gray-900">{selectedEmp.name}</h3>
                  <Badge variant="red">Departing</Badge>
                </div>
                <p className="text-sm text-gray-500 mt-1">{selectedEmp.role} &middot; {selectedEmp.department}</p>
                <div className="flex items-center gap-6 mt-3 text-sm text-gray-600">
                  <span className="flex items-center gap-1"><Award className="h-4 w-4 text-blue-500" />{selectedEmp.yearsExp} years experience</span>
                  <span className="flex items-center gap-1"><ClipboardList className="h-4 w-4 text-amber-500" />{selectedEmp.currentLoad} pending tasks</span>
                  <span className="flex items-center gap-1"><Building2 className="h-4 w-4 text-purple-500" />{selectedEmp.department}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setSelectedEmp(null); setTasks([]); }}>
                <XCircle className="h-4 w-4" /> Clear
              </Button>
            </div>
          </div>

          {/* Pending work summary */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-blue-200 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><FlaskConical className="h-5 w-5 text-blue-600" /></div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{pendingCounts.test}</p>
                  <p className="text-xs text-gray-500">Tests Assigned</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center"><Eye className="h-5 w-5 text-amber-600" /></div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{pendingCounts.review}</p>
                  <p className="text-xs text-gray-500">Reviews Pending</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-purple-200 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center"><FileCheck className="h-5 w-5 text-purple-600" /></div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{pendingCounts.approval}</p>
                  <p className="text-xs text-gray-500">Approvals Pending</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-green-200 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center"><Layers className="h-5 w-5 text-green-600" /></div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{pendingCounts.sample}</p>
                  <p className="text-xs text-gray-500">Samples In Progress</p>
                </div>
              </div>
            </div>
          </div>

          {/* Reassignment plan table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Reassignment Plan</h3>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" icon={<Check className="h-4 w-4" />} onClick={() => { setReassignMode('selected'); setShowConfirm(true); }} disabled={!tasks.some((t) => t.selected)}>
                  Reassign Selected
                </Button>
                <Button size="sm" icon={<RefreshCw className="h-4 w-4" />} onClick={() => { setReassignMode('all'); setShowConfirm(true); }}>
                  Reassign All
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600">
                    <th className="px-4 py-3 text-left w-10">
                      <input type="checkbox" checked={tasks.length > 0 && tasks.every((t) => t.selected)} onChange={toggleAll} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Task</th>
                    <th className="px-4 py-3 text-left font-medium">Type</th>
                    <th className="px-4 py-3 text-left font-medium">Sample Code</th>
                    <th className="px-4 py-3 text-left font-medium">Client</th>
                    <th className="px-4 py-3 text-left font-medium">Due Date</th>
                    <th className="px-4 py-3 text-left font-medium">Suggested Replacement</th>
                    <th className="px-4 py-3 text-left font-medium">Load Impact</th>
                    <th className="px-4 py-3 text-left font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tasks.map((task) => {
                    const replacementEmp = EMPLOYEES.find((e) => e.name === task.suggestedReplacement);
                    const currentLoad = replacementEmp?.currentLoad || 0;
                    const projectedLoad = currentLoad + 1;
                    const isOverdue = new Date(task.dueDate) < new Date();
                    const typeBadge: Record<string, { variant: 'blue' | 'yellow' | 'purple' | 'green'; label: string }> = {
                      test: { variant: 'blue', label: 'Test' },
                      review: { variant: 'yellow', label: 'Review' },
                      approval: { variant: 'purple', label: 'Approval' },
                      sample: { variant: 'green', label: 'Sample' },
                    };
                    return (
                      <tr key={task.id} className={`hover:bg-gray-50 ${task.selected ? 'bg-blue-50/50' : ''}`}>
                        <td className="px-4 py-3">
                          <input type="checkbox" checked={task.selected} onChange={() => toggleTask(task.id)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">{task.title}</td>
                        <td className="px-4 py-3"><Badge variant={typeBadge[task.type].variant}>{typeBadge[task.type].label}</Badge></td>
                        <td className="px-4 py-3 text-gray-600 font-mono text-xs">{task.sampleCode}</td>
                        <td className="px-4 py-3 text-gray-600">{task.client}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>{task.dueDate}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={task.suggestedReplacement} size="sm" />
                            <span className="text-sm text-gray-700">{task.suggestedReplacement}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${projectedLoad > 15 ? 'bg-red-100 text-red-700' : projectedLoad > 12 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                            {currentLoad} &rarr; {projectedLoad} tasks
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={task.suggestedReplacement}
                            onChange={(e) => changeReplacement(task.id, e.target.value)}
                            className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-blue-500"
                          >
                            {sameRoleEmployees.map((e) => (
                              <option key={e.id} value={e.name}>{e.name} ({e.currentLoad} tasks)</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Post-reassignment options */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Post-Reassignment Actions</h4>
            <div className="flex items-center gap-8">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={deactivate} onChange={(e) => setDeactivate(e.target.checked)} className="rounded border-gray-300 text-red-600 focus:ring-red-500" />
                <UserX className="h-4 w-4 text-red-500" />
                Deactivate employee account
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={revokeAccess} onChange={(e) => setRevokeAccess(e.target.checked)} className="rounded border-gray-300 text-amber-500 focus:ring-amber-500" />
                <Shield className="h-4 w-4 text-amber-500" />
                Revoke system access
              </label>
            </div>
          </div>
        </>
      )}

      {reassigned && selectedEmp && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-green-800">Reassignment Complete</h3>
          <p className="text-sm text-green-600 mt-2">
            {reassignSummary.tasks} tasks successfully reassigned to {reassignSummary.employees} employee{reassignSummary.employees > 1 ? 's' : ''}
          </p>
          {deactivate && <p className="text-sm text-red-600 mt-1">Account for {selectedEmp.name} has been deactivated</p>}
          {revokeAccess && <p className="text-sm text-amber-600 mt-1">System access has been revoked</p>}
          <div className="flex items-center justify-center gap-3 mt-6">
            <Button variant="outline" onClick={() => { setSelectedEmp(null); setTasks([]); setReassigned(false); setDeactivate(false); setRevokeAccess(false); }}>
              Start New Offboarding
            </Button>
            <Button icon={<Download className="h-4 w-4" />} variant="secondary">Export Report</Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleReassign}
        title="Confirm Reassignment"
        message={`Are you sure you want to reassign ${reassignMode === 'all' ? tasks.length : tasks.filter((t) => t.selected).length} tasks? This action will transfer work to the designated employees.`}
        confirmText="Reassign"
        variant="primary"
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// TAB 2: BACKUP / DEPUTY CONFIGURATION
// ════════════════════════════════════════════════════════════════

function BackupTab() {
  const [employees, setEmployees] = useState<Employee[]>(() =>
    EMPLOYEES.map((e) => ({
      ...e,
      primaryBackup: e.primaryBackup || '',
      secondaryBackup: e.secondaryBackup || '',
      autoActivate: e.autoActivate ?? false,
      autoActivateDays: e.autoActivateDays ?? 2,
    }))
  );
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [configModal, setConfigModal] = useState<Employee | null>(null);
  const [editPrimary, setEditPrimary] = useState('');
  const [editSecondary, setEditSecondary] = useState('');
  const [editAutoActivate, setEditAutoActivate] = useState(false);
  const [editDays, setEditDays] = useState(2);

  const filtered = useMemo(() => {
    let list = employees;
    if (deptFilter !== 'all') list = list.filter((e) => e.department === deptFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q));
    }
    return list;
  }, [employees, search, deptFilter]);

  const openConfig = (emp: Employee) => {
    setConfigModal(emp);
    setEditPrimary(emp.primaryBackup || '');
    setEditSecondary(emp.secondaryBackup || '');
    setEditAutoActivate(emp.autoActivate ?? false);
    setEditDays(emp.autoActivateDays ?? 2);
  };

  const saveConfig = () => {
    if (!configModal) return;
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === configModal.id
          ? { ...e, primaryBackup: editPrimary, secondaryBackup: editSecondary, autoActivate: editAutoActivate, autoActivateDays: editDays }
          : e
      )
    );
    setConfigModal(null);
    toast.success(`Backup configured for ${configModal.name}`);
  };

  const bulkConfigure = () => {
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.primaryBackup) return emp;
        const sameRole = prev.filter((e) => e.id !== emp.id && e.department === emp.department && e.status === 'active').sort((a, b) => a.currentLoad - b.currentLoad);
        return {
          ...emp,
          primaryBackup: sameRole[0]?.name || '',
          secondaryBackup: sameRole[1]?.name || '',
          autoActivate: true,
          autoActivateDays: 2,
        };
      })
    );
    toast.success('Bulk backup configuration applied');
  };

  const configuredCount = employees.filter((e) => e.primaryBackup).length;
  const unconfiguredCount = employees.length - configuredCount;

  const sameRoleOptions = useMemo(() => {
    if (!configModal) return [];
    return EMPLOYEES.filter((e) => e.id !== configModal.id && e.department === configModal.department && e.status === 'active');
  }, [configModal]);

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg text-sm">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="font-medium text-green-700">{configuredCount} Configured</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <span className="font-medium text-amber-700">{unconfiguredCount} No Backup</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <SearchInput value={search} onSearch={setSearch} placeholder="Search employees..." className="w-64" />
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Departments</option>
            {DEPARTMENTS.map((d) => (<option key={d} value={d}>{d}</option>))}
          </select>
          <Button size="sm" icon={<Zap className="h-4 w-4" />} onClick={bulkConfigure}>Bulk Configure</Button>
        </div>
      </div>

      {/* Backup table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th className="px-4 py-3 text-left font-medium">Employee</th>
                <th className="px-4 py-3 text-left font-medium">Department</th>
                <th className="px-4 py-3 text-left font-medium">Role</th>
                <th className="px-4 py-3 text-left font-medium">Primary Backup</th>
                <th className="px-4 py-3 text-left font-medium">Secondary Backup</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={emp.name} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900">{emp.name}</p>
                        <p className="text-xs text-gray-500">{emp.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{emp.department}</td>
                  <td className="px-4 py-3 text-gray-600">{emp.role}</td>
                  <td className="px-4 py-3">
                    {emp.primaryBackup ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={emp.primaryBackup} size="sm" />
                        <span className="text-sm text-gray-700">{emp.primaryBackup}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Not set</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {emp.secondaryBackup ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={emp.secondaryBackup} size="sm" />
                        <span className="text-sm text-gray-700">{emp.secondaryBackup}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Not set</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {emp.primaryBackup ? (
                      <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle2 className="h-3.5 w-3.5" /> Configured</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-medium"><AlertTriangle className="h-3.5 w-3.5" /> No Backup</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button variant="outline" size="sm" onClick={() => openConfig(emp)}>Configure</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Configure Modal */}
      <Modal isOpen={!!configModal} onClose={() => setConfigModal(null)} title={`Configure Backup - ${configModal?.name || ''}`} size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfigModal(null)}>Cancel</Button>
            <Button onClick={saveConfig}>Save Configuration</Button>
          </>
        }
      >
        {configModal && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <Avatar name={configModal.name} size="lg" />
              <div>
                <p className="font-semibold text-gray-900">{configModal.name}</p>
                <p className="text-sm text-gray-500">{configModal.role} &middot; {configModal.department}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Backup</label>
              <select value={editPrimary} onChange={(e) => setEditPrimary(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500">
                <option value="">Select primary backup...</option>
                {sameRoleOptions.map((e) => (<option key={e.id} value={e.name}>{e.name} - {e.role} ({e.currentLoad} tasks)</option>))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Backup</label>
              <select value={editSecondary} onChange={(e) => setEditSecondary(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500">
                <option value="">Select secondary backup...</option>
                {sameRoleOptions.filter((e) => e.name !== editPrimary).map((e) => (<option key={e.id} value={e.name}>{e.name} - {e.role} ({e.currentLoad} tasks)</option>))}
              </select>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div>
                <p className="text-sm font-medium text-blue-800">Auto-Activate Transfer</p>
                <p className="text-xs text-blue-600 mt-0.5">Automatically transfer pending work if employee is absent</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={editAutoActivate} onChange={(e) => setEditAutoActivate(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
                {editAutoActivate && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-700">After</span>
                    <input type="number" min={1} max={30} value={editDays} onChange={(e) => setEditDays(Number(e.target.value))} className="w-16 border border-blue-300 rounded-lg px-2 py-1 text-sm text-center focus:ring-2 focus:ring-blue-500" />
                    <span className="text-xs text-blue-700">days</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// TAB 3: CROSS-TRAINING MATRIX
// ════════════════════════════════════════════════════════════════

function CrossTrainingTab() {
  const [deptFilter, setDeptFilter] = useState('all');

  const filteredEmployees = useMemo(() => {
    if (deptFilter === 'all') return EMPLOYEES;
    return EMPLOYEES.filter((e) => e.department === deptFilter);
  }, [deptFilter]);

  const relevantSkills = useMemo(() => {
    const deptSkillMap: Record<string, string[]> = {
      Chemistry: ['HPLC', 'GC-MS', 'Titration', 'Spectroscopy', 'Karl Fischer', 'Dissolution', 'Method Development'],
      Microbiology: ['Sterility Testing', 'Endotoxin', 'Environmental Monitoring', 'Microbial Limits'],
      Instrumentation: ['ICP-OES', 'AAS', 'XRF', 'UV-Vis', 'FTIR'],
      'Quality Assurance': ['Data Review', 'SOP Management', 'CAPA', 'Audit', 'Deviation', 'Regulatory'],
      Administration: ['Lab Management', 'Scheduling', 'Resource Planning', 'Sample Management', 'Client Communication'],
    };
    if (deptFilter === 'all') return ALL_SKILLS;
    return deptSkillMap[deptFilter] || ALL_SKILLS;
  }, [deptFilter]);

  const coverageScores = useMemo(() => {
    const scores: Record<string, number> = {};
    for (const skill of relevantSkills) {
      scores[skill] = filteredEmployees.filter((emp) => {
        const entry = SKILL_MATRIX.find((s) => s.employeeId === emp.id && s.skill === skill);
        return entry && (entry.level === 'trained' || entry.level === 'expert');
      }).length;
    }
    return scores;
  }, [relevantSkills, filteredEmployees]);

  const criticalRisks = useMemo(() => {
    return relevantSkills.filter((skill) => coverageScores[skill] === 1);
  }, [relevantSkills, coverageScores]);

  const moderateRisks = useMemo(() => {
    return relevantSkills.filter((skill) => coverageScores[skill] === 2);
  }, [relevantSkills, coverageScores]);

  const getCellIcon = (empId: string, skill: string) => {
    const entry = SKILL_MATRIX.find((s) => s.employeeId === empId && s.skill === skill);
    if (!entry) return <span className="text-gray-300">-</span>;
    switch (entry.level) {
      case 'expert': return <span className="text-amber-500" title="Expert"><Star className="h-4 w-4 fill-amber-500" /></span>;
      case 'trained': return <span className="text-green-500" title="Trained"><CheckCircle2 className="h-4 w-4" /></span>;
      case 'in_training': return <span className="text-yellow-500" title="In Training"><Clock className="h-4 w-4" /></span>;
      default: return <span className="text-red-300" title="Not Trained"><XCircle className="h-4 w-4" /></span>;
    }
  };

  const getCoverageColor = (score: number) => {
    if (score <= 1) return 'bg-red-100 text-red-700 border-red-200';
    if (score === 2) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-gray-500" />
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500">
            <option value="all">All Departments</option>
            {DEPARTMENTS.map((d) => (<option key={d} value={d}>{d}</option>))}
          </select>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" /> Expert</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Trained</span>
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-yellow-500" /> In Training</span>
          <span className="flex items-center gap-1"><XCircle className="h-3.5 w-3.5 text-red-300" /> Not Trained</span>
        </div>
      </div>

      {/* Matrix */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-2.5 text-left font-medium text-gray-700 sticky left-0 bg-gray-50 z-10 min-w-[180px]">Employee</th>
                {relevantSkills.map((skill) => (
                  <th key={skill} className="px-2 py-2.5 text-center font-medium text-gray-600 min-w-[80px]">
                    <div className="transform -rotate-0 whitespace-nowrap text-[10px]">{skill}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 sticky left-0 bg-white z-10 border-r border-gray-100">
                    <div className="flex items-center gap-2">
                      <Avatar name={emp.name} size="sm" />
                      <div>
                        <p className="font-medium text-gray-900 text-xs">{emp.name}</p>
                        <p className="text-[10px] text-gray-400">{emp.department}</p>
                      </div>
                    </div>
                  </td>
                  {relevantSkills.map((skill) => (
                    <td key={skill} className="px-2 py-2 text-center">{getCellIcon(emp.id, skill)}</td>
                  ))}
                </tr>
              ))}
              {/* Coverage row */}
              <tr className="bg-gray-50 font-medium border-t-2 border-gray-300">
                <td className="px-3 py-2.5 sticky left-0 bg-gray-50 z-10 text-xs font-bold text-gray-700">Coverage Score</td>
                {relevantSkills.map((skill) => (
                  <td key={skill} className="px-2 py-2.5 text-center">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border ${getCoverageColor(coverageScores[skill])}`}>
                      {coverageScores[skill]}
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk Report */}
      <div className="grid grid-cols-2 gap-4">
        {/* Critical risks */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h4 className="font-semibold text-red-800">Critical Risk - Single Point of Failure</h4>
            <Badge variant="red">{criticalRisks.length}</Badge>
          </div>
          {criticalRisks.length === 0 ? (
            <p className="text-sm text-red-600 italic">No critical risks detected</p>
          ) : (
            <ul className="space-y-2">
              {criticalRisks.map((skill) => {
                const soleExpert = filteredEmployees.find((emp) => {
                  const entry = SKILL_MATRIX.find((s) => s.employeeId === emp.id && s.skill === skill);
                  return entry && (entry.level === 'trained' || entry.level === 'expert');
                });
                return (
                  <li key={skill} className="flex items-center justify-between p-2 bg-red-100/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-red-800">{skill}</p>
                      <p className="text-xs text-red-600">Only trained person: {soleExpert?.name || 'Unknown'}</p>
                    </div>
                    <Badge variant="red">1 person</Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Moderate risks */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <h4 className="font-semibold text-yellow-800">Moderate Risk - Limited Coverage</h4>
            <Badge variant="yellow">{moderateRisks.length}</Badge>
          </div>
          {moderateRisks.length === 0 ? (
            <p className="text-sm text-yellow-600 italic">No moderate risks detected</p>
          ) : (
            <ul className="space-y-2">
              {moderateRisks.map((skill) => (
                <li key={skill} className="flex items-center justify-between p-2 bg-yellow-100/50 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800">{skill}</p>
                  <Badge variant="yellow">2 persons</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// TAB 4: SUCCESSION PLANNING
// ════════════════════════════════════════════════════════════════

function SuccessionTab() {
  const [configModal, setConfigModal] = useState<DepartmentSuccession | null>(null);
  const [successionData, setSuccessionData] = useState(SUCCESSION_DATA);

  const overallReadiness = useMemo(() => {
    const total = successionData.reduce((acc, d) => acc + d.totalPositions, 0);
    const covered = successionData.reduce((acc, d) => acc + d.positionsCovered, 0);
    return total > 0 ? Math.round((covered / total) * 100) : 0;
  }, [successionData]);

  const readinessColor = overallReadiness >= 80 ? 'text-green-600' : overallReadiness >= 60 ? 'text-yellow-600' : 'text-red-600';
  const readinessBg = overallReadiness >= 80 ? 'bg-green-50 border-green-200' : overallReadiness >= 60 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200';

  return (
    <div className="space-y-6">
      {/* Overall readiness */}
      <div className={`rounded-xl border p-6 ${readinessBg}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Lab Succession Readiness</h3>
            <p className="text-sm text-gray-600 mt-1">Overall preparedness score across all departments</p>
          </div>
          <div className="text-center">
            <p className={`text-4xl font-bold ${readinessColor}`}>{overallReadiness}%</p>
            <p className="text-xs text-gray-500 mt-1">Positions Covered</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-4 w-full bg-gray-200 rounded-full h-3">
          <div className={`h-3 rounded-full transition-all ${overallReadiness >= 80 ? 'bg-green-500' : overallReadiness >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${overallReadiness}%` }} />
        </div>
      </div>

      {/* Department cards */}
      <div className="grid grid-cols-2 gap-6">
        {successionData.map((dept) => {
          const pct = dept.totalPositions > 0 ? Math.round((dept.positionsCovered / dept.totalPositions) * 100) : 0;
          const cardColor = pct >= 80 ? 'border-green-200' : pct >= 60 ? 'border-yellow-200' : 'border-red-200';
          const pctColor = pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-600';
          const barColor = pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500';
          return (
            <div key={dept.department} className={`bg-white rounded-xl border-2 ${cardColor} shadow-sm p-6`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <Avatar name={dept.head} size="lg" />
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">{dept.department}</h4>
                    <p className="text-sm text-gray-500">{dept.head}</p>
                    <p className="text-xs text-gray-400">Department Head</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${pctColor}`}>{pct}%</p>
                  <p className="text-[10px] text-gray-400 uppercase">Covered</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span>{dept.teamSize} members</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  <span>{dept.positionsCovered}/{dept.totalPositions} positions</span>
                </div>
              </div>

              {/* Succession chain */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <Target className="h-3.5 w-3.5" /> Succession Chain
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <Avatar name={dept.head} size="sm" />
                    <span className="text-xs font-medium text-gray-700">{dept.head}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                  <div className="flex items-center gap-1.5">
                    <Avatar name={dept.successor} size="sm" />
                    <span className="text-xs font-medium text-gray-700">{dept.successor}</span>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
              </div>

              <div className="mt-4">
                <Button variant="outline" size="sm" className="w-full" onClick={() => setConfigModal(dept)}>
                  Configure Succession
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Succession config modal */}
      <Modal isOpen={!!configModal} onClose={() => setConfigModal(null)} title={`Succession Plan - ${configModal?.department || ''}`} size="xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfigModal(null)}>Close</Button>
            <Button onClick={() => { setConfigModal(null); toast.success('Succession plan updated'); }}>Save Changes</Button>
          </>
        }
      >
        {configModal && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-600">
                    <th className="px-4 py-2.5 text-left font-medium">Role</th>
                    <th className="px-4 py-2.5 text-left font-medium">Current</th>
                    <th className="px-4 py-2.5 text-left font-medium">Backup / Successor</th>
                    <th className="px-4 py-2.5 text-center font-medium">Ready</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {configModal.roles.map((role) => (
                    <tr key={role.role} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{role.role}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={role.current} size="sm" />
                          <span className="text-gray-700">{role.current}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {role.backup ? (
                          <div className="flex items-center gap-2">
                            <Avatar name={role.backup} size="sm" />
                            <span className="text-gray-700">{role.backup}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-red-500 italic flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Not assigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {role.ready ? (
                          <span className="inline-flex items-center gap-1 text-green-600"><CheckCircle2 className="h-4 w-4" /></span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-500"><XCircle className="h-4 w-4" /></span>
                        )}
                      </td>
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

// ════════════════════════════════════════════════════════════════
// TAB 5: TRANSITION HISTORY
// ════════════════════════════════════════════════════════════════

function TransitionHistoryTab() {
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailModal, setDetailModal] = useState<TransitionRecord | null>(null);

  const filtered = useMemo(() => {
    let list = TRANSITION_HISTORY;
    if (deptFilter !== 'all') list = list.filter((r) => r.department === deptFilter);
    if (statusFilter !== 'all') list = list.filter((r) => r.status === statusFilter);
    return list;
  }, [deptFilter, statusFilter]);

  const statusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge variant="green">Completed</Badge>;
      case 'partial': return <Badge variant="yellow">Partial</Badge>;
      case 'issues': return <Badge variant="red">Issues</Badge>;
      default: return <Badge variant="gray">{status}</Badge>;
    }
  };

  const totalReassigned = TRANSITION_HISTORY.reduce((sum, r) => sum + r.tasksReassigned, 0);
  const successRate = Math.round((TRANSITION_HISTORY.filter((r) => r.status === 'completed').length / TRANSITION_HISTORY.length) * 100);

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><History className="h-5 w-5 text-blue-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{TRANSITION_HISTORY.length}</p><p className="text-xs text-gray-500">Total Transitions</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center"><CheckCircle2 className="h-5 w-5 text-green-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{successRate}%</p><p className="text-xs text-gray-500">Success Rate</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center"><RefreshCw className="h-5 w-5 text-purple-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{totalReassigned}</p><p className="text-xs text-gray-500">Tasks Reassigned</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
            <div><p className="text-2xl font-bold text-gray-900">{TRANSITION_HISTORY.filter((r) => r.status === 'issues').length}</p><p className="text-xs text-gray-500">With Issues</p></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500">
          <option value="all">All Departments</option>
          {DEPARTMENTS.map((d) => (<option key={d} value={d}>{d}</option>))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500">
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="partial">Partial</option>
          <option value="issues">Issues</option>
        </select>
      </div>

      {/* History table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Departing Employee</th>
                <th className="px-4 py-3 text-left font-medium">Department</th>
                <th className="px-4 py-3 text-center font-medium">Tasks</th>
                <th className="px-4 py-3 text-left font-medium">Reassigned To</th>
                <th className="px-4 py-3 text-left font-medium">Done By</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((record) => (
                <tr key={record.id} className={`hover:bg-gray-50 ${record.status === 'issues' ? 'bg-red-50/30' : ''}`}>
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">{record.date}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={record.departingEmployee} size="sm" />
                      <span className="font-medium text-gray-900">{record.departingEmployee}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{record.department}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs">{record.tasksReassigned}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex -space-x-2">
                      {record.reassignedTo.map((name) => (
                        <div key={name} title={name}><Avatar name={name} size="sm" /></div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{record.doneBy}</td>
                  <td className="px-4 py-3 text-center">{statusBadge(record.status)}</td>
                  <td className="px-4 py-3 text-center">
                    <Button variant="ghost" size="sm" onClick={() => setDetailModal(record)} icon={<Eye className="h-4 w-4" />}>Details</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      <Modal isOpen={!!detailModal} onClose={() => setDetailModal(null)} title="Transition Details" size="lg">
        {detailModal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Departing Employee</p>
                <div className="flex items-center gap-2 mt-1">
                  <Avatar name={detailModal.departingEmployee} size="sm" />
                  <p className="font-medium text-gray-900">{detailModal.departingEmployee}</p>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Date</p>
                <p className="font-medium text-gray-900 mt-1">{detailModal.date}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Department</p>
                <p className="font-medium text-gray-900 mt-1">{detailModal.department}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Tasks Reassigned</p>
                <p className="font-medium text-gray-900 mt-1">{detailModal.tasksReassigned}</p>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-2">Reassigned To</p>
              <div className="flex flex-wrap gap-2">
                {detailModal.reassignedTo.map((name) => (
                  <div key={name} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200">
                    <Avatar name={name} size="sm" />
                    <span className="text-sm font-medium text-gray-700">{name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Notes</p>
              <p className="text-sm text-gray-700 mt-1">{detailModal.notes}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Status</p>
              <div className="mt-1">{statusBadge(detailModal.status)}</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'offboarding', label: 'Offboarding', icon: UserMinus },
  { key: 'backup', label: 'Backup Config', icon: Shield },
  { key: 'crosstraining', label: 'Cross-Training', icon: GraduationCap },
  { key: 'succession', label: 'Succession', icon: Award },
  { key: 'history', label: 'Audit History', icon: History },
];

export default function WorkforcePlanningPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('offboarding');

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            Workforce Continuity & Planning
          </h1>
          <p className="text-sm text-gray-500 mt-1 ml-[52px]">
            Manage employee transitions, backups, cross-training, and succession planning
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<Download className="h-4 w-4" />}>Export Report</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <TabButton
            key={tab.key}
            active={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            icon={tab.icon}
            label={tab.label}
          />
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'offboarding' && <OffboardingTab />}
        {activeTab === 'backup' && <BackupTab />}
        {activeTab === 'crosstraining' && <CrossTrainingTab />}
        {activeTab === 'succession' && <SuccessionTab />}
        {activeTab === 'history' && <TransitionHistoryTab />}
      </div>
    </div>
  );
}
