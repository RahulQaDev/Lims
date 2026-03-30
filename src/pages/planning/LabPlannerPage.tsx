import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  FlaskConical,
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Download,
  Eye,
  ChevronRight,
  DollarSign,
  TrendingUp,
  Users,
  BarChart3,
  Zap,
  FileText,
  ArrowUpRight,
  Timer,
  UserCog,
  ArrowRight,
} from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import { get } from '../../services/api';
import { formatDate } from '../../utils/formatters';
import type { Department, Sample, Booking } from '../../types';

// ─── Local Types ────────────────────────────────────────

interface DashboardStats {
  totalSamples?: number;
  pendingSamples?: number;
  inTestingSamples?: number;
  completedSamples?: number;
  averageTAT?: number;
  onTimePercentage?: number;
}

interface DeptWorkload {
  departmentId: string;
  departmentName: string;
  pending: number;
  inProgress: number;
  completedToday: number;
  capacity: number;
}

interface PriorityItem {
  id: string;
  sampleCode: string;
  clientName: string;
  priority: string;
  departmentName: string;
  testName: string;
  dueDate: string;
  status: string;
  assignedTo: string;
}

interface TatRiskItem {
  id: string;
  sampleCode: string;
  clientName: string;
  departmentName: string;
  testName: string;
  hoursRemaining: number;
  totalHours: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Breached';
}

interface ForecastDay {
  day: string;
  date: string;
  predicted: number;
  historical: number;
}

interface DeptAnalystUtilization {
  departmentName: string;
  totalAnalysts: number;
  activeAnalysts: number;
  avgLoad: number;
}

// ─── Mock / Fallback Data ───────────────────────────────

const mockDeptWorkload: DeptWorkload[] = [
  { departmentId: '1', departmentName: 'HPLC', pending: 12, inProgress: 8, completedToday: 5, capacity: 30 },
  { departmentId: '2', departmentName: 'Microbiology', pending: 9, inProgress: 6, completedToday: 4, capacity: 20 },
  { departmentId: '3', departmentName: 'ICPMS', pending: 5, inProgress: 3, completedToday: 2, capacity: 15 },
  { departmentId: '4', departmentName: 'Water Testing', pending: 14, inProgress: 11, completedToday: 7, capacity: 25 },
  { departmentId: '5', departmentName: 'Food Analysis', pending: 7, inProgress: 4, completedToday: 3, capacity: 20 },
  { departmentId: '6', departmentName: 'GC', pending: 3, inProgress: 2, completedToday: 1, capacity: 10 },
];

const mockPriorityQueue: PriorityItem[] = [
  { id: '1', sampleCode: 'SMP-2026-00142', clientName: 'PharmaCo Ltd', priority: 'CRITICAL', departmentName: 'HPLC', testName: 'Assay by HPLC', dueDate: '2026-03-24', status: 'IN_TESTING', assignedTo: 'Dr. Priya Sharma' },
  { id: '2', sampleCode: 'SMP-2026-00141', clientName: 'AquaPure Inc', priority: 'URGENT', departmentName: 'Water Testing', testName: 'Heavy Metals', dueDate: '2026-03-24', status: 'PENDING', assignedTo: '' },
  { id: '3', sampleCode: 'SMP-2026-00139', clientName: 'FoodSafe Corp', priority: 'CRITICAL', departmentName: 'Food Analysis', testName: 'Pesticide Residue', dueDate: '2026-03-23', status: 'PENDING', assignedTo: 'Pooja Gupta' },
  { id: '4', sampleCode: 'SMP-2026-00138', clientName: 'CosmoBeauty', priority: 'URGENT', departmentName: 'Microbiology', testName: 'Microbial Limit', dueDate: '2026-03-25', status: 'IN_PROGRESS', assignedTo: 'Dr. Anita Rao' },
  { id: '5', sampleCode: 'SMP-2026-00136', clientName: 'EnviroTest LLC', priority: 'URGENT', departmentName: 'ICPMS', testName: 'Elemental Impurities', dueDate: '2026-03-25', status: 'PENDING', assignedTo: '' },
  { id: '6', sampleCode: 'SMP-2026-00134', clientName: 'NutriFoods', priority: 'CRITICAL', departmentName: 'Food Analysis', testName: 'Nutritional Analysis', dueDate: '2026-03-22', status: 'IN_TESTING', assignedTo: 'Sanjay Mishra' },
  { id: '7', sampleCode: 'SMP-2026-00130', clientName: 'FoodSafe Corp', priority: 'CRITICAL', departmentName: 'Microbiology', testName: 'Sterility Test', dueDate: '2026-03-23', status: 'PENDING', assignedTo: '' },
  { id: '8', sampleCode: 'SMP-2026-00135', clientName: 'CosmoBeauty', priority: 'URGENT', departmentName: 'HPLC', testName: 'Content Uniformity', dueDate: '2026-03-24', status: 'PENDING', assignedTo: '' },
];

