import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ClipboardList,
  Clock,
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Barcode,
  FileText,
  ShoppingCart,
  Package,
  Mail,
  TicketCheck,
  Users,
  CalendarDays,
  MapPin,
  Target,
  Zap,
  Timer,
  XCircle,
  PenLine,
  BarChart3,
  ChevronRight,
  Activity,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import { get } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency, formatDate } from '../../utils/formatters';

// ─── Types ──────────────────────────────────────────────────────

interface BookingStats {
  bookedToday: number;
  bookedYesterday: number;
  pendingQueue: number;
  revenueToday: number;
  onTimeRate: number;
  amendmentRate: number;
}

interface KpiItem {
  key: string;
  label: string;
  actual: number;
  target: number;
  unit: string;
  inverse: boolean;
  trend: number;
}

interface KraItem {
  key: string;
  label: string;
  target: string;
  actual: number;
  score: number;
  weight: number;
  inverse: boolean;
}

interface PendingSample {
  id: number;
  sampleCode: string;
  client: string;
  description: string;
  priority: 'NORMAL' | 'URGENT' | 'CRITICAL';
  waitMinutes: number;
}

interface BookingRow {
  id: number;
  reportNumber: string;
  sampleCode: string;
  client: string;
  tests: number;
  amount: number;
  priority: 'NORMAL' | 'URGENT' | 'CRITICAL';
  status: string;
  timeTakenMin: number;
}

// ─── Mock data ──────────────────────────────────────────────────

const MOCK_STATS: BookingStats = {
  bookedToday: 19,
  bookedYesterday: 17,
  pendingQueue: 6,
  revenueToday: 42350,
  onTimeRate: 92.1,
  amendmentRate: 3.8,
};

const MOCK_KPIS: KpiItem[] = [
  { key: 'samples_day', label: 'Samples Booked / Day', actual: 19, target: 25, unit: '', inverse: false, trend: 5.2 },
  { key: 'avg_booking_time', label: 'Avg Booking Time', actual: 1.6, target: 2, unit: 'hrs', inverse: true, trend: -8.1 },
  { key: 'on_time_rate', label: 'On-Time Rate', actual: 92.1, target: 95, unit: '%', inverse: false, trend: 1.4 },
  { key: 'cancellation_rate', label: 'Cancellation Rate', actual: 1.2, target: 2, unit: '%', inverse: true, trend: -0.3 },
  { key: 'amendment_rate', label: 'Amendment Rate', actual: 3.8, target: 5, unit: '%', inverse: true, trend: -1.1 },
  { key: 'revenue_day', label: 'Revenue / Day', actual: 42350, target: 50000, unit: 'currency', inverse: false, trend: 6.7 },
  { key: 'barcode_same_day', label: 'Barcodes Same Day', actual: 97.5, target: 100, unit: '%', inverse: false, trend: 0.8 },
  { key: 'pending_bookings', label: 'Pending Bookings', actual: 6, target: 0, unit: '', inverse: true, trend: 2 },
];

const MOCK_KRAS: KraItem[] = [
  { key: 'accuracy', label: 'Booking Accuracy', target: '99%', actual: 97.8, score: 97.8, weight: 30, inverse: false },
  { key: 'turnaround', label: 'Booking Turnaround', target: '95%', actual: 92.1, score: 96.9, weight: 25, inverse: false },
  { key: 'volume', label: 'Daily Volume', target: '25/day', actual: 76, score: 76, weight: 20, inverse: false },
  { key: 'amendment', label: 'Amendment Rate', target: '<=5%', actual: 3.8, score: 100, weight: 15, inverse: true },
  { key: 'compliance', label: 'Client Data Compliance', target: '100%', actual: 98.5, score: 98.5, weight: 10, inverse: false },
];

const MOCK_PENDING: PendingSample[] = [
  { id: 1, sampleCode: 'AUR-2603-0112', client: 'Pharmatech Labs Pvt Ltd', description: 'Ibuprofen Tablets 200mg', priority: 'CRITICAL', waitMinutes: 285 },
  { id: 2, sampleCode: 'AUR-2603-0113', client: 'Vertex Biotech', description: 'Amoxicillin Capsules 500mg', priority: 'URGENT', waitMinutes: 192 },
  { id: 3, sampleCode: 'AUR-2603-0114', client: 'Sunlife Naturals', description: 'Vitamin D3 Drops', priority: 'NORMAL', waitMinutes: 145 },
  { id: 4, sampleCode: 'AUR-2603-0115', client: 'Medicore Inc.', description: 'Paracetamol Syrup 120mg/5ml', priority: 'URGENT', waitMinutes: 98 },
  { id: 5, sampleCode: 'AUR-2603-0116', client: 'Genova Chemicals', description: 'Cetrizine HCl Raw Material', priority: 'NORMAL', waitMinutes: 55 },
  { id: 6, sampleCode: 'AUR-2603-0117', client: 'AyurVed Organics', description: 'Ashwagandha Extract Powder', priority: 'NORMAL', waitMinutes: 22 },
];

