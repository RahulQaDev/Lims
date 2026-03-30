import { useState, useCallback, useMemo, useEffect, type DragEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  GitBranch,
  ChevronDown,
  ChevronRight,
  Search,
  Maximize2,
  Minimize2,
  Download,
  List,
  LayoutGrid,
  Network,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  User as UserIcon,
  Mail,
  Phone,
  Building2,
  Activity,
  Target,
  BarChart3,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  GripVertical,
  RefreshCw,
  MapPin,
} from 'lucide-react';
import { get, post, del } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import Loader from '../../components/ui/Loader';
import SearchInput from '../../components/ui/SearchInput';
import type { User, Department, PaginatedResponse, ApiResponse, UserRole } from '../../types';

// ════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ════════════════════════════════════════════════════════════════

type ViewMode = 'tree' | 'list' | 'grid';
type DepartmentFilter = 'all' | 'analytical' | 'administrative';
type AvailabilityStatus = 'present' | 'absent' | 'on_leave';

interface UserKPI {
  pendingTasks: number;
  completedToday: number;
  inProgress: number;
  completedThisWeek: number;
  completedThisMonth: number;
  assignedThisMonth: number;
  averageTAT: number;
  onTimePercent: number;
  rejectionRate: number;
  availability: AvailabilityStatus;
  performanceTrend: 'up' | 'down' | 'stable';
}

interface AttendanceSummary {
  presentDays: number;
  absentDays: number;
  lateArrivals: number;
  leaveBalance: number;
  totalWorkingDays: number;
  attendancePercent: number;
}

interface KRAItem {
  label: string;
  target: number;
  actual: number;
}

interface RecentActivity {
  action: string;
  detail: string;
  timestamp: string;
}

interface Location {
  id: number;
  name: string;
  code: string;
  city: string;
  state: string;
  isHQ: boolean;
  isActive: boolean;
}

interface LocationDepartment {
  id: number;
  locationId: number;
  departmentId: number;
  isActive: boolean;
}

interface DragState {
  userId: string;
  userName: string;
  sourceDeptId: string;
  sourceDeptName: string;
}

interface ReassignState {
  userId: string;
  userName: string;
  sourceDeptId: string;
  sourceDeptName: string;
  targetDeptId: string;
  targetDeptName: string;
  newRole: UserRole;
}

// ════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'purple',
  LAB_DIRECTOR: 'purple',
  QUALITY_MANAGER: 'indigo',
  DEPARTMENT_HEAD: 'blue',
  REVIEWER: 'yellow',
  ANALYST: 'green',
  RECEPTIONIST: 'cyan',
  ACCOUNTS: 'orange',
  MARKETING: 'teal',
  CLIENT: 'gray',
};

const ROLE_BG_COLORS: Record<string, string> = {
  ADMIN: 'bg-purple-500',
  LAB_DIRECTOR: 'bg-purple-600',
  QUALITY_MANAGER: 'bg-indigo-500',
  DEPARTMENT_HEAD: 'bg-blue-500',
  REVIEWER: 'bg-yellow-500',
  ANALYST: 'bg-green-500',
  RECEPTIONIST: 'bg-cyan-500',
  ACCOUNTS: 'bg-orange-500',
  MARKETING: 'bg-teal-500',
  CLIENT: 'bg-gray-500',
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  LAB_DIRECTOR: 'Lab Director',
  QUALITY_MANAGER: 'Quality Manager',
  DEPARTMENT_HEAD: 'Department Head',
  REVIEWER: 'Reviewer',
  ANALYST: 'Analyst',
  RECEPTIONIST: 'Receptionist',
  ACCOUNTS: 'Accounts',
  MARKETING: 'Marketing',
  CLIENT: 'Client',
};

const ANALYTICAL_KEYWORDS = [
  'micro', 'hplc', 'gc', 'chem', 'physical', 'instru', 'spectro',
  'analytical', 'bio', 'pharma', 'food', 'water', 'environment',
  'petro', 'polymer', 'metal', 'calibration', 'stability', 'dissolution',
  'herbal', 'icpms', 'icpoes', 'lcms', 'mass', 'aas', 'ion', 'dsc',
  'xrd', 'malvern', 'radiological', 'molecular', 'hptlc', 'cosmetic',
  'mechanical', 'validation', 'generic', 'environmental',
];

const ADMIN_KEYWORDS = [
  'booking', 'account', 'reception', 'admin', 'hr', 'market', 'sales',
  'finance', 'purchase', 'store', 'quality', 'management', 'it',
  'print', 'review', 'signature', 'customer', 'coordinator', 'approved',
  'invoice', 'area manager', 'outsource', 'sample archive',
];

const ROLE_OPTIONS = [
  { value: 'ANALYST', label: 'Analyst' },
  { value: 'REVIEWER', label: 'Reviewer' },
  { value: 'DEPARTMENT_HEAD', label: 'Department Head' },
  { value: 'RECEPTIONIST', label: 'Receptionist' },
  { value: 'ACCOUNTS', label: 'Accounts' },
];

// ════════════════════════════════════════════════════════════════
// MOCK DATA GENERATORS
// ════════════════════════════════════════════════════════════════

function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs((Math.sin(hash) * 10000) % 1);
}