const mockTatRisk: TatRiskItem[] = [
  { id: '1', sampleCode: 'SMP-2026-00134', clientName: 'NutriFoods', departmentName: 'Food Analysis', testName: 'Nutritional Analysis', hoursRemaining: -6, totalHours: 48, riskLevel: 'Breached' },
  { id: '2', sampleCode: 'SMP-2026-00139', clientName: 'FoodSafe Corp', departmentName: 'Food Analysis', testName: 'Pesticide Residue', hoursRemaining: 2, totalHours: 48, riskLevel: 'High' },
  { id: '3', sampleCode: 'SMP-2026-00142', clientName: 'PharmaCo Ltd', departmentName: 'HPLC', testName: 'Assay by HPLC', hoursRemaining: 8, totalHours: 72, riskLevel: 'High' },
  { id: '4', sampleCode: 'SMP-2026-00130', clientName: 'FoodSafe Corp', departmentName: 'Microbiology', testName: 'Sterility Test', hoursRemaining: 3, totalHours: 48, riskLevel: 'High' },
  { id: '5', sampleCode: 'SMP-2026-00141', clientName: 'AquaPure Inc', departmentName: 'Water Testing', testName: 'Heavy Metals', hoursRemaining: 16, totalHours: 48, riskLevel: 'Medium' },
  { id: '6', sampleCode: 'SMP-2026-00138', clientName: 'CosmoBeauty', departmentName: 'Microbiology', testName: 'Microbial Limit', hoursRemaining: 30, totalHours: 72, riskLevel: 'Low' },
  { id: '7', sampleCode: 'SMP-2026-00136', clientName: 'EnviroTest LLC', departmentName: 'ICPMS', testName: 'Elemental Impurities', hoursRemaining: 48, totalHours: 72, riskLevel: 'Low' },
];

function generateForecast(): ForecastDay[] {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const result: ForecastDay[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : days[d.getDay()];
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const historical = isWeekend ? Math.floor(Math.random() * 8) + 5 : Math.floor(Math.random() * 15) + 18;
    const predicted = historical + Math.floor(Math.random() * 6) - 3;
    result.push({
      day: dayName,
      date: d.toISOString().split('T')[0],
      predicted: Math.max(0, predicted),
      historical,
    });
  }
  return result;
}

const mockForecast = generateForecast();

const mockAnalystUtilization: DeptAnalystUtilization[] = [
  { departmentName: 'HPLC', totalAnalysts: 4, activeAnalysts: 4, avgLoad: 75 },
  { departmentName: 'Microbiology', totalAnalysts: 3, activeAnalysts: 3, avgLoad: 70 },
  { departmentName: 'ICPMS', totalAnalysts: 2, activeAnalysts: 2, avgLoad: 50 },
  { departmentName: 'Water Testing', totalAnalysts: 3, activeAnalysts: 3, avgLoad: 88 },
  { departmentName: 'Food Analysis', totalAnalysts: 2, activeAnalysts: 2, avgLoad: 60 },
  { departmentName: 'GC', totalAnalysts: 2, activeAnalysts: 1, avgLoad: 38 },
];

// ─── Helpers ────────────────────────────────────────────