const MOCK_BOOKINGS: BookingRow[] = [
  { id: 1, reportNumber: 'RPT-2603-0401', sampleCode: 'AUR-2603-0098', client: 'Pharmatech Labs', tests: 8, amount: 4200, priority: 'CRITICAL', status: 'BOOKED', timeTakenMin: 45 },
  { id: 2, reportNumber: 'RPT-2603-0402', sampleCode: 'AUR-2603-0099', client: 'Vertex Biotech', tests: 5, amount: 2800, priority: 'URGENT', status: 'BOOKED', timeTakenMin: 32 },
  { id: 3, reportNumber: 'RPT-2603-0403', sampleCode: 'AUR-2603-0100', client: 'Sunlife Naturals', tests: 12, amount: 6500, priority: 'NORMAL', status: 'BOOKED', timeTakenMin: 68 },
  { id: 4, reportNumber: 'RPT-2603-0404', sampleCode: 'AUR-2603-0101', client: 'Medicore Inc.', tests: 3, amount: 1500, priority: 'NORMAL', status: 'BOOKED', timeTakenMin: 18 },
  { id: 5, reportNumber: 'RPT-2603-0405', sampleCode: 'AUR-2603-0102', client: 'Genova Chemicals', tests: 6, amount: 3200, priority: 'URGENT', status: 'BOOKED', timeTakenMin: 40 },
  { id: 6, reportNumber: 'RPT-2603-0406', sampleCode: 'AUR-2603-0103', client: 'AyurVed Organics', tests: 4, amount: 2100, priority: 'NORMAL', status: 'BOOKED', timeTakenMin: 25 },
  { id: 7, reportNumber: 'RPT-2603-0407', sampleCode: 'AUR-2603-0104', client: 'NovaChem Solutions', tests: 10, amount: 5400, priority: 'NORMAL', status: 'BOOKED', timeTakenMin: 55 },
  { id: 8, reportNumber: 'RPT-2603-0408', sampleCode: 'AUR-2603-0105', client: 'LifeScience Pharma', tests: 7, amount: 3850, priority: 'URGENT', status: 'BOOKED', timeTakenMin: 48 },
  { id: 9, reportNumber: 'RPT-2603-0409', sampleCode: 'AUR-2603-0106', client: 'TruCare Health', tests: 2, amount: 1200, priority: 'NORMAL', status: 'BOOKED', timeTakenMin: 14 },
  { id: 10, reportNumber: 'RPT-2603-0410', sampleCode: 'AUR-2603-0107', client: 'BioGenics Ltd', tests: 9, amount: 4700, priority: 'NORMAL', status: 'BOOKED', timeTakenMin: 58 },
  { id: 11, reportNumber: 'RPT-2603-0411', sampleCode: 'AUR-2603-0108', client: 'Pharmatech Labs', tests: 6, amount: 3100, priority: 'NORMAL', status: 'BARCODE_PRINTED', timeTakenMin: 38 },
  { id: 12, reportNumber: 'RPT-2603-0412', sampleCode: 'AUR-2603-0109', client: 'Vertex Biotech', tests: 4, amount: 2300, priority: 'NORMAL', status: 'BARCODE_PRINTED', timeTakenMin: 22 },
  { id: 13, reportNumber: 'RPT-2603-0413', sampleCode: 'AUR-2603-0110', client: 'Medicore Inc.', tests: 5, amount: 2650, priority: 'URGENT', status: 'REGISTERED', timeTakenMin: 30 },
  { id: 14, reportNumber: 'RPT-2603-0414', sampleCode: 'AUR-2603-0111', client: 'Genova Chemicals', tests: 3, amount: 1750, priority: 'NORMAL', status: 'REGISTERED', timeTakenMin: 20 },
  { id: 15, reportNumber: 'RPT-2603-0415', sampleCode: 'AUR-2603-0112', client: 'Pharmatech Labs', tests: 8, amount: 4200, priority: 'CRITICAL', status: 'PENDING', timeTakenMin: 0 },
  { id: 16, reportNumber: 'RPT-2603-0416', sampleCode: 'AUR-2603-0113', client: 'Vertex Biotech', tests: 5, amount: 2800, priority: 'URGENT', status: 'PENDING', timeTakenMin: 0 },
  { id: 17, reportNumber: 'RPT-2603-0417', sampleCode: 'AUR-2603-0114', client: 'Sunlife Naturals', tests: 4, amount: 2100, priority: 'NORMAL', status: 'PENDING', timeTakenMin: 0 },
  { id: 18, reportNumber: 'RPT-2603-0418', sampleCode: 'AUR-2603-0115', client: 'Medicore Inc.', tests: 3, amount: 1500, priority: 'URGENT', status: 'PENDING', timeTakenMin: 0 },
  { id: 19, reportNumber: 'RPT-2603-0419', sampleCode: 'AUR-2603-0116', client: 'Genova Chemicals', tests: 6, amount: 3200, priority: 'NORMAL', status: 'PENDING', timeTakenMin: 0 },
];

