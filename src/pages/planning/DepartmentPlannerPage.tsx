import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ClipboardList,
  UserCheck,
  UserX,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  GripVertical,
  Wand2,
  Layers,
  Wrench,
  Activity,
  X,
  Clock,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Zap,
  Play,
  Pause,
  Settings,
  User,
  Target,
  Award,
  TrendingUp,
  ArrowRight,
  PackageCheck,
  Timer,
} from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Loader from '../../components/ui/Loader';
import { get } from '../../services/api';
import { formatDate } from '../../utils/formatters';
import type { Department, Instrument } from '../../types';

// ─── Local Types ────────────────────────────────────────

interface Analyst {
  id: string;
  name: string;
  assignedTests: number;
  inProgress: number;
  completedToday: number;
  completedWeek: number;
  specializations: string[];
  maxCapacity: number;
}

interface WorkPlanItem {
  id: string;
  priority: string;
  sampleCode: string;
  clientName: string;
  testName: string;
  assignedTo: string;
  dueDate: string;
  status: string;
}

interface BatchGroup {
  testName: string;
  pendingCount: number;
  suggestedBatchSize: number;
  samples: string[];
}

interface AutoAssignment {
  testName: string;
  sampleCode: string;
  suggestedAnalyst: string;
  reason: string;
  matchScore: number;
}

interface InstrumentSchedule extends Instrument {
  currentTest?: string;
  nextAvailable?: string;
  utilizationPct?: number;
}

// ─── Mock / Fallback Data ───────────────────────────────

const mockDepartments: { value: string; label: string }[] = [
  { value: '1', label: 'HPLC' },
  { value: '2', label: 'Microbiology' },
  { value: '3', label: 'ICPMS' },
  { value: '4', label: 'Water Testing' },
  { value: '5', label: 'Food Analysis' },
  { value: '6', label: 'GC' },
];

const mockAnalysts: Record<string, Analyst[]> = {
  '1': [
    { id: 'a1', name: 'Dr. Priya Sharma', assignedTests: 8, inProgress: 3, completedToday: 4, completedWeek: 22, specializations: ['Assay by HPLC', 'Content Uniformity', 'Dissolution Test'], maxCapacity: 12 },
    { id: 'a2', name: 'Rahul Verma', assignedTests: 6, inProgress: 2, completedToday: 3, completedWeek: 18, specializations: ['Related Substances', 'Assay by HPLC'], maxCapacity: 10 },
    { id: 'a3', name: 'Sneha Patel', assignedTests: 12, inProgress: 5, completedToday: 2, completedWeek: 15, specializations: ['Dissolution Test', 'Content Uniformity'], maxCapacity: 14 },
    { id: 'a4', name: 'Amit Kumar', assignedTests: 4, inProgress: 1, completedToday: 1, completedWeek: 10, specializations: ['Assay by HPLC', 'Related Substances'], maxCapacity: 10 },
  ],
  '2': [
    { id: 'a5', name: 'Dr. Anita Rao', assignedTests: 9, inProgress: 4, completedToday: 3, completedWeek: 20, specializations: ['Microbial Limit Test', 'Sterility Test'], maxCapacity: 12 },
    { id: 'a6', name: 'Vikram Singh', assignedTests: 5, inProgress: 2, completedToday: 2, completedWeek: 14, specializations: ['Total Plate Count', 'Microbial Limit Test'], maxCapacity: 10 },
    { id: 'a7', name: 'Meera Iyer', assignedTests: 7, inProgress: 3, completedToday: 1, completedWeek: 12, specializations: ['Sterility Test', 'Total Plate Count'], maxCapacity: 10 },
  ],
  '3': [
    { id: 'a8', name: 'Karthik Nair', assignedTests: 4, inProgress: 2, completedToday: 2, completedWeek: 13, specializations: ['Elemental Impurities', 'Heavy Metals by ICP'], maxCapacity: 8 },
    { id: 'a9', name: 'Deepa Menon', assignedTests: 3, inProgress: 1, completedToday: 1, completedWeek: 9, specializations: ['Heavy Metals by ICP', 'Elemental Impurities'], maxCapacity: 8 },
  ],
  '4': [
    { id: 'a10', name: 'Suresh Reddy', assignedTests: 11, inProgress: 5, completedToday: 4, completedWeek: 25, specializations: ['Heavy Metals in Water', 'BOD/COD Analysis'], maxCapacity: 14 },
    { id: 'a11', name: 'Lakshmi Devi', assignedTests: 8, inProgress: 3, completedToday: 3, completedWeek: 19, specializations: ['BOD/COD Analysis', 'Microbial Water Test'], maxCapacity: 12 },
    { id: 'a12', name: 'Ravi Teja', assignedTests: 6, inProgress: 2, completedToday: 2, completedWeek: 16, specializations: ['Microbial Water Test', 'Heavy Metals in Water'], maxCapacity: 10 },
  ],
  '5': [
    { id: 'a13', name: 'Pooja Gupta', assignedTests: 7, inProgress: 3, completedToday: 2, completedWeek: 17, specializations: ['Pesticide Residue', 'Nutritional Analysis'], maxCapacity: 10 },
    { id: 'a14', name: 'Sanjay Mishra', assignedTests: 5, inProgress: 2, completedToday: 3, completedWeek: 15, specializations: ['Nutritional Analysis', 'Pesticide Residue'], maxCapacity: 10 },
  ],
  '6': [
    { id: 'a15', name: 'Nitin Joshi', assignedTests: 3, inProgress: 1, completedToday: 1, completedWeek: 8, specializations: ['Residual Solvents', 'GC Headspace'], maxCapacity: 8 },
    { id: 'a16', name: 'Kavita Das', assignedTests: 2, inProgress: 1, completedToday: 0, completedWeek: 6, specializations: ['GC Headspace', 'Residual Solvents'], maxCapacity: 8 },
  ],
};