function generateUserKPI(user: User): UserKPI {
  const r = seededRandom(user.id);
  const isAnalyst = user.role === 'ANALYST';
  const isReviewer = user.role === 'REVIEWER';
  const isDeptHead = user.role === 'DEPARTMENT_HEAD';

  const basePending = isAnalyst ? 8 : isReviewer ? 5 : isDeptHead ? 3 : 2;
  const baseCompleted = isAnalyst ? 6 : isReviewer ? 8 : isDeptHead ? 4 : 3;

  return {
    pendingTasks: Math.floor(r * basePending) + 1,
    completedToday: Math.floor(r * baseCompleted) + 1,
    inProgress: Math.floor(r * 4) + 1,
    completedThisWeek: Math.floor(r * baseCompleted * 5) + 5,
    completedThisMonth: Math.floor(r * baseCompleted * 20) + 15,
    assignedThisMonth: Math.floor(r * basePending * 25) + 20,
    averageTAT: Math.round((12 + r * 36) * 10) / 10,
    onTimePercent: Math.round((70 + r * 28) * 10) / 10,
    rejectionRate: Math.round((r * 12) * 10) / 10,
    availability: r > 0.85 ? 'on_leave' : r > 0.75 ? 'absent' : 'present',
    performanceTrend: r > 0.6 ? 'up' : r > 0.3 ? 'stable' : 'down',
  };
}

function generateAttendance(user: User): AttendanceSummary {
  const r = seededRandom(user.id + 'att');
  const totalWorkingDays = 22;
  const presentDays = Math.floor(18 + r * 4);
  const absentDays = totalWorkingDays - presentDays;
  return {
    presentDays,
    absentDays,
    lateArrivals: Math.floor(r * 4),
    leaveBalance: Math.floor(8 + r * 12),
    totalWorkingDays,
    attendancePercent: Math.round((presentDays / totalWorkingDays) * 1000) / 10,
  };
}

function generateKRA(user: User): KRAItem[] {
  const r = seededRandom(user.id + 'kra');
  return [
    { label: 'Testing Accuracy', target: 98, actual: Math.round(90 + r * 9.5) },
    { label: 'Turnaround Compliance', target: 95, actual: Math.round(75 + r * 22) },
    { label: 'Sample Throughput', target: 100, actual: Math.round(60 + r * 45) },
    { label: 'Quality Score', target: 95, actual: Math.round(85 + r * 14) },
  ];
}

function generateRecentActivity(user: User): RecentActivity[] {
  const r = seededRandom(user.id + 'act');
  const actions = user.role === 'ANALYST'
    ? ['Entered result for', 'Started testing', 'Completed analysis of', 'Logged observation for', 'Updated parameters of']
    : user.role === 'REVIEWER'
      ? ['Reviewed result for', 'Returned result for', 'Approved batch for', 'Flagged discrepancy in', 'Verified calibration of']
      : ['Approved CoA for', 'Assigned task to', 'Updated department plan for', 'Reviewed report on', 'Scheduled calibration of'];

  const samples = ['S-2026-0451', 'S-2026-0448', 'S-2026-0445', 'S-2026-0442', 'S-2026-0439'];
  const hours = [1, 2, 3, 5, 8];

  return actions.map((action, i) => ({
    action,
    detail: samples[Math.floor((r * 5 + i) % 5)],
    timestamp: `${hours[i]}h ago`,
  }));
}

// ════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════

function getDeptType(dept: Department): 'analytical' | 'administrative' {
  // Use the type field from DB if available
  const deptAny = dept as Record<string, unknown>;
  if (deptAny.type === 'administrative') return 'administrative';
  if (deptAny.type === 'analytical') return 'analytical';
  // Fallback: check admin keywords FIRST (more specific match)
  const lower = dept.name.toLowerCase();
  if (ADMIN_KEYWORDS.some((kw) => lower.includes(kw))) return 'administrative';
  if (ANALYTICAL_KEYWORDS.some((kw) => lower.includes(kw))) return 'analytical';
  return 'analytical';
}