const priorityBadge: Record<string, { variant: 'blue' | 'orange' | 'red'; label: string }> = {
  NORMAL: { variant: 'blue', label: 'Normal' },
  URGENT: { variant: 'orange', label: 'Urgent' },
  CRITICAL: { variant: 'red', label: 'Critical' },
};

const statusBadge: Record<string, { variant: 'blue' | 'green' | 'yellow' | 'orange' | 'gray' | 'purple' | 'cyan'; label: string }> = {
  PENDING: { variant: 'yellow', label: 'Pending' },
  IN_PROGRESS: { variant: 'blue', label: 'In Progress' },
  IN_TESTING: { variant: 'purple', label: 'In Testing' },
  COMPLETED: { variant: 'green', label: 'Completed' },
  VERIFIED: { variant: 'cyan', label: 'Verified' },
};

function getCapacityPercent(dept: DeptWorkload): number {
  if (dept.capacity === 0) return 0;
  return Math.round(((dept.pending + dept.inProgress) / dept.capacity) * 100);
}

function getHeatmapBg(pct: number): string {
  if (pct < 50) return 'bg-green-50 border-green-200 hover:bg-green-100';
  if (pct <= 80) return 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100';
  return 'bg-red-50 border-red-200 hover:bg-red-100';
}

function getHeatmapAccent(pct: number): string {
  if (pct < 50) return 'bg-green-500';
  if (pct <= 80) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getHeatmapTextColor(pct: number): string {
  if (pct < 50) return 'text-green-700';
  if (pct <= 80) return 'text-yellow-700';
  return 'text-red-700';
}

function getHeatmapBadgeVariant(pct: number): 'green' | 'yellow' | 'red' {
  if (pct < 50) return 'green';
  if (pct <= 80) return 'yellow';
  return 'red';
}

function getRiskBarColor(risk: string): string {
  switch (risk) {
    case 'Breached': return 'bg-red-500';
    case 'High': return 'bg-orange-500';
    case 'Medium': return 'bg-yellow-500';
    default: return 'bg-green-500';
  }
}

function getRiskTextColor(hours: number): string {
  if (hours <= 0) return 'text-red-600';
  if (hours <= 4) return 'text-red-600';
  if (hours <= 12) return 'text-orange-600';
  if (hours <= 24) return 'text-yellow-600';
  return 'text-green-600';
}

function getRiskBadgeVariant(risk: string): 'green' | 'yellow' | 'orange' | 'red' {
  switch (risk) {
    case 'Low': return 'green';
    case 'Medium': return 'yellow';
    case 'High': return 'orange';
    case 'Breached': return 'red';
    default: return 'green';
  }
}

function getRiskRowBg(risk: string): string {
  switch (risk) {
    case 'Breached': return 'bg-red-50';
    case 'High': return 'bg-orange-50';
    case 'Medium': return 'bg-yellow-50';
    default: return '';
  }
}

function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date(new Date().toDateString());
}