const mockInstruments: Record<string, InstrumentSchedule[]> = {
  '1': [
    { id: 'i1', name: 'Agilent 1260 HPLC', code: 'HPLC-001', departmentId: '1', departmentName: 'HPLC', model: '1260 Infinity II', manufacturer: 'Agilent', serialNumber: 'DE12345', calibrationDueDate: '2026-04-15', status: 'active', isActive: true, createdAt: '', updatedAt: '', currentTest: 'Assay by HPLC (SMP-2026-00142)', nextAvailable: '14:30', utilizationPct: 85 },
    { id: 'i2', name: 'Waters Alliance HPLC', code: 'HPLC-002', departmentId: '1', departmentName: 'HPLC', model: 'e2695', manufacturer: 'Waters', serialNumber: 'WA98765', calibrationDueDate: '2026-03-25', status: 'calibration_due', isActive: true, createdAt: '', updatedAt: '', currentTest: '', nextAvailable: 'After calibration', utilizationPct: 0 },
    { id: 'i3', name: 'Shimadzu UHPLC', code: 'HPLC-003', departmentId: '1', departmentName: 'HPLC', model: 'Nexera X2', manufacturer: 'Shimadzu', serialNumber: 'SH54321', calibrationDueDate: '2026-05-10', status: 'active', isActive: true, createdAt: '', updatedAt: '', currentTest: 'Related Substances (SMP-2026-00140)', nextAvailable: '16:00', utilizationPct: 72 },
  ],
  '2': [
    { id: 'i4', name: 'Laminar Air Flow', code: 'MIC-001', departmentId: '2', departmentName: 'Microbiology', status: 'active', isActive: true, createdAt: '', updatedAt: '', currentTest: 'Microbial Limit (SMP-2026-00138)', nextAvailable: '11:00', utilizationPct: 90 },
    { id: 'i5', name: 'Autoclave', code: 'MIC-002', departmentId: '2', departmentName: 'Microbiology', status: 'maintenance', isActive: true, createdAt: '', updatedAt: '', currentTest: '', nextAvailable: 'Under maintenance', utilizationPct: 0 },
    { id: 'i6', name: 'Colony Counter', code: 'MIC-003', departmentId: '2', departmentName: 'Microbiology', calibrationDueDate: '2026-03-26', status: 'active', isActive: true, createdAt: '', updatedAt: '', currentTest: '', nextAvailable: 'Now', utilizationPct: 30 },
  ],
  '3': [
    { id: 'i7', name: 'Agilent 7900 ICP-MS', code: 'ICP-001', departmentId: '3', departmentName: 'ICPMS', status: 'active', isActive: true, createdAt: '', updatedAt: '', currentTest: 'Elemental Impurities (SMP-2026-00136)', nextAvailable: '15:30', utilizationPct: 78 },
    { id: 'i8', name: 'PerkinElmer NexION', code: 'ICP-002', departmentId: '3', departmentName: 'ICPMS', calibrationDueDate: '2026-04-01', status: 'active', isActive: true, createdAt: '', updatedAt: '', currentTest: '', nextAvailable: 'Now', utilizationPct: 25 },
  ],
  '4': [
    { id: 'i9', name: 'Spectrophotometer UV-Vis', code: 'WAT-001', departmentId: '4', departmentName: 'Water Testing', status: 'active', isActive: true, createdAt: '', updatedAt: '', currentTest: 'BOD/COD Analysis (SMP-2026-00128)', nextAvailable: '13:00', utilizationPct: 65 },
    { id: 'i10', name: 'Turbidity Meter', code: 'WAT-002', departmentId: '4', departmentName: 'Water Testing', status: 'active', isActive: true, createdAt: '', updatedAt: '', currentTest: '', nextAvailable: 'Now', utilizationPct: 40 },
    { id: 'i11', name: 'pH Meter', code: 'WAT-003', departmentId: '4', departmentName: 'Water Testing', calibrationDueDate: '2026-03-24', status: 'calibration_due', isActive: true, createdAt: '', updatedAt: '', currentTest: '', nextAvailable: 'After calibration', utilizationPct: 0 },
  ],
  '5': [
    { id: 'i12', name: 'FSSAI Texture Analyzer', code: 'FD-001', departmentId: '5', departmentName: 'Food Analysis', status: 'active', isActive: true, createdAt: '', updatedAt: '', currentTest: 'Pesticide Residue (SMP-2026-00139)', nextAvailable: '17:00', utilizationPct: 80 },
    { id: 'i13', name: 'Kjeldahl Apparatus', code: 'FD-002', departmentId: '5', departmentName: 'Food Analysis', status: 'active', isActive: true, createdAt: '', updatedAt: '', currentTest: '', nextAvailable: 'Now', utilizationPct: 20 },
  ],
  '6': [
    { id: 'i14', name: 'Agilent 7890B GC', code: 'GC-001', departmentId: '6', departmentName: 'GC', status: 'active', isActive: true, createdAt: '', updatedAt: '', currentTest: '', nextAvailable: 'Now', utilizationPct: 15 },
    { id: 'i15', name: 'Shimadzu GC-2030', code: 'GC-002', departmentId: '6', departmentName: 'GC', status: 'maintenance', isActive: true, createdAt: '', updatedAt: '', currentTest: '', nextAvailable: 'Under maintenance', utilizationPct: 0 },
  ],
};