// ─── Helpers ────────────────────────────────────────────────────

function getKpiProgress(kpi: KpiItem): number {
  if (kpi.inverse) {
    if (kpi.target === 0) return kpi.actual === 0 ? 100 : Math.max(0, 100 - kpi.actual * 10);
    return Math.min(100, (kpi.target / Math.max(kpi.actual, 0.01)) * 100);
  }
  if (kpi.target === 0) return 100;
  return Math.min(100, (kpi.actual / kpi.target) * 100);
}

function getKpiColor(pct: number): string {
  if (pct >= 90) return 'bg-emerald-500';
  if (pct >= 75) return 'bg-amber-500';
  return 'bg-red-500';
}

function getKpiTextColor(pct: number): string {
  if (pct >= 90) return 'text-emerald-600';
  if (pct >= 75) return 'text-amber-600';
  return 'text-red-600';
}

function getKpiBgColor(pct: number): string {
  if (pct >= 90) return 'bg-emerald-50 border-emerald-200';
  if (pct >= 75) return 'bg-amber-50 border-amber-200';
  return 'bg-red-50 border-red-200';
}

function formatKpiValue(kpi: KpiItem): string {
  if (kpi.unit === 'currency') return formatCurrency(kpi.actual);
  if (kpi.unit === '%') return `${kpi.actual}%`;
  if (kpi.unit === 'hrs') return `${kpi.actual} hrs`;
  return String(kpi.actual);
}

function formatKpiTarget(kpi: KpiItem): string {
  if (kpi.unit === 'currency') return `Target: ${formatCurrency(kpi.target)}`;
  if (kpi.unit === '%') return `Target: ${kpi.target}%`;
  if (kpi.unit === 'hrs') return `Target: ${kpi.target} hrs`;
  return `Target: ${kpi.target}`;
}

function getWaitColor(min: number): string {
  if (min < 120) return 'text-emerald-600';
  if (min < 240) return 'text-amber-600';
  return 'text-red-600';
}

function getWaitBg(min: number): string {
  if (min < 120) return 'bg-emerald-50';
  if (min < 240) return 'bg-amber-50';
  return 'bg-red-50';
}