function getUtilColor(pct: number): string {
  if (pct < 50) return 'bg-green-500';
  if (pct <= 75) return 'bg-blue-500';
  if (pct <= 90) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getUtilBadgeVariant(pct: number): 'green' | 'blue' | 'yellow' | 'red' {
  if (pct < 50) return 'green';
  if (pct <= 75) return 'blue';
  if (pct <= 90) return 'yellow';
  return 'red';
}

// ─── Component ──────────────────────────────────────────

export default function LabPlannerPage() {
  const navigate = useNavigate();
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedSample, setSelectedSample] = useState<PriorityItem | null>(null);

  // Fetch dashboard stats
  const { data: statsData, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => get('/dashboard/stats'),
    retry: false,
  });

  // Fetch department workload
  const { data: deptWorkloadRaw, isLoading: deptLoading } = useQuery<DeptWorkload[]>({
    queryKey: ['department-workload'],
    queryFn: () => get('/dashboard/department-workload'),
    retry: false,
  });

  // Use API data or fallback to mocks
  const deptWorkload = deptWorkloadRaw?.length ? deptWorkloadRaw : mockDeptWorkload;

  const totalInPipeline = statsData?.totalSamples
    ?? deptWorkload.reduce((s, d) => s + d.pending + d.inProgress, 0);

  const deptsAtCapacity = deptWorkload.filter((d) => getCapacityPercent(d) > 80).length;

  const avgTAT = statsData?.averageTAT ?? 3.2;
  const onTimeDelivery = statsData?.onTimePercentage ?? 87;
  const monthlyRevenue = 12_47_500;

  // Priority queue sorted by due date
  const priorityQueue = useMemo<PriorityItem[]>(() => {
    return [...mockPriorityQueue].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );
  }, []);

  const tatRiskItems = mockTatRisk;
  const forecastData = mockForecast;
  const maxForecast = Math.max(...forecastData.map((d) => Math.max(d.predicted, d.historical)));

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const overdueCount = priorityQueue.filter((p) => isOverdue(p.dueDate)).length;
  const breachedCount = tatRiskItems.filter((t) => t.riskLevel === 'Breached').length;
  const atRiskCount = tatRiskItems.filter((t) => t.riskLevel === 'Breached' || t.riskLevel === 'High').length;

  if (statsLoading && deptLoading) {
    return <Loader text="Loading lab planner..." />;
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lab Planner</h1>
          <p className="text-sm text-gray-500 mt-1">
            {today} &mdash; Lab-wide operations overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          {breachedCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg animate-pulse">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-semibold text-red-700">
                {breachedCount} TAT Breached
              </span>
            </div>
          )}
          <Button
            variant="outline"
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={() => window.location.reload()}
            size="sm"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* ─── Capacity Overview Cards ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={<FlaskConical className="h-5 w-5" />}
          label="Samples in Pipeline"
          value={totalInPipeline}
          color="blue"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          icon={<Building2 className="h-5 w-5" />}
          label="Depts at Capacity (>80%)"
          value={deptsAtCapacity}
          color={deptsAtCapacity > 0 ? 'red' : 'green'}
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Average TAT (days)"
          value={avgTAT.toFixed(1)}
          color="purple"
          trend={{ value: 5, isPositive: false }}
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="On-Time Delivery"
          value={`${onTimeDelivery}%`}
          color={onTimeDelivery >= 90 ? 'green' : onTimeDelivery >= 75 ? 'yellow' : 'red'}
          trend={{ value: 3, isPositive: true }}
        />
        <StatCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Revenue This Month"
          value={`₹${(monthlyRevenue / 100000).toFixed(1)}L`}
          color="teal"
          trend={{ value: 8, isPositive: true }}
        />
      </div>

      {/* ─── Department Heatmap Grid ─────────────────────────── */}
      <Card
        title="Department Load Heatmap"
        subtitle="Click any department to drill into its planner"
        actions={
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-green-500" /> &lt;50%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-yellow-500" /> 50-80%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-red-500" /> &gt;80%
            </span>
          </div>
        }
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {deptWorkload.map((dept) => {
            const pct = getCapacityPercent(dept);
            return (
              <div
                key={dept.departmentId}
                className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all duration-200 ${getHeatmapBg(pct)} hover:shadow-md hover:scale-[1.02]`}
                onClick={() => navigate(`/planning/department?dept=${dept.departmentId}`)}
              >
                {/* Top color accent strip */}
                <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${getHeatmapAccent(pct)}`} />

                <div className="flex items-center justify-between mb-3 mt-1">
                  <h4 className="text-sm font-bold text-gray-900 truncate">{dept.departmentName}</h4>
                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </div>

                {/* Capacity percentage */}
                <div className={`text-2xl font-bold mb-2 ${getHeatmapTextColor(pct)}`}>
                  {pct}%
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-white/60 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getHeatmapAccent(pct)}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>

                {/* Counts */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Pending</span>
                    <span className="font-semibold text-gray-700">{dept.pending}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">In Progress</span>
                    <span className="font-semibold text-gray-700">{dept.inProgress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Done Today</span>
                    <span className="font-semibold text-green-600">{dept.completedToday}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ─── Priority Queue + TAT Risk Monitor (side by side) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Priority Queue - takes 2 columns */}
        <div className="xl:col-span-2">
          <Card
            title="Priority Queue"
            subtitle={`${priorityQueue.length} urgent/critical samples across all departments`}
            noPadding
            actions={
              overdueCount > 0 ? (
                <Badge variant="red">{overdueCount} overdue</Badge>
              ) : (
                <Badge variant="green">All on track</Badge>
              )
            }
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sample Code</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Client</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Test</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Due Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Assigned To</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {priorityQueue.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-500">
                        No urgent or critical samples in queue
                      </td>
                    </tr>
                  ) : (
                    priorityQueue.map((item) => {
                      const overdue = isOverdue(item.dueDate);
                      return (
                        <tr
                          key={item.id}
                          className={`transition-colors ${
                            overdue ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-blue-50'
                          }`}
                        >
                          <td className="px-4 py-3">
                            <span className="text-sm font-semibold text-blue-600">{item.sampleCode}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{item.clientName}</td>
                          <td className="px-4 py-3">
                            <Badge variant={priorityBadge[item.priority]?.variant || 'blue'}>
                              {item.priority === 'CRITICAL' && (
                                <Zap className="h-3 w-3 mr-0.5 inline" />
                              )}
                              {priorityBadge[item.priority]?.label || item.priority}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{item.departmentName}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{item.testName}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={overdue ? 'text-red-600 font-bold' : 'text-gray-700'}>
                              {formatDate(item.dueDate)}
                              {overdue && (
                                <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white">
                                  OVERDUE
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={statusBadge[item.status]?.variant || 'gray'}>
                              {statusBadge[item.status]?.label || item.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {item.assignedTo ? (
                              <span className="text-gray-700">{item.assignedTo}</span>
                            ) : (
                              <span className="text-orange-500 font-medium italic">Unassigned</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSample(item);
                                setReassignModalOpen(true);
                              }}
                            >
                              <UserCog className="h-3 w-3" />
                              Reassign
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* TAT Risk Monitor */}
        <div className="xl:col-span-1">
          <Card
            title="TAT Risk Monitor"
            subtitle="Time remaining alerts"
            noPadding
            actions={
              <Badge variant={atRiskCount > 0 ? 'red' : 'green'}>
                {atRiskCount} at risk
              </Badge>
            }
          >
            <div className="divide-y divide-gray-100">
              {tatRiskItems.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-500">
                  No TAT risk items
                </div>
              ) : (
                tatRiskItems.map((item) => (
                  <div key={item.id} className={`px-4 py-3 ${getRiskRowBg(item.riskLevel)}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-blue-600">{item.sampleCode}</span>
                      {item.riskLevel === 'Breached' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white animate-pulse">
                          <AlertTriangle className="h-3 w-3" />
                          BREACHED
                        </span>
                      ) : (
                        <Badge variant={getRiskBadgeVariant(item.riskLevel)}>
                          {item.riskLevel}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mb-1.5">
                      {item.departmentName} &middot; {item.testName}
                    </div>
                    {/* Progress bar showing time consumed */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${getRiskBarColor(item.riskLevel)}`}
                          style={{
                            width: `${
                              item.hoursRemaining <= 0
                                ? 100
                                : Math.max(5, Math.min(100, ((item.totalHours - item.hoursRemaining) / item.totalHours) * 100))
                            }%`,
                          }}
                        />
                      </div>
                      <span className={`text-xs font-bold whitespace-nowrap ${getRiskTextColor(item.hoursRemaining)}`}>
                        {item.hoursRemaining <= 0
                          ? `${Math.abs(item.hoursRemaining)}h over`
                          : `${item.hoursRemaining}h left`}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* ─── Weekly Forecast + Resource Utilization ───────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Weekly Forecast */}
        <Card
          title="7-Day Sample Forecast"
          subtitle="Predicted load based on historical averages"
          actions={
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-3 h-1.5 rounded bg-blue-500" /> Predicted
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-1.5 rounded bg-gray-300" /> Historical
              </span>
            </div>
          }
        >
          <div className="space-y-3">
            {forecastData.map((day) => (
              <div key={day.date} className="flex items-center gap-3">
                <div className="w-20 text-sm font-medium text-gray-700 flex-shrink-0">
                  {day.day}
                </div>
                <div className="flex-1 space-y-1">
                  {/* Predicted bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-700"
                        style={{ width: `${(day.predicted / maxForecast) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-blue-600 w-8 text-right">{day.predicted}</span>
                  </div>
                  {/* Historical bar (dimmer) */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-50 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gray-300 transition-all duration-700"
                        style={{ width: `${(day.historical / maxForecast) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 w-8 text-right">{day.historical}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Resource Utilization */}
        <Card
          title="Resource Utilization"
          subtitle="Analyst occupancy per department"
          actions={
            <Badge variant="blue">
              {mockAnalystUtilization.reduce((s, d) => s + d.activeAnalysts, 0)} analysts active
            </Badge>
          }
        >
          <div className="space-y-4">
            {mockAnalystUtilization.map((dept) => (
              <div key={dept.departmentName} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{dept.departmentName}</span>
                    <span className="text-xs text-gray-400">
                      {dept.activeAnalysts}/{dept.totalAnalysts} analysts
                    </span>
                  </div>
                  <Badge variant={getUtilBadgeVariant(dept.avgLoad)}>
                    {dept.avgLoad}%
                  </Badge>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getUtilColor(dept.avgLoad)}`}
                    style={{ width: `${dept.avgLoad}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ─── Quick Actions ─────────────────────────────────────── */}
      <Card title="Quick Actions" subtitle="Common lab management operations">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            className="flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-red-200 bg-red-50/50 hover:bg-red-100 hover:border-red-300 transition-all group"
            onClick={() => toast.success(`Reassignment initiated for ${overdueCount} overdue samples`)}
          >
            <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-gray-900">Reassign Overdue</div>
              <div className="text-xs text-gray-500">{overdueCount} samples need attention</div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-gray-400 ml-auto" />
          </button>

          <button
            className="flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 hover:bg-blue-100 hover:border-blue-300 transition-all group"
            onClick={() => toast.success('Generating daily operations report...')}
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <FileText className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-gray-900">Generate Daily Report</div>
              <div className="text-xs text-gray-500">PDF with lab-wide summary</div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-gray-400 ml-auto" />
          </button>

          <button
            className="flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-orange-200 bg-orange-50/50 hover:bg-orange-100 hover:border-orange-300 transition-all group"
            onClick={() => navigate('/planning/department')}
          >
            <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <Eye className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-gray-900">View Bottlenecks</div>
              <div className="text-xs text-gray-500">{deptsAtCapacity} depts at capacity</div>
            </div>
            <ArrowUpRight className="h-4 w-4 text-gray-400 ml-auto" />
          </button>
        </div>
      </Card>

      {/* ─── Reassign Modal ──────────────────────────────────── */}
      {reassignModalOpen && selectedSample && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setReassignModalOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Reassign Sample</h3>
              <button
                onClick={() => setReassignModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <span className="sr-only">Close</span>
                &times;
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Sample</span>
                  <span className="font-medium text-gray-900">{selectedSample.sampleCode}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Test</span>
                  <span className="font-medium text-gray-900">{selectedSample.testName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Current</span>
                  <span className="font-medium text-gray-900">{selectedSample.assignedTo || 'Unassigned'}</span>
                </div>
              </div>
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Reassign to:</label>
                <div className="space-y-2">
                  {['Dr. Priya Sharma', 'Rahul Verma', 'Amit Kumar', 'Sneha Patel'].map((name) => (
                    <button
                      key={name}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
                      onClick={() => {
                        toast.success(`${selectedSample.sampleCode} reassigned to ${name}`);
                        setReassignModalOpen(false);
                      }}
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                        {name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{name}</span>
                      <ArrowRight className="h-4 w-4 text-gray-400 ml-auto" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