const mockWorkPlan: Record<string, WorkPlanItem[]> = {
  '1': [
    { id: 'w1', priority: 'CRITICAL', sampleCode: 'SMP-2026-00142', clientName: 'PharmaCo Ltd', testName: 'Assay by HPLC', assignedTo: 'Dr. Priya Sharma', dueDate: '2026-03-24', status: 'IN_PROGRESS' },
    { id: 'w2', priority: 'URGENT', sampleCode: 'SMP-2026-00140', clientName: 'GreenHerbs Pvt', testName: 'Related Substances', assignedTo: 'Rahul Verma', dueDate: '2026-03-25', status: 'PENDING' },
    { id: 'w3', priority: 'NORMAL', sampleCode: 'SMP-2026-00137', clientName: 'PharmaCo Ltd', testName: 'Dissolution Test', assignedTo: 'Sneha Patel', dueDate: '2026-03-26', status: 'PENDING' },
    { id: 'w4', priority: 'URGENT', sampleCode: 'SMP-2026-00135', clientName: 'CosmoBeauty', testName: 'Content Uniformity', assignedTo: '', dueDate: '2026-03-24', status: 'PENDING' },
    { id: 'w5', priority: 'NORMAL', sampleCode: 'SMP-2026-00133', clientName: 'NutriFoods', testName: 'Assay by HPLC', assignedTo: 'Amit Kumar', dueDate: '2026-03-27', status: 'PENDING' },
    { id: 'w6', priority: 'NORMAL', sampleCode: 'SMP-2026-00131', clientName: 'AquaPure Inc', testName: 'Related Substances', assignedTo: '', dueDate: '2026-03-28', status: 'PENDING' },
    { id: 'w19', priority: 'NORMAL', sampleCode: 'SMP-2026-00143', clientName: 'PharmaCo Ltd', testName: 'Assay by HPLC', assignedTo: '', dueDate: '2026-03-29', status: 'PENDING' },
  ],
  '2': [
    { id: 'w7', priority: 'URGENT', sampleCode: 'SMP-2026-00138', clientName: 'CosmoBeauty', testName: 'Microbial Limit Test', assignedTo: 'Dr. Anita Rao', dueDate: '2026-03-25', status: 'IN_PROGRESS' },
    { id: 'w8', priority: 'NORMAL', sampleCode: 'SMP-2026-00134', clientName: 'NutriFoods', testName: 'Total Plate Count', assignedTo: 'Vikram Singh', dueDate: '2026-03-26', status: 'PENDING' },
    { id: 'w9', priority: 'CRITICAL', sampleCode: 'SMP-2026-00130', clientName: 'FoodSafe Corp', testName: 'Sterility Test', assignedTo: '', dueDate: '2026-03-24', status: 'PENDING' },
  ],
  '3': [
    { id: 'w10', priority: 'URGENT', sampleCode: 'SMP-2026-00136', clientName: 'EnviroTest LLC', testName: 'Elemental Impurities', assignedTo: 'Karthik Nair', dueDate: '2026-03-25', status: 'IN_PROGRESS' },
    { id: 'w11', priority: 'NORMAL', sampleCode: 'SMP-2026-00129', clientName: 'PharmaCo Ltd', testName: 'Heavy Metals by ICP', assignedTo: 'Deepa Menon', dueDate: '2026-03-27', status: 'PENDING' },
  ],
  '4': [
    { id: 'w12', priority: 'URGENT', sampleCode: 'SMP-2026-00141', clientName: 'AquaPure Inc', testName: 'Heavy Metals in Water', assignedTo: 'Suresh Reddy', dueDate: '2026-03-24', status: 'PENDING' },
    { id: 'w13', priority: 'NORMAL', sampleCode: 'SMP-2026-00128', clientName: 'EnviroTest LLC', testName: 'BOD/COD Analysis', assignedTo: 'Lakshmi Devi', dueDate: '2026-03-26', status: 'IN_PROGRESS' },
    { id: 'w14', priority: 'NORMAL', sampleCode: 'SMP-2026-00127', clientName: 'AquaPure Inc', testName: 'Microbial Water Test', assignedTo: '', dueDate: '2026-03-27', status: 'PENDING' },
  ],
  '5': [
    { id: 'w15', priority: 'CRITICAL', sampleCode: 'SMP-2026-00139', clientName: 'FoodSafe Corp', testName: 'Pesticide Residue', assignedTo: 'Pooja Gupta', dueDate: '2026-03-23', status: 'IN_PROGRESS' },
    { id: 'w16', priority: 'NORMAL', sampleCode: 'SMP-2026-00126', clientName: 'NutriFoods', testName: 'Nutritional Analysis', assignedTo: 'Sanjay Mishra', dueDate: '2026-03-26', status: 'PENDING' },
  ],
  '6': [
    { id: 'w17', priority: 'NORMAL', sampleCode: 'SMP-2026-00125', clientName: 'GreenHerbs Pvt', testName: 'Residual Solvents', assignedTo: 'Nitin Joshi', dueDate: '2026-03-27', status: 'PENDING' },
    { id: 'w18', priority: 'NORMAL', sampleCode: 'SMP-2026-00124', clientName: 'PharmaCo Ltd', testName: 'GC Headspace', assignedTo: '', dueDate: '2026-03-28', status: 'PENDING' },
  ],
};