function formatWait(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatTimeTaken(min: number): string {
  if (min === 0) return '--';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const priorityBadge: Record<string, 'red' | 'orange' | 'blue'> = {
  CRITICAL: 'red',
  URGENT: 'orange',
  NORMAL: 'blue',
};

const statusBadge: Record<string, 'green' | 'purple' | 'indigo' | 'yellow' | 'blue' | 'gray'> = {
  BOOKED: 'purple',
  BARCODE_PRINTED: 'green',
  REGISTERED: 'indigo',
  PENDING: 'yellow',
  IN_TESTING: 'blue',
  COMPLETED: 'green',
};

function getStatusLabel(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Quick Action config ────────────────────────────────────────

interface QuickAction {
  label: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  gradient: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Book Sample', description: 'Register new sample', icon: <ClipboardList className="h-6 w-6" />, path: '/booking', gradient: 'from-blue-500 to-blue-600' },
  { label: 'Generate Barcode', description: 'Print sample labels', icon: <Barcode className="h-6 w-6" />, path: '/barcodes', gradient: 'from-violet-500 to-violet-600' },
  { label: 'View Quotations', description: 'Client quotations', icon: <FileText className="h-6 w-6" />, path: '/quotations', gradient: 'from-cyan-500 to-cyan-600' },
  { label: 'Purchase Orders', description: 'Manage POs', icon: <ShoppingCart className="h-6 w-6" />, path: '/purchase-orders', gradient: 'from-emerald-500 to-emerald-600' },
  { label: 'Raise Indent', description: 'Material request', icon: <Package className="h-6 w-6" />, path: '/indents/new', gradient: 'from-amber-500 to-amber-600' },
  { label: 'Send Email', description: 'Client communication', icon: <Mail className="h-6 w-6" />, path: '/emails/compose', gradient: 'from-pink-500 to-pink-600' },
  { label: 'Create Ticket', description: 'Support request', icon: <TicketCheck className="h-6 w-6" />, path: '/tickets/new', gradient: 'from-orange-500 to-orange-600' },
  { label: 'View Clients', description: 'Client directory', icon: <Users className="h-6 w-6" />, path: '/clients', gradient: 'from-teal-500 to-teal-600' },
];

// ─── Component ──────────────────────────────────────────────────

export default function BookingDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── API queries with mock fallbacks ───────────────────────────

  const { data: stats, isLoading: statsLoading } = useQuery<BookingStats>({
    queryKey: ['booking-kpi', 'stats'],
    queryFn: async () => {
      try {
        return await get<BookingStats>('/booking-kpi/stats');
      } catch {
        return MOCK_STATS;
      }
    },
    staleTime: 60_000,
  });

  const { data: kpis, isLoading: kpisLoading } = useQuery<KpiItem[]>({
    queryKey: ['booking-kpi', 'kpis'],
    queryFn: async () => {
      try {
        return await get<KpiItem[]>('/booking-kpi/kra');
      } catch {
        return MOCK_KPIS;
      }
    },
    staleTime: 60_000,
  });

  const { data: pendingQueue, isLoading: pendingLoading } = useQuery<PendingSample[]>({
    queryKey: ['booking-kpi', 'pending-queue'],
    queryFn: async () => {
      try {
        return await get<PendingSample[]>('/booking-kpi/pending-queue');
      } catch {
        return MOCK_PENDING;
      }
    },
    staleTime: 30_000,
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery<BookingRow[]>({
    queryKey: ['booking-kpi', 'my-bookings'],
    queryFn: async () => {
      try {
        return await get<BookingRow[]>('/booking-kpi/my-bookings');
      } catch {
        return MOCK_BOOKINGS;
      }
    },
    staleTime: 30_000,
  });

  // ── Derived data ──────────────────────────────────────────────

  const overallKraScore = useMemo(() => {
    if (!MOCK_KRAS.length) return 0;
    return MOCK_KRAS.reduce((sum, k) => sum + k.score * (k.weight / 100), 0);
  }, []);

  const overallKraColor = overallKraScore >= 90 ? 'text-emerald-600' : overallKraScore >= 75 ? 'text-amber-600' : 'text-red-600';
  const overallKraBg = overallKraScore >= 90 ? 'from-emerald-500 to-emerald-600' : overallKraScore >= 75 ? 'from-amber-500 to-amber-600' : 'from-red-500 to-red-600';

  const todayStr = formatDate(new Date(), { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  // ── Loading state ─────────────────────────────────────────────

  if (statsLoading && kpisLoading && pendingLoading && bookingsLoading) {
    return <Loader size="lg" text="Loading dashboard..." fullScreen />;
  }

  const s = stats ?? MOCK_STATS;
  const kpiList = kpis ?? MOCK_KPIS;
  const queue = pendingQueue ?? MOCK_PENDING;
  const myBookings = bookings ?? MOCK_BOOKINGS;

  const bookedTrend = s.bookedYesterday > 0
    ? Math.round(((s.bookedToday - s.bookedYesterday) / s.bookedYesterday) * 100)
    : 0;

  // ── On-time rate color logic ──────────────────────────────────
  const onTimeColor = s.onTimeRate >= 90 ? 'green' : s.onTimeRate >= 75 ? 'yellow' : 'red';
  const amendmentColor = s.amendmentRate <= 5 ? 'green' : s.amendmentRate <= 10 ? 'yellow' : 'red';

  return (
    <div className="space-y-6 pb-8">
      {/* ─── 1. Header Banner ─────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-8 py-7 shadow-lg">
        {/* Decorative circles */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
        <div className="absolute -right-5 top-16 h-24 w-24 rounded-full bg-white/5" />
        <div className="absolute left-1/2 -bottom-8 h-32 w-32 rounded-full bg-white/5" />

        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-white">
                Welcome back, {user?.name ?? user?.email ?? 'User'}
              </h1>
              <Badge variant="indigo" className="bg-white/20 text-white border-0 text-xs font-semibold">
                Booking Personnel
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-blue-100 text-sm mt-2">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                {todayStr}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                Delhi Lab
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="bg-white/10 text-white hover:bg-white/20 border-0"
              icon={<Activity className="h-4 w-4" />}
              onClick={() => toast.success('Refreshing dashboard...')}
            >
              Refresh
            </Button>
            <Button
              size="sm"
              className="bg-white text-blue-700 hover:bg-blue-50 shadow"
              icon={<ClipboardList className="h-4 w-4" />}
              onClick={() => navigate('/booking')}
            >
              New Booking
            </Button>
          </div>
        </div>
      </div>

      {/* ─── 2. Stat Cards Row ────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Booked Today */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div className={`flex items-center gap-1 text-xs font-medium ${bookedTrend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {bookedTrend >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {Math.abs(bookedTrend)}% vs yesterday
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-gray-900">{s.bookedToday}</p>
            <p className="text-sm text-gray-500 mt-0.5">Booked Today</p>
          </div>
        </div>

        {/* Pending Queue */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
            {s.pendingQueue > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold animate-pulse">
                {s.pendingQueue}
              </span>
            )}
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-gray-900">{s.pendingQueue}</p>
            <p className="text-sm text-gray-500 mt-0.5">Pending Queue</p>
          </div>
        </div>

        {/* Revenue Today */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <IndianRupee className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
              <TrendingUp className="h-3.5 w-3.5" />
              6.7%
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(s.revenueToday)}</p>
            <p className="text-sm text-gray-500 mt-0.5">Revenue Today</p>
          </div>
        </div>

        {/* On-Time Rate */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${onTimeColor === 'green' ? 'bg-emerald-50 text-emerald-600' : onTimeColor === 'yellow' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
              <TrendingUp className="h-3.5 w-3.5" />
              1.4%
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-gray-900">{s.onTimeRate}%</p>
            <p className="text-sm text-gray-500 mt-0.5">On-Time Rate</p>
          </div>
        </div>

        {/* Amendment Rate */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${amendmentColor === 'green' ? 'bg-emerald-50 text-emerald-600' : amendmentColor === 'yellow' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
              <PenLine className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
              <TrendingDown className="h-3.5 w-3.5" />
              1.1%
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-gray-900">{s.amendmentRate}%</p>
            <p className="text-sm text-gray-500 mt-0.5">Amendment Rate</p>
          </div>
        </div>
      </div>

      {/* ─── 3. KPI Scorecard ─────────────────────────────────── */}
      <Card
        title="KPI Scorecard"
        subtitle="Real-time performance against targets"
        actions={
          <Badge variant="blue" className="text-xs">
            <Target className="h-3 w-3 mr-1" />
            8 KPIs Tracked
          </Badge>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiList.map((kpi) => {
            const pct = getKpiProgress(kpi);
            const barColor = getKpiColor(pct);
            const textColor = getKpiTextColor(pct);
            const bgColor = getKpiBgColor(pct);
            const trendPositive = kpi.inverse ? kpi.trend <= 0 : kpi.trend >= 0;

            return (
              <div
                key={kpi.key}
                className={`rounded-xl border p-4 transition-shadow hover:shadow-md ${bgColor}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    {kpi.label}
                  </p>
                  <div className={`flex items-center gap-0.5 text-[11px] font-semibold ${trendPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                    {trendPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(kpi.trend)}%
                  </div>
                </div>
                <p className={`text-xl font-bold ${textColor}`}>
                  {formatKpiValue(kpi)}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">{formatKpiTarget(kpi)}</p>
                <div className="mt-3 h-1.5 w-full rounded-full bg-gray-200/60">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-700 ${barColor}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1 text-right">{Math.round(pct)}% achieved</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ─── 4 & 5. KRA Performance + Booking Queue ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KRA Performance */}
        <Card
          title="KRA Performance"
          subtitle="Weighted key result areas"
          actions={
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r ${overallKraBg} text-white text-sm font-bold shadow`}>
              <BarChart3 className="h-4 w-4" />
              {overallKraScore.toFixed(1)}%
            </div>
          }
        >
          <div className="space-y-5">
            {MOCK_KRAS.map((kra) => {
              const pct = Math.min(kra.score, 100);
              const barColor = pct >= 90 ? 'bg-emerald-500' : pct >= 75 ? 'bg-amber-500' : 'bg-red-500';
              const dotColor = pct >= 90 ? 'bg-emerald-400' : pct >= 75 ? 'bg-amber-400' : 'bg-red-400';

              return (
                <div key={kra.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${dotColor}`} />
                      <span className="text-sm font-medium text-gray-800">{kra.label}</span>
                      <span className="text-[10px] text-gray-400 font-medium">
                        Weight: {kra.weight}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">Target: {kra.target}</span>
                      <span className={`text-sm font-bold ${pct >= 90 ? 'text-emerald-600' : pct >= 75 ? 'text-amber-600' : 'text-red-600'}`}>
                        {kra.score.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100">
                    <div
                      className={`h-2 rounded-full transition-all duration-700 ${barColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Overall score bar */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-900">Overall Weighted Score</span>
                <span className={`text-lg font-bold ${overallKraColor}`}>
                  {overallKraScore.toFixed(1)}%
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-gray-100">
                <div
                  className={`h-3 rounded-full bg-gradient-to-r ${overallKraBg} transition-all duration-700 shadow-sm`}
                  style={{ width: `${Math.min(overallKraScore, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Booking Queue */}
        <Card
          title="Booking Queue"
          subtitle={`${queue.length} samples waiting`}
          actions={
            <Button
              size="sm"
              variant="outline"
              icon={<ArrowRight className="h-3.5 w-3.5" />}
              onClick={() => navigate('/booking')}
            >
              View All
            </Button>
          }
          noPadding
        >
          {queue.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="h-8 w-8 text-emerald-400" />}
              title="Queue is clear"
              description="No pending samples. Great work!"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sample</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden xl:table-cell">Description</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Wait</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {queue.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-medium text-gray-900">{item.sampleCode}</td>
                      <td className="px-4 py-3 text-gray-700 max-w-[140px] truncate">{item.client}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate hidden xl:table-cell">{item.description}</td>
                      <td className="px-4 py-3">
                        <Badge variant={priorityBadge[item.priority] ?? 'blue'}>{item.priority}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md ${getWaitBg(item.waitMinutes)} ${getWaitColor(item.waitMinutes)}`}>
                          <Timer className="h-3 w-3" />
                          {formatWait(item.waitMinutes)}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <Button
                          size="sm"
                          variant="primary"
                          className="text-[11px] px-2.5 py-1"
                          icon={<Zap className="h-3 w-3" />}
                          onClick={() => {
                            toast.success(`Opening booking for ${item.sampleCode}`);
                            navigate('/booking');
                          }}
                        >
                          Book
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* ─── 6. Today's Bookings ──────────────────────────────── */}
      <Card
        title="Today's Bookings"
        subtitle={`${myBookings.length} samples processed`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="purple">{myBookings.filter(b => b.status === 'BOOKED').length} Booked</Badge>
            <Badge variant="yellow">{myBookings.filter(b => b.status === 'PENDING').length} Pending</Badge>
          </div>
        }
        noPadding
      >
        {myBookings.length === 0 ? (
          <EmptyState
            title="No bookings yet today"
            description="Start booking samples to see them here."
            action={
              <Button size="sm" onClick={() => navigate('/booking')} icon={<ClipboardList className="h-4 w-4" />}>
                Book First Sample
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Report #</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sample</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tests</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Time Taken</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {myBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-blue-600">{b.reportNumber}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-900">{b.sampleCode}</td>
                    <td className="px-4 py-3 text-gray-700">{b.client}</td>
                    <td className="px-4 py-3 text-gray-600 text-center">{b.tests}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(b.amount)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={priorityBadge[b.priority] ?? 'blue'}>{b.priority}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusBadge[b.status] ?? 'gray'}>{getStatusLabel(b.status)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatTimeTaken(b.timeTakenMin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ─── 7. Quick Actions ─────────────────────────────────── */}
      <Card title="Quick Actions" subtitle="Frequently used operations">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="group flex flex-col items-center gap-2.5 rounded-xl border border-gray-100 bg-gray-50/50 p-4 text-center transition-all hover:shadow-lg hover:-translate-y-0.5 hover:border-gray-200"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${action.gradient} text-white shadow-md group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-800 leading-tight">{action.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{action.description}</p>
              </div>
              <ChevronRight className="h-3 w-3 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