function getInitials(user: User): string {
  const name = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`;
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  return parts[0]?.substring(0, 2).toUpperCase() || 'U';
}

function getDisplayName(user: User): string {
  return user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username;
}

function getRoleBadgeVariant(role: string): 'purple' | 'indigo' | 'blue' | 'yellow' | 'green' | 'cyan' | 'orange' | 'teal' | 'gray' {
  return (ROLE_COLORS[role] || 'gray') as 'purple' | 'indigo' | 'blue' | 'yellow' | 'green' | 'cyan' | 'orange' | 'teal' | 'gray';
}

function getAvailabilityColor(status: AvailabilityStatus): string {
  switch (status) {
    case 'present': return 'bg-green-400';
    case 'absent': return 'bg-red-400';
    case 'on_leave': return 'bg-yellow-400';
  }
}

function getPerformanceColor(onTimePercent: number): string {
  if (onTimePercent >= 90) return 'text-green-600';
  if (onTimePercent >= 70) return 'text-yellow-600';
  return 'text-red-600';
}

function getKRAColor(actual: number, target: number): string {
  const ratio = actual / target;
  if (ratio >= 0.95) return 'bg-green-500';
  if (ratio >= 0.75) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getOverallKRAScore(kras: KRAItem[]): number {
  if (kras.length === 0) return 0;
  const scores = kras.map((k) => Math.min((k.actual / k.target) * 100, 100));
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

// ════════════════════════════════════════════════════════════════
// ORGANOGRAM PAGE COMPONENT
// ════════════════════════════════════════════════════════════════

export default function OrganogramPage() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

  // ── State ──────────────────────────────────────────────────
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [deptFilter, setDeptFilter] = useState<DepartmentFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [selectedPerson, setSelectedPerson] = useState<User | null>(null);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dropTargetDeptId, setDropTargetDeptId] = useState<string | null>(null);
  const [reassignState, setReassignState] = useState<ReassignState | null>(null);

  // ── Queries ────────────────────────────────────────────────
  const { data: locationsData, isLoading: locationsLoading } = useQuery({
    queryKey: ['organogram-locations'],
    queryFn: () => get<ApiResponse<Location[]>>('/locations'),
  });

  const { data: locationDepartmentsData } = useQuery({
    queryKey: ['organogram-location-departments'],
    queryFn: () => get<ApiResponse<LocationDepartment[]>>('/locations/department-mappings'),
  });

  // Set default location from current user once locations load
  const locations: Location[] = useMemo(() => {
    const raw = locationsData?.data ?? [];
    return (Array.isArray(raw) ? raw : []).filter((l) => l.isActive);
  }, [locationsData]);

  const locationDepartments: LocationDepartment[] = useMemo(() => {
    const raw = locationDepartmentsData?.data ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [locationDepartmentsData]);

  // Auto-select current user's location or first location
  useEffect(() => {
    if (selectedLocationId || locations.length === 0) return;
    const userLocationId = (currentUser as Record<string, unknown> | null)?.locationId;
    if (userLocationId) {
      setSelectedLocationId(String(userLocationId));
    } else if (locations.length > 0) {
      setSelectedLocationId(String(locations[0].id));
    }
  }, [locations, currentUser, selectedLocationId]);

  const selectedLocation = useMemo(
    () => locations.find((l) => String(l.id) === selectedLocationId) ?? null,
    [locations, selectedLocationId],
  );

  const isAllLocations = selectedLocationId === 'all';

  const usersQueryUrl = useMemo(() => {
    if (isAllLocations || !selectedLocationId) return '/users?page=1&limit=500';
    return `/users?page=1&limit=500&locationId=${selectedLocationId}`;
  }, [selectedLocationId, isAllLocations]);

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['organogram-users', selectedLocationId],
    queryFn: () => get<PaginatedResponse<User>>(usersQueryUrl),
  });

  const { data: deptsData, isLoading: deptsLoading } = useQuery({
    queryKey: ['organogram-departments'],
    queryFn: () => get<PaginatedResponse<Department>>('/departments?page=1&limit=100'),
  });

  // ── Mutations ──────────────────────────────────────────────
  const addMemberMutation = useMutation({
    mutationFn: ({ deptId, userId, role }: { deptId: string; userId: string; role: string }) =>
      post(`/departments/${deptId}/members`, { userId, role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organogram-users', selectedLocationId] });
      queryClient.invalidateQueries({ queryKey: ['organogram-departments'] });
      toast.success('User reassigned successfully');
    },
    onError: () => toast.error('Failed to reassign user'),
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ deptId, userId }: { deptId: string; userId: string }) =>
      del(`/departments/${deptId}/members/${userId}`),
    onError: () => toast.error('Failed to remove user from department'),
  });

  // ── Derived Data ───────────────────────────────────────────
  const users: User[] = useMemo(() => usersData?.data ?? [], [usersData]);

  // Build user-by-department map early (needed for filtering empty departments)
  const usersByDeptRaw = useMemo(() => {
    const map = new Map<string, User[]>();
    users.forEach((u) => {
      if (!u.isActive) return;
      const assignments = (u as Record<string, unknown>).departmentAssignments as Array<{ departmentId: number; department?: { id: number; name: string }; role?: string }> | undefined;
      if (assignments && assignments.length > 0) {
        assignments.forEach((a) => {
          const deptId = String(a.departmentId || a.department?.id);
          if (deptId) {
            if (!map.has(deptId)) map.set(deptId, []);
            if (!map.get(deptId)!.find(existing => existing.id === u.id)) {
              map.get(deptId)!.push(u);
            }
          }
        });
      }
    });
    return map;
  }, [users]);
  const departments: Department[] = useMemo(() => {
    const raw = deptsData?.data ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [deptsData]);

  // Department IDs that belong to the selected location
  const locationDeptIds = useMemo(() => {
    if (isAllLocations || !selectedLocationId) return null; // null = no filtering
    return new Set(
      locationDepartments
        .filter((ld) => String(ld.locationId) === selectedLocationId)
        .map((ld) => String(ld.departmentId)),
    );
  }, [locationDepartments, selectedLocationId, isAllLocations]);

  const filteredDepartments = useMemo(() => {
    return departments.filter((d) => {
      if (!d.isActive) return false;
      // Location filter
      if (locationDeptIds !== null && !locationDeptIds.has(String(d.id))) return false;
      // Type filter
      if (deptFilter === 'analytical') return getDeptType(d) === 'analytical';
      if (deptFilter === 'administrative') return getDeptType(d) === 'administrative';
      return true;
    }).filter((d) => {
      // Remove departments with no members at this location
      const members = usersByDeptRaw.get(String(d.id));
      return members && members.length > 0;
    });
  }, [departments, deptFilter, locationDeptIds, usersByDeptRaw]);

  const usersByDept = useMemo(() => {
    const map = new Map<string, User[]>();
    users.forEach((u) => {
      if (!u.isActive) return;
      // Users have departmentAssignments array from the API
      const assignments = (u as Record<string, unknown>).departmentAssignments as Array<{ departmentId: number; department?: { id: number; name: string }; role?: string }> | undefined;
      if (assignments && assignments.length > 0) {
        assignments.forEach((a) => {
          const deptId = String(a.departmentId || a.department?.id);
          if (deptId) {
            if (!map.has(deptId)) map.set(deptId, []);
            // Avoid duplicates
            if (!map.get(deptId)!.find(existing => existing.id === u.id)) {
              map.get(deptId)!.push(u);
            }
          }
        });
      } else {
        // Fallback: try departmentId directly
        const deptId = (u as Record<string, unknown>).departmentId as string;
        if (deptId) {
          if (!map.has(String(deptId))) map.set(String(deptId), []);
          map.get(String(deptId))!.push(u);
        }
      }
    });
    return map;
  }, [users]);

  const labDirectors = useMemo(
    () => users.filter((u) => u.isActive && (u.role === 'ADMIN' || u.role === 'LAB_DIRECTOR')),
    [users],
  );

  const qualityManagers = useMemo(
    () => users.filter((u) => u.isActive && u.role === 'QUALITY_MANAGER'),
    [users],
  );

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users.filter((u) => u.isActive);
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.isActive &&
        ((u.fullName || `${u.firstName || ''} ${u.lastName || ''}`).toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q) ||
          u.username?.toLowerCase().includes(q)),
    );
  }, [users, searchQuery]);

  const deptUsersGroupedByRole = useCallback(
    (deptId: string) => {
      const deptUsers = usersByDept.get(deptId) ?? [];
      const roles: Record<string, User[]> = {
        DEPARTMENT_HEAD: [],
        REVIEWER: [],
        QUALITY_MANAGER: [],
        ANALYST: [],
        RECEPTIONIST: [],
        ACCOUNTS: [],
        MARKETING: [],
      };
      deptUsers.forEach((u) => {
        if (roles[u.role]) roles[u.role].push(u);
        else {
          if (!roles['OTHER']) roles['OTHER'] = [];
          roles['OTHER'].push(u);
        }
      });
      return roles;
    },
    [usersByDept],
  );

  // ── Expand/Collapse ────────────────────────────────────────
  const toggleDept = (deptId: string) => {
    setExpandedDepts((prev) => {
      const next = new Set(prev);
      if (next.has(deptId)) next.delete(deptId);
      else next.add(deptId);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedDepts(new Set(filteredDepartments.map((d) => d.id)));
  };

  const collapseAll = () => {
    setExpandedDepts(new Set());
  };

  // ── Drag and Drop ─────────────────────────────────────────
  const handleDragStart = (e: DragEvent<HTMLDivElement>, user: User) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', user.id);
    setDragState({
      userId: user.id,
      userName: getDisplayName(user),
      sourceDeptId: user.departmentId,
      sourceDeptName: user.departmentName ?? '',
    });
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, deptId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragState && dragState.sourceDeptId !== deptId) {
      setDropTargetDeptId(deptId);
    }
  };

  const handleDragLeave = () => {
    setDropTargetDeptId(null);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, dept: Department) => {
    e.preventDefault();
    setDropTargetDeptId(null);
    if (!dragState || dragState.sourceDeptId === dept.id) {
      setDragState(null);
      return;
    }
    setReassignState({
      userId: dragState.userId,
      userName: dragState.userName,
      sourceDeptId: dragState.sourceDeptId,
      sourceDeptName: dragState.sourceDeptName,
      targetDeptId: dept.id,
      targetDeptName: dept.name,
      newRole: 'ANALYST',
    });
    setDragState(null);
  };

  const handleDragEnd = () => {
    setDragState(null);
    setDropTargetDeptId(null);
  };

  const confirmReassign = async () => {
    if (!reassignState) return;
    try {
      await removeMemberMutation.mutateAsync({
        deptId: reassignState.sourceDeptId,
        userId: reassignState.userId,
      });
      await addMemberMutation.mutateAsync({
        deptId: reassignState.targetDeptId,
        userId: reassignState.userId,
        role: reassignState.newRole,
      });
      setReassignState(null);
    } catch {
      // errors handled by mutation callbacks
    }
  };

  // ── Loading State ──────────────────────────────────────────
  if (usersLoading || deptsLoading || locationsLoading) {
    return <Loader fullScreen text="Loading organization chart..." />;
  }

  // ════════════════════════════════════════════════════════════
  // SUB-COMPONENTS (defined inline for single-file requirement)
  // ════════════════════════════════════════════════════════════

  // ── Avatar ─────────────────────────────────────────────────
  function Avatar({ user, size = 'md' }: { user: User; size?: 'sm' | 'md' | 'lg' }) {
    const sizeClass = size === 'sm' ? 'w-7 h-7 text-[10px]' : size === 'lg' ? 'w-14 h-14 text-lg' : 'w-9 h-9 text-xs';
    return (
      <div className={`${sizeClass} rounded-full ${ROLE_BG_COLORS[user.role] ?? 'bg-gray-500'} text-white flex items-center justify-center font-semibold shrink-0`}>
        {getInitials(user)}
      </div>
    );
  }

  // ── KPI Mini Badges ────────────────────────────────────────
  function KPIBadges({ kpi }: { kpi: UserKPI }) {
    return (
      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
        {kpi.pendingTasks > 0 && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700">
            <Clock className="w-2.5 h-2.5" /> {kpi.pendingTasks}
          </span>
        )}
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700">
          <CheckCircle2 className="w-2.5 h-2.5" /> {kpi.completedToday}
        </span>
        <span className={`w-2 h-2 rounded-full ${getAvailabilityColor(kpi.availability)}`} title={kpi.availability} />
        {kpi.performanceTrend === 'up' && <ArrowUpRight className="w-3 h-3 text-green-500" />}
        {kpi.performanceTrend === 'down' && <ArrowDownRight className="w-3 h-3 text-red-500" />}
        {kpi.performanceTrend === 'stable' && <Minus className="w-3 h-3 text-gray-400" />}
      </div>
    );
  }

  // ── Person Card (Tree Node) ────────────────────────────────
  function PersonCard({ user, compact = false }: { user: User; compact?: boolean }) {
    const kpi = generateUserKPI(user);
    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, user)}
        onDragEnd={handleDragEnd}
        onClick={(e) => { e.stopPropagation(); setSelectedPerson(user); }}
        className={`bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer select-none group ${
          compact ? 'px-2.5 py-2' : 'px-3 py-2.5'
        } ${dragState?.userId === user.id ? 'opacity-50 ring-2 ring-blue-400' : ''}`}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          <Avatar user={user} size={compact ? 'sm' : 'md'} />
          <div className="min-w-0 flex-1">
            <p className={`font-medium text-gray-900 truncate ${compact ? 'text-xs' : 'text-sm'}`}>
              {getDisplayName(user)}
            </p>
            <Badge variant={getRoleBadgeVariant(user.role)} className="mt-0.5">
              {ROLE_LABELS[user.role] ?? user.role}
            </Badge>
            {!compact && <KPIBadges kpi={kpi} />}
          </div>
        </div>
      </div>
    );
  }

  // ── Role Section in Department ─────────────────────────────
  function RoleSection({ title, users: roleUsers, variant }: { title: string; users: User[]; variant: 'purple' | 'indigo' | 'blue' | 'yellow' | 'green' | 'cyan' | 'orange' | 'teal' | 'gray' }) {
    if (roleUsers.length === 0) return null;
    return (
      <div className="mt-2">
        <div className="flex items-center gap-1.5 mb-1.5">
          <Badge variant={variant}>{title}</Badge>
          <span className="text-[10px] text-gray-400">({roleUsers.length})</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {roleUsers.map((u) => (
            <PersonCard key={u.id} user={u} compact />
          ))}
        </div>
      </div>
    );
  }

  // ── Department Tree Node ───────────────────────────────────
  function DepartmentTreeNode({ dept }: { dept: Department }) {
    const isExpanded = expandedDepts.has(dept.id);
    const grouped = deptUsersGroupedByRole(String(dept.id));
    const memberCount = (usersByDept.get(String(dept.id)) ?? []).length;
    const isDropTarget = dropTargetDeptId === dept.id;
    const deptType = getDeptType(dept);

    return (
      <div className="relative">
        {/* Connecting line from parent */}
        <div className="absolute -top-4 left-1/2 w-px h-4 bg-gray-300" />

        <div
          onDragOver={(e) => handleDragOver(e, dept.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, dept)}
          className={`relative border rounded-xl transition-all ${
            isDropTarget
              ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-200 shadow-lg'
              : 'border-gray-200 bg-white shadow-sm hover:shadow-md'
          }`}
        >
          {/* Department Header */}
          <button
            onClick={() => toggleDept(dept.id)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
            )}
            <div
              className={`w-3 h-3 rounded-full shrink-0 ${
                deptType === 'analytical' ? 'bg-blue-400' : 'bg-emerald-400'
              }`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 truncate">{dept.name}</p>
              <p className="text-[11px] text-gray-500">
                {grouped.DEPARTMENT_HEAD.length > 0 ? getDisplayName(grouped.DEPARTMENT_HEAD[0]) : 'No head assigned'} &middot; {memberCount} member{memberCount !== 1 ? 's' : ''}
              </p>
            </div>
            <Badge variant={deptType === 'analytical' ? 'blue' : 'emerald'}>
              {deptType === 'analytical' ? 'Analytical' : 'Admin'}
            </Badge>
          </button>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="px-4 pb-4 border-t border-gray-100">
              <RoleSection title="Department Head" users={grouped.DEPARTMENT_HEAD} variant="blue" />
              <RoleSection title="Quality Manager" users={grouped.QUALITY_MANAGER} variant="indigo" />
              <RoleSection title="Reviewers" users={grouped.REVIEWER} variant="yellow" />
              <RoleSection title="Analysts" users={grouped.ANALYST} variant="green" />
              <RoleSection title="Receptionist" users={grouped.RECEPTIONIST} variant="cyan" />
              <RoleSection title="Accounts" users={grouped.ACCOUNTS} variant="orange" />
              <RoleSection title="Marketing" users={grouped.MARKETING} variant="teal" />
              {grouped.OTHER && grouped.OTHER.length > 0 && (
                <RoleSection title="Other" users={grouped.OTHER} variant="gray" />
              )}
              {memberCount === 0 && (
                <p className="text-xs text-gray-400 mt-3 text-center py-2">No members in this department</p>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedDept(dept); }}
                className="mt-3 w-full text-center text-xs text-blue-600 hover:text-blue-800 font-medium py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
              >
                View Department Details
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // TREE VIEW
  // ════════════════════════════════════════════════════════════

  function TreeView() {
    const analyticalDepts = filteredDepartments.filter((d) => getDeptType(d) === 'analytical');
    const adminDepts = filteredDepartments.filter((d) => getDeptType(d) === 'administrative');

    return (
      <div className="overflow-x-auto pb-8">
        <div className="min-w-[900px] flex flex-col items-center gap-0">

          {/* Level 0: Lab Director / Admin */}
          <div className="flex gap-4 justify-center">
            {labDirectors.length > 0 ? (
              labDirectors.map((u) => <PersonCard key={u.id} user={u} />)
            ) : (
              <div className="px-4 py-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-700">
                Lab Director / Admin
              </div>
            )}
          </div>

          {/* Vertical connector */}
          <div className="w-px h-8 bg-gray-300" />

          {/* Level 1: Quality Managers */}
          {qualityManagers.length > 0 && (
            <>
              <div className="flex gap-4 justify-center">
                {qualityManagers.map((u) => <PersonCard key={u.id} user={u} />)}
              </div>
              <div className="w-px h-8 bg-gray-300" />
            </>
          )}

          {/* Horizontal connector bar */}
          <div className="relative w-full max-w-6xl">
            <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gray-300" />
          </div>

          {/* Department Groups */}
          {deptFilter !== 'administrative' && analyticalDepts.length > 0 && (
            <div className="w-full mt-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                Analytical Departments
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {analyticalDepts.map((dept) => (
                  <DepartmentTreeNode key={dept.id} dept={dept} />
                ))}
              </div>
            </div>
          )}

          {deptFilter !== 'analytical' && adminDepts.length > 0 && (
            <div className="w-full mt-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                Administrative Departments
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {adminDepts.map((dept) => (
                  <DepartmentTreeNode key={dept.id} dept={dept} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // LIST VIEW
  // ════════════════════════════════════════════════════════════

  function ListView() {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Role</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Department</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Pending</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Done Today</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">TAT (hrs)</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">On-Time %</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Attendance %</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">KRA Score</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.map((user) => {
              const kpi = generateUserKPI(user);
              const att = generateAttendance(user);
              const kras = generateKRA(user);
              const kraScore = getOverallKRAScore(kras);

              return (
                <tr
                  key={user.id}
                  onClick={() => setSelectedPerson(user)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar user={user} size="sm" />
                      <span className="font-medium text-gray-900">{getDisplayName(user)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {ROLE_LABELS[user.role] ?? user.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{user.departmentName ?? '-'}</td>
                  <td className="px-4 py-3 text-center">
                    {kpi.pendingTasks > 0 ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                        {kpi.pendingTasks}
                      </span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-green-600 font-medium">{kpi.completedToday}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{kpi.averageTAT}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-semibold ${getPerformanceColor(kpi.onTimePercent)}`}>
                      {kpi.onTimePercent}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700">{att.attendancePercent}%</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-semibold ${kraScore >= 90 ? 'text-green-600' : kraScore >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {kraScore}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`w-2.5 h-2.5 rounded-full inline-block ${getAvailabilityColor(kpi.availability)}`} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-400">No users found</div>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // GRID VIEW
  // ════════════════════════════════════════════════════════════

  function GridView() {
    return (
      <div className="space-y-8">
        {filteredDepartments.map((dept) => {
          const deptUsers = (usersByDept.get(String(dept.id)) ?? []).filter((u) => {
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return getDisplayName(u).toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
          });
          if (searchQuery.trim() && deptUsers.length === 0) return null;

          return (
            <div key={dept.id}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-3 h-3 rounded-full ${getDeptType(dept) === 'analytical' ? 'bg-blue-400' : 'bg-emerald-400'}`} />
                <h3 className="text-sm font-semibold text-gray-800">{dept.name}</h3>
                <span className="text-xs text-gray-400">({deptUsers.length} members)</span>
              </div>
              {deptUsers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {deptUsers.map((user) => {
                    const kpi = generateUserKPI(user);
                    const kras = generateKRA(user);
                    const kraScore = getOverallKRAScore(kras);

                    return (
                      <div
                        key={user.id}
                        onClick={() => setSelectedPerson(user)}
                        className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar user={user} size="md" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {getDisplayName(user)}
                            </p>
                            <Badge variant={getRoleBadgeVariant(user.role)} className="mt-0.5">
                              {ROLE_LABELS[user.role] ?? user.role}
                            </Badge>
                          </div>
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${getAvailabilityColor(kpi.availability)}`} />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-red-50 rounded-lg px-2 py-1.5 text-center">
                            <p className="text-red-600 font-semibold">{kpi.pendingTasks}</p>
                            <p className="text-red-400">Pending</p>
                          </div>
                          <div className="bg-green-50 rounded-lg px-2 py-1.5 text-center">
                            <p className="text-green-600 font-semibold">{kpi.completedToday}</p>
                            <p className="text-green-400">Done Today</p>
                          </div>
                          <div className="bg-blue-50 rounded-lg px-2 py-1.5 text-center">
                            <p className="text-blue-600 font-semibold">{kpi.onTimePercent}%</p>
                            <p className="text-blue-400">On-Time</p>
                          </div>
                          <div className={`rounded-lg px-2 py-1.5 text-center ${kraScore >= 90 ? 'bg-green-50' : kraScore >= 70 ? 'bg-yellow-50' : 'bg-red-50'}`}>
                            <p className={`font-semibold ${kraScore >= 90 ? 'text-green-600' : kraScore >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>{kraScore}%</p>
                            <p className="text-gray-400">KRA</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-400 py-3">No members</p>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // DEPARTMENT DRILL-DOWN PANEL
  // ════════════════════════════════════════════════════════════

  function DepartmentDetailPanel() {
    if (!selectedDept) return null;
    const deptUsers = usersByDept.get(String(selectedDept.id)) ?? [];

    return (
      <Modal
        isOpen={!!selectedDept}
        onClose={() => setSelectedDept(null)}
        title={selectedDept.name}
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Building2 className="w-4 h-4" />
            <span>Head: <strong>{selectedDept.headName ?? 'Not assigned'}</strong></span>
            <span className="text-gray-300">|</span>
            <span>{deptUsers.length} member{deptUsers.length !== 1 ? 's' : ''}</span>
            <Badge variant={getDeptType(selectedDept) === 'analytical' ? 'blue' : 'emerald'}>
              {getDeptType(selectedDept) === 'analytical' ? 'Analytical' : 'Administrative'}
            </Badge>
          </div>

          {/* Team Performance Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-3 py-2 font-semibold text-gray-600">Name</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-600">Role</th>
                  <th className="text-center px-3 py-2 font-semibold text-gray-600">Pending</th>
                  <th className="text-center px-3 py-2 font-semibold text-gray-600">In Progress</th>
                  <th className="text-center px-3 py-2 font-semibold text-gray-600">This Week</th>
                  <th className="text-center px-3 py-2 font-semibold text-gray-600">TAT (hrs)</th>
                  <th className="text-center px-3 py-2 font-semibold text-gray-600">On-Time %</th>
                  <th className="text-center px-3 py-2 font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {deptUsers.map((user) => {
                  const kpi = generateUserKPI(user);
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Avatar user={user} size="sm" />
                          <span className="font-medium text-gray-900">{getDisplayName(user)}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {ROLE_LABELS[user.role] ?? user.role}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-center font-medium">{kpi.pendingTasks}</td>
                      <td className="px-3 py-2 text-center font-medium">{kpi.inProgress}</td>
                      <td className="px-3 py-2 text-center font-medium text-green-600">{kpi.completedThisWeek}</td>
                      <td className="px-3 py-2 text-center">{kpi.averageTAT}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`font-semibold ${getPerformanceColor(kpi.onTimePercent)}`}>
                          {kpi.onTimePercent}%
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDept(null);
                            setSelectedPerson(user);
                          }}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {deptUsers.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">No members in this department</p>
          )}
        </div>
      </Modal>
    );
  }

  // ════════════════════════════════════════════════════════════
  // PERSON DETAIL PANEL (Slide-out)
  // ════════════════════════════════════════════════════════════

  function PersonDetailPanel() {
    if (!selectedPerson) return null;

    const user = selectedPerson;
    const kpi = generateUserKPI(user);
    const att = generateAttendance(user);
    const kras = generateKRA(user);
    const kraScore = getOverallKRAScore(kras);
    const activities = generateRecentActivity(user);

    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setSelectedPerson(null)}
        />

        {/* Slide-out Panel */}
        <div className="fixed top-0 right-0 z-50 h-screen w-full max-w-lg bg-white shadow-2xl overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white z-10 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Person Details</h2>
            <button
              onClick={() => setSelectedPerson(null)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-6">
            {/* ── Profile Section ──────────────────────────── */}
            <div className="flex items-center gap-4">
              <Avatar user={user} size="lg" />
              <div>
                <h3 className="text-lg font-bold text-gray-900">{getDisplayName(user)}</h3>
                <Badge variant={getRoleBadgeVariant(user.role)} className="mt-1">
                  {ROLE_LABELS[user.role] ?? user.role}
                </Badge>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${getAvailabilityColor(kpi.availability)}`} />
                  <span className="text-xs text-gray-500 capitalize">{kpi.availability.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{user.phone ?? 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 col-span-2">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span>{user.departmentName ?? 'Unassigned'}</span>
              </div>
            </div>

            {/* ── KPI Dashboard ────────────────────────────── */}
            <div>
              <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-blue-500" /> KPI Dashboard
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <KPIStat label="Assigned (Month)" value={kpi.assignedThisMonth} color="blue" />
                <KPIStat label="Completed (Month)" value={kpi.completedThisMonth} color="green" />
                <KPIStat label="Avg TAT (hrs)" value={kpi.averageTAT} color="indigo" />
                <KPIStat label="On-Time %" value={`${kpi.onTimePercent}%`} color={kpi.onTimePercent >= 90 ? 'green' : kpi.onTimePercent >= 70 ? 'yellow' : 'red'} />
                <KPIStat label="Rejection Rate" value={`${kpi.rejectionRate}%`} color={kpi.rejectionRate <= 3 ? 'green' : kpi.rejectionRate <= 7 ? 'yellow' : 'red'} />
                <KPIStat label="Pending Tasks" value={kpi.pendingTasks} color={kpi.pendingTasks > 5 ? 'red' : 'gray'} />
              </div>
            </div>

            {/* ── Attendance Summary ──────────────────────── */}
            <div>
              <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-green-500" /> Attendance Summary
              </h4>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="text-center bg-green-50 rounded-lg p-2">
                  <p className="text-lg font-bold text-green-600">{att.presentDays}</p>
                  <p className="text-[10px] text-green-500">Present</p>
                </div>
                <div className="text-center bg-red-50 rounded-lg p-2">
                  <p className="text-lg font-bold text-red-600">{att.absentDays}</p>
                  <p className="text-[10px] text-red-500">Absent</p>
                </div>
                <div className="text-center bg-yellow-50 rounded-lg p-2">
                  <p className="text-lg font-bold text-yellow-600">{att.lateArrivals}</p>
                  <p className="text-[10px] text-yellow-500">Late</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Leave Balance: {att.leaveBalance} days</span>
                <span className="font-semibold">{att.attendancePercent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    att.attendancePercent >= 90 ? 'bg-green-500' : att.attendancePercent >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(att.attendancePercent, 100)}%` }}
                />
              </div>
            </div>

            {/* ── KRA (Key Result Areas) ─────────────────── */}
            <div>
              <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-purple-500" /> Key Result Areas (KRA)
              </h4>
              <div className="space-y-3">
                {kras.map((kra) => (
                  <div key={kra.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-700 font-medium">{kra.label}</span>
                      <span className="text-gray-500">
                        {kra.actual}% / {kra.target}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 relative">
                      {/* Target marker */}
                      <div
                        className="absolute top-0 w-px h-2 bg-gray-600 z-10"
                        style={{ left: `${Math.min(kra.target, 100)}%` }}
                      />
                      <div
                        className={`h-2 rounded-full transition-all ${getKRAColor(kra.actual, kra.target)}`}
                        style={{ width: `${Math.min(kra.actual, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Overall KRA Score</span>
                  <span className={`text-xl font-bold ${kraScore >= 90 ? 'text-green-600' : kraScore >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {kraScore}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                  <div
                    className={`h-3 rounded-full transition-all ${kraScore >= 90 ? 'bg-green-500' : kraScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(kraScore, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* ── Recent Activity ─────────────────────────── */}
            <div>
              <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-orange-500" /> Recent Activity
              </h4>
              <div className="space-y-2">
                {activities.map((act, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-700">
                        {act.action} <span className="font-medium text-blue-600">{act.detail}</span>
                      </p>
                      <p className="text-[10px] text-gray-400">{act.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── KPI Stat Card (inline helper) ──────────────────────────
  function KPIStat({ label, value, color }: { label: string; value: string | number; color: string }) {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-50 text-blue-700',
      green: 'bg-green-50 text-green-700',
      red: 'bg-red-50 text-red-700',
      yellow: 'bg-yellow-50 text-yellow-700',
      indigo: 'bg-indigo-50 text-indigo-700',
      gray: 'bg-gray-50 text-gray-700',
      orange: 'bg-orange-50 text-orange-700',
    };
    return (
      <div className={`rounded-lg p-3 ${colorMap[color] ?? colorMap.gray}`}>
        <p className="text-lg font-bold">{value}</p>
        <p className="text-[10px] opacity-75">{label}</p>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // REASSIGNMENT MODAL
  // ════════════════════════════════════════════════════════════

  function ReassignModal() {
    if (!reassignState) return null;
    return (
      <Modal
        isOpen={!!reassignState}
        onClose={() => setReassignState(null)}
        title="Reassign User"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setReassignState(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={confirmReassign}
              loading={addMemberMutation.isPending || removeMemberMutation.isPending}
            >
              Confirm Reassignment
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg text-sm">
            <RefreshCw className="w-5 h-5 text-blue-500 shrink-0" />
            <div>
              <p className="text-gray-800">
                Move <strong>{reassignState.userName}</strong> from{' '}
                <strong>{reassignState.sourceDeptName}</strong> to{' '}
                <strong>{reassignState.targetDeptName}</strong>?
              </p>
            </div>
          </div>
          <Select
            label="Role in New Department"
            options={ROLE_OPTIONS}
            value={reassignState.newRole}
            onChange={(e) =>
              setReassignState((prev) =>
                prev ? { ...prev, newRole: e.target.value as UserRole } : null,
              )
            }
          />
        </div>
      </Modal>
    );
  }

  // ════════════════════════════════════════════════════════════
  // COLOR LEGEND
  // ════════════════════════════════════════════════════════════

  function ColorLegend() {
    const items = [
      { label: 'Admin', color: 'bg-purple-500' },
      { label: 'Quality Manager', color: 'bg-indigo-500' },
      { label: 'Dept Head', color: 'bg-blue-500' },
      { label: 'Reviewer', color: 'bg-yellow-500' },
      { label: 'Analyst', color: 'bg-green-500' },
      { label: 'Receptionist', color: 'bg-cyan-500' },
      { label: 'Accounts', color: 'bg-orange-500' },
    ];
    return (
      <div className="flex flex-wrap items-center gap-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
            {item.label}
          </div>
        ))}
        <div className="ml-2 border-l border-gray-200 pl-3 flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400" /> Present
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Absent
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" /> On Leave
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Network className="w-7 h-7 text-blue-600" />
            Organization Chart
            {(selectedLocation || isAllLocations) && (
              <span className="text-lg font-semibold text-gray-500">
                &mdash; {isAllLocations ? 'All Locations' : selectedLocation?.name}
              </span>
            )}
            {selectedLocation && !isAllLocations && (
              <Badge variant="blue">
                <MapPin className="w-3 h-3 mr-1 inline" />
                {selectedLocation.city || selectedLocation.code}
              </Badge>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Visual organization hierarchy with live KPIs and drag-and-drop reassignment
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<Download className="w-4 h-4" />}
            onClick={() => toast.success('Export feature coming soon')}
          >
            Export
          </Button>
        </div>
      </div>

      {/* ── Location Selector ──────────────────────────────── */}
      {locations.length > 0 && (
        <Card>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <MapPin className="w-4 h-4 text-blue-500" />
              Location
            </div>
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5 flex-wrap">
              {/* All Locations option - only for admins / HQ users */}
              {(currentUser?.role === 'ADMIN' || currentUser?.role === 'LAB_DIRECTOR' ||
                locations.some((l) => l.isHQ && String(l.id) === String((currentUser as Record<string, unknown> | null)?.locationId))) && (
                <button
                  onClick={() => setSelectedLocationId('all')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isAllLocations ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  All Locations
                </button>
              )}
              {locations.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => setSelectedLocationId(String(loc.id))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    selectedLocationId === String(loc.id) ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {loc.name}
                  {loc.isHQ && (
                    <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full font-semibold">HQ</span>
                  )}
                </button>
              ))}
            </div>
            {selectedLocation && !isAllLocations && (
              <span className="text-xs text-gray-400 ml-auto">
                {selectedLocation.city}{selectedLocation.state ? `, ${selectedLocation.state}` : ''}
              </span>
            )}
          </div>
        </Card>
      )}

      {/* ── View Controls Bar ─────────────────────────────── */}
      <Card>
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('tree')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'tree' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <GitBranch className="w-4 h-4" /> Tree
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <List className="w-4 h-4" /> List
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> Grid
            </button>
          </div>

          {/* Department Filter */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            {(['all', 'analytical', 'administrative'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setDeptFilter(f)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                  deptFilter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex-1 max-w-xs">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search users..."
            />
          </div>

          {/* Expand/Collapse (Tree view only) */}
          {viewMode === 'tree' && (
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" icon={<Maximize2 className="w-4 h-4" />} onClick={expandAll}>
                Expand All
              </Button>
              <Button variant="ghost" size="sm" icon={<Minimize2 className="w-4 h-4" />} onClick={collapseAll}>
                Collapse All
              </Button>
            </div>
          )}
        </div>

        {/* Color Legend */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <ColorLegend />
        </div>
      </Card>

      {/* ── Content Area ──────────────────────────────────── */}
      <Card noPadding={viewMode === 'list'}>
        <div className={viewMode === 'list' ? '' : 'p-2'}>
          {viewMode === 'tree' && <TreeView />}
          {viewMode === 'list' && <ListView />}
          {viewMode === 'grid' && <GridView />}
        </div>
      </Card>

      {/* ── Summary Stats ─────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{filteredUsers.length}</p>
              <p className="text-xs text-gray-500">Active Users{selectedLocation && !isAllLocations ? ` (${selectedLocation.name})` : ''}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{filteredDepartments.length}</p>
              <p className="text-xs text-gray-500">Departments{selectedLocation && !isAllLocations ? ` (${selectedLocation.name})` : ''}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {filteredUsers.filter((u) => generateUserKPI(u).availability === 'present').length}
              </p>
              <p className="text-xs text-gray-500">Present Today</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {filteredUsers.filter((u) => generateUserKPI(u).pendingTasks > 5).length}
              </p>
              <p className="text-xs text-gray-500">High Workload</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals & Panels ───────────────────────────────── */}
      <DepartmentDetailPanel />
      <PersonDetailPanel />
      <ReassignModal />
    </div>
  );
}