// ─── Helpers ────────────────────────────────────────────

const priorityOrder: Record<string, number> = { CRITICAL: 0, URGENT: 1, NORMAL: 2 };

const priorityBadge: Record<string, { variant: 'blue' | 'orange' | 'red'; label: string }> = {
  NORMAL: { variant: 'blue', label: 'Normal' },
  URGENT: { variant: 'orange', label: 'Urgent' },
  CRITICAL: { variant: 'red', label: 'Critical' },
};

const statusBadge: Record<string, { variant: 'blue' | 'green' | 'yellow' | 'orange' | 'gray' | 'purple' | 'cyan'; label: string }> = {
  PENDING: { variant: 'yellow', label: 'Pending' },
  IN_PROGRESS: { variant: 'blue', label: 'In Progress' },
  COMPLETED: { variant: 'green', label: 'Completed' },
};

function getLoadPercent(analyst: Analyst): number {
  return Math.round((analyst.assignedTests / analyst.maxCapacity) * 100);
}

function getLoadColor(pct: number): string {
  if (pct < 50) return 'bg-green-500';
  if (pct <= 75) return 'bg-blue-500';
  if (pct <= 90) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getLoadBgColor(pct: number): string {
  if (pct < 50) return 'bg-green-50 border-green-200';
  if (pct <= 75) return 'bg-blue-50 border-blue-200';
  if (pct <= 90) return 'bg-yellow-50 border-yellow-200';
  return 'bg-red-50 border-red-200';
}

function getLoadBadgeVariant(pct: number): 'green' | 'blue' | 'yellow' | 'red' {
  if (pct < 50) return 'green';
  if (pct <= 75) return 'blue';
  if (pct <= 90) return 'yellow';
  return 'red';
}

function getInstrumentStatusBadge(status: string): { variant: 'green' | 'yellow' | 'orange' | 'red' | 'gray'; label: string } {
  switch (status) {
    case 'active': return { variant: 'green', label: 'Active' };
    case 'maintenance': return { variant: 'orange', label: 'Maintenance' };
    case 'calibration_due': return { variant: 'yellow', label: 'Calibration Due' };
    case 'out_of_service': return { variant: 'red', label: 'Out of Service' };
    default: return { variant: 'gray', label: status };
  }
}

function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date(new Date().toDateString());
}

function isDueToday(dueDate: string): boolean {
  return dueDate === new Date().toISOString().split('T')[0];
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
    'bg-teal-500', 'bg-pink-500', 'bg-indigo-500', 'bg-cyan-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getUtilBarColor(pct: number): string {
  if (pct <= 0) return 'bg-gray-300';
  if (pct < 40) return 'bg-green-400';
  if (pct < 70) return 'bg-blue-500';
  if (pct < 90) return 'bg-yellow-500';
  return 'bg-red-500';
}

// ─── Component ──────────────────────────────────────────

export default function DepartmentPlannerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialDept = searchParams.get('dept') || '1';
  const [selectedDept, setSelectedDept] = useState(initialDept);
  const [autoAssignOpen, setAutoAssignOpen] = useState(false);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<BatchGroup | null>(null);
  const [expandedAnalyst, setExpandedAnalyst] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'priority' | 'dueDate' | 'status'>('priority');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Fetch departments from API
  const { data: departmentsRaw } = useQuery<{ data?: Department[] } | Department[]>({
    queryKey: ['departments'],
    queryFn: () => get('/departments'),
    retry: false,
  });

  // Fetch instruments for selected department
  const { data: instrumentsRaw } = useQuery<{ data?: Instrument[] } | Instrument[]>({
    queryKey: ['instruments', selectedDept],
    queryFn: () => get(`/instruments?departmentId=${selectedDept}`),
    retry: false,
    enabled: !!selectedDept,
  });

  // Build department options from API or fallback
  const departmentOptions = useMemo(() => {
    if (departmentsRaw) {
      const depts = Array.isArray(departmentsRaw)
        ? departmentsRaw
        : (departmentsRaw as { data?: Department[] }).data || [];
      if (depts.length > 0) {
        return depts.map((d: Department) => ({ value: d.id, label: d.name }));
      }
    }
    return mockDepartments;
  }, [departmentsRaw]);

  // Instruments for selected department (use mock with extended fields)
  const instruments = useMemo<InstrumentSchedule[]>(() => {
    return mockInstruments[selectedDept] || [];
  }, [selectedDept]);

  // Analysts for department
  const analysts = mockAnalysts[selectedDept] || [];

  // Work plan items with sorting
  const workPlan = useMemo(() => {
    const items = mockWorkPlan[selectedDept] || [];
    return [...items].sort((a, b) => {
      if (sortField === 'priority') {
        const pDiff = (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99);
        if (pDiff !== 0) return sortDir === 'asc' ? pDiff : -pDiff;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortField === 'dueDate') {
        const diff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        return sortDir === 'asc' ? diff : -diff;
      }
      if (sortField === 'status') {
        const statusOrder: Record<string, number> = { IN_PROGRESS: 0, PENDING: 1, COMPLETED: 2 };
        const diff = (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
        return sortDir === 'asc' ? diff : -diff;
      }
      return 0;
    });
  }, [selectedDept, sortField, sortDir]);

  // Workload summary
  const totalPending = workPlan.filter((w) => w.status === 'PENDING').length;
  const totalInProgress = workPlan.filter((w) => w.status === 'IN_PROGRESS').length;
  const totalAssigned = workPlan.filter((w) => w.assignedTo).length;
  const totalUnassigned = workPlan.filter((w) => !w.assignedTo).length;
  const totalOverdue = workPlan.filter((w) => isOverdue(w.dueDate) && w.status !== 'COMPLETED').length;
  const totalDueToday = workPlan.filter(
    (w) => isDueToday(w.dueDate) && w.status !== 'COMPLETED',
  ).length;
  const completedThisWeek = analysts.reduce((s, a) => s + a.completedWeek, 0);
  const avgTAT = analysts.length > 0
    ? (analysts.reduce((s, a) => s + (a.completedWeek > 0 ? 2.8 + Math.random() * 1.5 : 0), 0) / analysts.length).toFixed(1)
    : '0';

  // Batch planning groups
  const batchGroups = useMemo<BatchGroup[]>(() => {
    const pendingItems = workPlan.filter((w) => w.status === 'PENDING');
    const groups: Record<string, { count: number; samples: string[] }> = {};
    for (const item of pendingItems) {
      if (!groups[item.testName]) {
        groups[item.testName] = { count: 0, samples: [] };
      }
      groups[item.testName].count += 1;
      groups[item.testName].samples.push(item.sampleCode);
    }
    return Object.entries(groups)
      .map(([testName, data]) => ({
        testName,
        pendingCount: data.count,
        suggestedBatchSize: Math.min(data.count, Math.max(3, Math.ceil(data.count / 2))),
        samples: data.samples,
      }))
      .sort((a, b) => b.pendingCount - a.pendingCount);
  }, [workPlan]);

  // Auto-assign suggestions with expertise matching
  const autoAssignSuggestions = useMemo<AutoAssignment[]>(() => {
    const unassigned = workPlan.filter((w) => !w.assignedTo && w.status === 'PENDING');
    if (unassigned.length === 0 || analysts.length === 0) return [];

    return unassigned.map((item) => {
      // Score each analyst
      const scored = analysts.map((a) => {
        let score = 0;
        const loadPct = getLoadPercent(a);
        // Lower load = higher score (max 40)
        score += Math.max(0, 40 - (loadPct * 0.4));
        // Specialization match (50 points)
        if (a.specializations.includes(item.testName)) {
          score += 50;
        }
        // Capacity available (10 points)
        if (a.assignedTests < a.maxCapacity) {
          score += 10;
        }
        return { analyst: a, score };
      });

      const best = scored.sort((a, b) => b.score - a.score)[0];
      const hasExpertise = best.analyst.specializations.includes(item.testName);
      const loadPct = getLoadPercent(best.analyst);

      let reason = '';
      if (hasExpertise && loadPct < 75) {
        reason = `Expert in ${item.testName}, load at ${loadPct}%`;
      } else if (hasExpertise) {
        reason = `Expert match (load: ${loadPct}%)`;
      } else {
        reason = `Lowest load at ${loadPct}%`;
      }

      return {
        testName: item.testName,
        sampleCode: item.sampleCode,
        suggestedAnalyst: best.analyst.name,
        reason,
        matchScore: Math.round(best.score),
      };
    });
  }, [workPlan, analysts]);

  const handleDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDept(e.target.value);
    setSearchParams({ dept: e.target.value });
    setExpandedAnalyst(null);
  };

  const handleSort = (field: 'priority' | 'dueDate' | 'status') => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-gray-400" />;
    return sortDir === 'asc'
      ? <ChevronUp className="h-3 w-3 text-blue-600" />
      : <ChevronDown className="h-3 w-3 text-blue-600" />;
  };

  const deptLabel = departmentOptions.find((d) => d.value === selectedDept)?.label || 'Department';

  // Get tasks for expanded analyst
  const getAnalystTasks = useCallback(
    (analystName: string) => workPlan.filter((w) => w.assignedTo === analystName),
    [workPlan],
  );

  return (
    <div className="space-y-6">
      {/* ─── Header with Department Selector ───────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Department Planner</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage workload, scheduling, and assignments for {deptLabel}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {totalOverdue > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-semibold text-red-700">{totalOverdue} Overdue</span>
            </div>
          )}
          <div className="w-full sm:w-56">
            <Select
              label=""
              options={departmentOptions}
              value={selectedDept}
              onChange={handleDeptChange}
            />
          </div>
        </div>
      </div>

      {/* ─── Workload Summary Cards ────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard
          icon={<ClipboardList className="h-5 w-5" />}
          label="Total Pending"
          value={totalPending}
          color="yellow"
        />
        <StatCard
          icon={<UserCheck className="h-5 w-5" />}
          label="Assigned"
          value={totalAssigned}
          color="blue"
        />
        <StatCard
          icon={<UserX className="h-5 w-5" />}
          label="Unassigned"
          value={totalUnassigned}
          color={totalUnassigned > 0 ? 'orange' : 'green'}
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Overdue"
          value={totalOverdue}
          color={totalOverdue > 0 ? 'red' : 'green'}
        />
        <StatCard
          icon={<CalendarClock className="h-5 w-5" />}
          label="Due Today"
          value={totalDueToday}
          color="purple"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Completed (Week)"
          value={completedThisWeek}
          color="green"
        />
        <StatCard
          icon={<Timer className="h-5 w-5" />}
          label="Avg TAT (days)"
          value={avgTAT}
          color="teal"
        />
      </div>

      {/* ─── Analyst Workload + Instrument Schedule (side by side) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Analyst Workload Distribution */}
        <Card
          title="Analyst Workload Distribution"
          subtitle={`${analysts.length} analysts in ${deptLabel} -- click to expand`}
        >
          {analysts.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No analysts data available</p>
          ) : (
            <div className="space-y-3">
              {analysts.map((analyst) => {
                const loadPct = getLoadPercent(analyst);
                const isExpanded = expandedAnalyst === analyst.id;
                const tasks = isExpanded ? getAnalystTasks(analyst.name) : [];

                return (
                  <div key={analyst.id} className="rounded-xl overflow-hidden border border-gray-100 transition-all">
                    {/* Analyst card header */}
                    <div
                      className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${isExpanded ? 'bg-gray-50' : ''}`}
                      onClick={() => setExpandedAnalyst(isExpanded ? null : analyst.id)}
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className={`w-10 h-10 rounded-full ${getAvatarColor(analyst.name)} text-white flex items-center justify-center text-sm font-bold flex-shrink-0`}>
                          {getInitials(analyst.name)}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-gray-900 truncate">{analyst.name}</span>
                            <Badge variant={getLoadBadgeVariant(loadPct)}>
                              {loadPct}% load
                            </Badge>
                          </div>

                          {/* Stat chips */}
                          <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                            <span className="flex items-center gap-1">
                              <ClipboardList className="h-3 w-3" /> {analyst.assignedTests} assigned
                            </span>
                            <span className="flex items-center gap-1">
                              <Activity className="h-3 w-3 text-blue-500" /> {analyst.inProgress} active
                            </span>
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-green-500" /> {analyst.completedToday} today
                            </span>
                          </div>

                          {/* Load bar */}
                          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${getLoadColor(loadPct)}`}
                              style={{ width: `${Math.min(100, loadPct)}%` }}
                            />
                          </div>
                        </div>

                        {/* Expand icon */}
                        <div className="flex-shrink-0">
                          {isExpanded
                            ? <ChevronUp className="h-4 w-4 text-gray-400" />
                            : <ChevronDown className="h-4 w-4 text-gray-400" />
                          }
                        </div>
                      </div>

                      {/* Specializations */}
                      {analyst.specializations.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2 ml-[52px]">
                          {analyst.specializations.map((spec) => (
                            <span key={spec} className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded font-medium">
                              {spec}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Expanded task list */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-white">
                        {tasks.length === 0 ? (
                          <p className="text-xs text-gray-400 text-center py-3">No tasks assigned</p>
                        ) : (
                          <div className="divide-y divide-gray-50">
                            {tasks.map((t) => (
                              <div key={t.id} className="px-4 py-2.5 flex items-center gap-3 text-xs">
                                <Badge variant={priorityBadge[t.priority]?.variant || 'blue'}>
                                  {t.priority}
                                </Badge>
                                <span className="font-semibold text-blue-600">{t.sampleCode}</span>
                                <span className="text-gray-600 truncate flex-1">{t.testName}</span>
                                <span className={isOverdue(t.dueDate) ? 'text-red-600 font-bold' : 'text-gray-500'}>
                                  {formatDate(t.dueDate)}
                                </span>
                                <Badge variant={statusBadge[t.status]?.variant || 'gray'}>
                                  {statusBadge[t.status]?.label || t.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Instrument Schedule */}
        <Card
          title="Instrument Schedule"
          subtitle={`${instruments.length} instruments in ${deptLabel}`}
          noPadding
        >
          {instruments.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-gray-500">
              No instruments data available
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {instruments.map((inst) => {
                const isBadge = getInstrumentStatusBadge(inst.status);
                const calDue = inst.calibrationDueDate;
                const calSoon = calDue && new Date(calDue) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
                const isRunning = inst.currentTest && inst.status === 'active';

                return (
                  <div
                    key={inst.id}
                    className={`px-5 py-4 transition-colors ${
                      inst.status === 'maintenance' ? 'bg-orange-50/50' :
                      inst.status === 'calibration_due' ? 'bg-yellow-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{inst.name}</span>
                          <Badge variant={isBadge.variant}>{isBadge.label}</Badge>
                        </div>
                        <span className="text-xs text-gray-400">{inst.code}</span>
                      </div>
                      {isRunning && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                          </span>
                          Running
                        </div>
                      )}
                    </div>

                    {/* Current test */}
                    {inst.currentTest ? (
                      <div className="text-xs text-gray-600 mb-2 flex items-center gap-1.5">
                        <Play className="h-3 w-3 text-green-500 flex-shrink-0" />
                        <span className="truncate">{inst.currentTest}</span>
                      </div>
                    ) : inst.status === 'active' ? (
                      <div className="text-xs text-gray-400 mb-2 flex items-center gap-1.5">
                        <Pause className="h-3 w-3 flex-shrink-0" />
                        <span>Idle - Ready for use</span>
                      </div>
                    ) : inst.status === 'maintenance' ? (
                      <div className="text-xs text-orange-600 mb-2 flex items-center gap-1.5">
                        <Wrench className="h-3 w-3 flex-shrink-0" />
                        <span>Under scheduled maintenance</span>
                      </div>
                    ) : (
                      <div className="text-xs text-yellow-600 mb-2 flex items-center gap-1.5">
                        <Settings className="h-3 w-3 flex-shrink-0" />
                        <span>Calibration required before use</span>
                      </div>
                    )}

                    {/* Bottom row */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-4">
                        <span className="text-gray-500">
                          Next available: <span className="font-medium text-gray-700">{inst.nextAvailable || 'N/A'}</span>
                        </span>
                        {calDue && (
                          <span className={calSoon ? 'text-orange-600 font-medium' : 'text-gray-500'}>
                            Cal due: {formatDate(calDue)}
                            {calSoon && <AlertTriangle className="inline ml-0.5 h-3 w-3 text-orange-500" />}
                          </span>
                        )}
                      </div>
                      {inst.utilizationPct !== undefined && inst.utilizationPct > 0 && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${getUtilBarColor(inst.utilizationPct)}`}
                              style={{ width: `${inst.utilizationPct}%` }}
                            />
                          </div>
                          <span className="text-gray-500">{inst.utilizationPct}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ─── Daily Work Plan ───────────────────────────────── */}
      <Card
        title="Daily Work Plan"
        subtitle={`${workPlan.length} tasks for ${deptLabel} -- click column headers to sort`}
        noPadding
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              icon={<GripVertical className="h-4 w-4" />}
              onClick={() => {
                setSortField('priority');
                setSortDir('asc');
              }}
            >
              Reset Sort
            </Button>
            <Button
              size="sm"
              icon={<Wand2 className="h-4 w-4" />}
              onClick={() => setAutoAssignOpen(true)}
              disabled={autoAssignSuggestions.length === 0}
            >
              Auto-Assign ({autoAssignSuggestions.length})
            </Button>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-3 w-8" />
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-blue-600 select-none"
                  onClick={() => handleSort('priority')}
                >
                  <div className="flex items-center gap-1">
                    Priority <SortIcon field="priority" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sample Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Client</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Test</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Assigned To</th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-blue-600 select-none"
                  onClick={() => handleSort('dueDate')}
                >
                  <div className="flex items-center gap-1">
                    Due Date <SortIcon field="dueDate" />
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:text-blue-600 select-none"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    Status <SortIcon field="status" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {workPlan.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
                    No pending tests for this department
                  </td>
                </tr>
              ) : (
                workPlan.map((item, idx) => {
                  const overdue = isOverdue(item.dueDate) && item.status !== 'COMPLETED';
                  const dueToday = isDueToday(item.dueDate) && item.status !== 'COMPLETED';
                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        overdue
                          ? 'bg-red-50 hover:bg-red-100'
                          : dueToday
                            ? 'bg-amber-50 hover:bg-amber-100'
                            : 'hover:bg-blue-50'
                      }`}
                    >
                      <td className="px-2 py-3 text-center">
                        <GripVertical className="h-4 w-4 text-gray-300 cursor-grab mx-auto" />
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={priorityBadge[item.priority]?.variant || 'blue'}>
                          {item.priority === 'CRITICAL' && <Zap className="h-3 w-3 mr-0.5 inline" />}
                          {priorityBadge[item.priority]?.label || item.priority}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-blue-600">{item.sampleCode}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.clientName}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{item.testName}</td>
                      <td className="px-4 py-3 text-sm">
                        {item.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full ${getAvatarColor(item.assignedTo)} text-white flex items-center justify-center text-[10px] font-bold`}>
                              {getInitials(item.assignedTo)}
                            </div>
                            <span className="text-gray-700">{item.assignedTo}</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-orange-500 font-medium italic">
                            <UserX className="h-3.5 w-3.5" /> Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={overdue ? 'text-red-600 font-bold' : dueToday ? 'text-amber-600 font-semibold' : 'text-gray-700'}>
                          {formatDate(item.dueDate)}
                          {overdue && (
                            <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white">
                              OVERDUE
                            </span>
                          )}
                          {dueToday && !overdue && (
                            <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white">
                              TODAY
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusBadge[item.status]?.variant || 'gray'}>
                          {statusBadge[item.status]?.label || item.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ─── Batch Planning ────────────────────────────────── */}
      <Card
        title="Batch Planning"
        subtitle="Group similar pending tests for efficient batch processing"
        noPadding
        actions={
          batchGroups.length > 0 ? (
            <Badge variant="blue">
              {batchGroups.length} test type{batchGroups.length !== 1 ? 's' : ''} available
            </Badge>
          ) : null
        }
      >
        {batchGroups.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-500">
            No pending tests available for batching
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            {batchGroups.map((group) => (
              <div key={group.testName} className="p-5 hover:bg-blue-50/50 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">{group.testName}</h4>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">{group.pendingCount}</div>
                    <div className="text-[10px] text-gray-500 uppercase">Pending</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300" />
                  <div className="text-center">
                    <div className="text-xl font-bold text-indigo-600">{group.suggestedBatchSize}</div>
                    <div className="text-[10px] text-gray-500 uppercase">Batch Size</div>
                  </div>
                </div>

                {/* Sample codes */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {group.samples.map((s) => (
                    <span key={s} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-mono">
                      {s}
                    </span>
                  ))}
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  icon={<PackageCheck className="h-4 w-4" />}
                  onClick={() => {
                    setSelectedBatch(group);
                    setBatchModalOpen(true);
                  }}
                >
                  Create Batch
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ─── Auto-Assign Modal ─────────────────────────────── */}
      <Modal
        isOpen={autoAssignOpen}
        onClose={() => setAutoAssignOpen(false)}
        title="Smart Auto-Assign Suggestions"
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAutoAssignOpen(false)}>
              Cancel
            </Button>
            <Button
              icon={<Wand2 className="h-4 w-4" />}
              onClick={() => {
                toast.success(
                  `${autoAssignSuggestions.length} test(s) auto-assigned successfully`,
                );
                setAutoAssignOpen(false);
              }}
            >
              Apply All Assignments
            </Button>
          </>
        }
      >
        <div className="mb-4">
          <p className="text-sm text-gray-500">
            Assignments are suggested based on analyst expertise, current workload, and instrument availability.
            Higher match scores indicate better fit.
          </p>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Target className="h-3 w-3 text-indigo-500" /> Expertise match</span>
            <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-green-500" /> Load balanced</span>
            <span className="flex items-center gap-1"><Award className="h-3 w-3 text-yellow-500" /> Score-based ranking</span>
          </div>
        </div>
        {autoAssignSuggestions.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">All tests are already assigned</p>
        ) : (
          <div className="space-y-3">
            {autoAssignSuggestions.map((s, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all"
              >
                {/* Score circle */}
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    s.matchScore >= 80 ? 'bg-green-500' : s.matchScore >= 50 ? 'bg-blue-500' : 'bg-yellow-500'
                  }`}>
                    {s.matchScore}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-blue-600">{s.sampleCode}</span>
                    <span className="text-xs text-gray-400">&middot;</span>
                    <span className="text-sm text-gray-700">{s.testName}</span>
                  </div>
                  <div className="text-xs text-gray-500">{s.reason}</div>
                </div>

                {/* Arrow */}
                <ArrowRight className="h-4 w-4 text-gray-300 flex-shrink-0" />

                {/* Suggested analyst */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full ${getAvatarColor(s.suggestedAnalyst)} text-white flex items-center justify-center text-xs font-bold`}>
                    {getInitials(s.suggestedAnalyst)}
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{s.suggestedAnalyst}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* ─── Batch Assignment Modal ────────────────────────── */}
      <Modal
        isOpen={batchModalOpen}
        onClose={() => setBatchModalOpen(false)}
        title={`Create Batch: ${selectedBatch?.testName || ''}`}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setBatchModalOpen(false)}>
              Cancel
            </Button>
            <Button
              icon={<PackageCheck className="h-4 w-4" />}
              onClick={() => {
                if (selectedBatch) {
                  toast.success(
                    `Batch created for ${selectedBatch.testName} with ${selectedBatch.suggestedBatchSize} samples`,
                  );
                }
                setBatchModalOpen(false);
              }}
            >
              Create Batch & Assign
            </Button>
          </>
        }
      >
        {selectedBatch && (
          <div>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Test Name</span>
                  <p className="font-semibold text-gray-900">{selectedBatch.testName}</p>
                </div>
                <div>
                  <span className="text-gray-500">Samples in Batch</span>
                  <p className="font-semibold text-gray-900">{selectedBatch.suggestedBatchSize} of {selectedBatch.pendingCount}</p>
                </div>
              </div>
            </div>

            <h4 className="text-sm font-semibold text-gray-900 mb-3">Included Samples</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedBatch.samples.slice(0, selectedBatch.suggestedBatchSize).map((s) => (
                <span key={s} className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                  {s}
                </span>
              ))}
            </div>

            <h4 className="text-sm font-semibold text-gray-900 mb-3">Assign Batch To</h4>
            <div className="space-y-2">
              {analysts.map((a) => {
                const loadPct = getLoadPercent(a);
                const hasExpertise = a.specializations.includes(selectedBatch.testName);
                return (
                  <label
                    key={a.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:border-blue-400 hover:bg-blue-50 ${
                      hasExpertise ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-200'
                    }`}
                  >
                    <input type="radio" name="batchAnalyst" className="accent-blue-600" />
                    <div className={`w-8 h-8 rounded-full ${getAvatarColor(a.name)} text-white flex items-center justify-center text-xs font-bold`}>
                      {getInitials(a.name)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{a.name}</span>
                        {hasExpertise && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded font-semibold">
                            EXPERT
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        Load: {loadPct}% &middot; {a.assignedTests}/{a.maxCapacity} tests
                      </span>
                    </div>
                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getLoadColor(loadPct)}`}
                        style={{ width: `${Math.min(100, loadPct)}%` }}
                      />
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
