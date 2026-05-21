import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  TestTube,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Timer,
  ArrowRight,
  Play,
  Wrench,
  Power,
  PowerOff,
  ChevronDown,
  ChevronUp,
  Award,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { get } from '../../services/api';
import {
  NavyHero,
  TodayStrip,
  SparklineCard,
  type TodayItem,
} from '../../components/charts';
import {
  MOCK_HERO,
  MOCK_TODAY,
  MOCK_PERFORMANCE,
  WEEK_LABELS,
} from '../../data/mocks/analyst-dashboard.mock';

// ─── Types (work-queue only; KPIs now come from mocks per plan) ───

interface WorkQueueItem { id: number; sampleCode: string; testName: string; testCode: string; department: string; departmentCode: string; client: string; priority: 'CRITICAL' | 'URGENT' | 'NORMAL'; dueDate: string; minutesLeft: number | null; status: 'PENDING' | 'IN_PROGRESS'; }
interface EquipmentItem { id: number; name: string; code: string; department: string; status: 'active' | 'under_maintenance' | 'calibration_due' | 'out_of_service'; lastCalibration: string; nextCalibrationDate: string; pmDueSoon: boolean; }
interface ApiRes<T> { success: boolean; data: T; }

// ─── Mock fallbacks for the work-queue row ─────────────────

const MOCK_QUEUE: WorkQueueItem[] = [
  { id: 1, sampleCode: 'SMP-2026-00156', testName: 'Heavy Metals (Pb, Cd, As, Hg)', testCode: 'HM', department: 'ICPMS', departmentCode: 'ICPMS', client: 'PharmaCo Ltd', priority: 'CRITICAL', dueDate: '2026-04-07 14:00', minutesLeft: 45, status: 'IN_PROGRESS' },
  { id: 2, sampleCode: 'SMP-2026-00155', testName: 'Assay by HPLC', testCode: 'ASSY', department: 'HPLC', departmentCode: 'HPLC', client: 'Vertex Biotech', priority: 'URGENT', dueDate: '2026-04-07 16:00', minutesLeft: 165, status: 'PENDING' },
  { id: 3, sampleCode: 'SMP-2026-00154', testName: 'Dissolution Test', testCode: 'DISS', department: 'PHARMA', departmentCode: 'PHRM', client: 'Medicore Inc.', priority: 'URGENT', dueDate: '2026-04-07 17:30', minutesLeft: 255, status: 'PENDING' },
  { id: 4, sampleCode: 'SMP-2026-00153', testName: 'Microbial Limit Test', testCode: 'MLT', department: 'MICRO', departmentCode: 'MICRO', client: 'AyurVed Organics', priority: 'NORMAL', dueDate: '2026-04-08 10:00', minutesLeft: 1245, status: 'PENDING' },
];

const MOCK_EQUIPMENT: EquipmentItem[] = [
  { id: 3, name: 'UV-Vis Spectro', code: 'UV-001', department: 'HPLC', status: 'under_maintenance', lastCalibration: '2026-02-28', nextCalibrationDate: '2026-04-07', pmDueSoon: true },
  { id: 4, name: 'Karl Fischer', code: 'KF-001', department: 'PHARMA', status: 'out_of_service', lastCalibration: '2026-03-01', nextCalibrationDate: '2026-04-01', pmDueSoon: true },
];

// ─── Helpers ───────────────────────────────────────────────

function fmtTimeLeft(min: number | null) {
  if (min === null) return '-';
  if (min <= 0) return 'OVERDUE';
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
function timeColor(min: number | null) { return min === null ? 'text-gray-500' : min <= 0 ? 'text-red-600' : min < 60 ? 'text-red-600' : min < 240 ? 'text-amber-600' : 'text-emerald-600'; }
function timeBg(min: number | null) { return min === null ? 'bg-gray-50' : min <= 0 ? 'bg-red-50' : min < 60 ? 'bg-red-50' : min < 240 ? 'bg-amber-50' : 'bg-emerald-50'; }

const priCfg: Record<string, { v: 'red' | 'orange' | 'blue'; l: string }> = {
  CRITICAL: { v: 'red',    l: 'Critical' },
  URGENT:   { v: 'orange', l: 'Urgent' },
  NORMAL:   { v: 'blue',   l: 'Normal' },
};
const eqCfg: Record<string, { c: string; I: typeof Power; l: string }> = {
  active:            { c: 'text-emerald-600', I: Power,    l: 'Online' },
  out_of_service:    { c: 'text-red-600',     I: PowerOff, l: 'Offline' },
  under_maintenance: { c: 'text-amber-600',   I: Wrench,   l: 'Under PM' },
  calibration_due:   { c: 'text-orange-600',  I: Timer,    l: 'Cal. Due' },
};

// ─── Component ─────────────────────────────────────────────

export default function AnalystDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showWork, setShowWork] = useState(true);

  // Work queue & equipment still come from the existing backend; use mock fallback if missing
  const { data: workQueue } = useQuery<WorkQueueItem[]>({
    queryKey: ['analyst-dash', 'work-queue'],
    queryFn: async () => {
      try { return (await get<ApiRes<WorkQueueItem[]>>('/analyst-dashboard/work-queue')).data; }
      catch { return MOCK_QUEUE; }
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const { data: equipment } = useQuery<EquipmentItem[]>({
    queryKey: ['analyst-dash', 'equipment'],
    queryFn: async () => {
      try { return (await get<ApiRes<EquipmentItem[]>>('/analyst-dashboard/equipment')).data; }
      catch { return MOCK_EQUIPMENT; }
    },
    refetchInterval: 300_000,
    staleTime: 120_000,
  });

  const queue = workQueue || MOCK_QUEUE;
  const equip = equipment || MOCK_EQUIPMENT;
  const offlineEquip = equip.filter((e) => e.status !== 'active');

  const firstName = user?.fullName?.split(' ')[0] || 'Analyst';
  const hour = new Date().getHours();
  const greeting = useMemo(() => {
    const partOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    return `Good ${partOfDay}, ${firstName}`;
  }, [hour, firstName]);

  // ── Panel 1: Today's To-Do ──
  const todayItems: TodayItem[] = [
    {
      label: 'Calibration',
      value: MOCK_TODAY.calibrationDone ? 'Done' : 'Pending',
      status: MOCK_TODAY.calibrationDone ? 'ok' : 'alert',
    },
    { label: 'Assigned',  value: MOCK_TODAY.assignedToday },
    { label: 'Completed', value: MOCK_TODAY.completedToday },
    { label: 'Pending',   value: MOCK_TODAY.pendingToday },
    { label: 'Nearing TAT', value: MOCK_TODAY.nearingTat, status: 'alert' },
  ];

  return (
    <div className="space-y-5">
      {/* ═══ HERO: Performance Score ═══ */}
      <NavyHero
        greeting="Performance Score"
        subtitle={MOCK_HERO.periodLabel}
        score={MOCK_HERO.performanceScore.toFixed(1)}
        delta={MOCK_HERO.delta}
        status={{ label: MOCK_HERO.status, color: MOCK_HERO.status === 'On Track' ? '#16a34a' : MOCK_HERO.status === 'At Risk' ? '#d97706' : '#dc2626' }}
        panels={[
          {
            title: 'Core KPIs',
            items: [
              { t: 'Completion', value: `${MOCK_HERO.coreKpis.completion}%` },
              { t: 'On-Time',    value: `${MOCK_HERO.coreKpis.onTime}%` },
              { t: 'Accuracy',   value: `${MOCK_HERO.coreKpis.accuracy}%` },
            ],
          },
          {
            title: 'Discipline',
            items: [
              { t: 'Calibration', value: `${MOCK_HERO.discipline.calibration}%` },
              { t: 'Training',    value: `${MOCK_HERO.discipline.training}%` },
              { t: 'Attendance',  value: `${MOCK_HERO.discipline.attendance}%` },
            ],
          },
        ]}
        trend={{ labels: MOCK_HERO.trendLabels, values: MOCK_HERO.trendValues }}
      />

      {/* ═══ GREETING ROW ═══ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{greeting}</h1>
          <p className="text-sm text-slate-500 mt-0.5">Here is what is happening today</p>
        </div>
        <Button onClick={() => navigate('/analysis/results')} icon={<Play className="h-3.5 w-3.5" />}>Enter Result</Button>
      </div>

      {/* ═══ Panel 1 — Today's To-Do ═══ */}
      <TodayStrip items={todayItems} />

      {/* ═══ Panel 2 — Sample Performance (4 sparkline cards) ═══ */}
      <div>
        <div className="t-label mb-2.5">Sample Performance</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <SparklineCard
            label="Completion Rate"
            value={MOCK_PERFORMANCE.completionRate.value.toFixed(1)}
            unit="%"
            series={MOCK_PERFORMANCE.completionRate.series}
            seriesLabels={WEEK_LABELS}
            delta={MOCK_PERFORMANCE.completionRate.delta}
            footerLeft={`Target ≥ ${MOCK_PERFORMANCE.completionRate.target}%`}
            footerRight="Higher better"
            tplan="internal"
          />
          <SparklineCard
            label="On-Time"
            value={MOCK_PERFORMANCE.onTime.value.toFixed(1)}
            unit="%"
            series={MOCK_PERFORMANCE.onTime.series}
            seriesLabels={WEEK_LABELS}
            delta={MOCK_PERFORMANCE.onTime.delta}
            target={MOCK_PERFORMANCE.onTime.target}
            footerLeft={`Target ${MOCK_PERFORMANCE.onTime.target}%`}
            footerRight="Higher better"
            tplan="customer"
          />
          <SparklineCard
            label="Average TAT"
            value={MOCK_PERFORMANCE.avgTat.value.toFixed(1)}
            unit="days"
            series={MOCK_PERFORMANCE.avgTat.series}
            seriesLabels={WEEK_LABELS}
            delta={MOCK_PERFORMANCE.avgTat.delta}
            inverse
            footerLeft="Spec < 3 days"
            footerRight="Lower better"
            tplan="customer"
          />
          <SparklineCard
            label="Accuracy"
            value={MOCK_PERFORMANCE.accuracy.value.toFixed(1)}
            unit="%"
            series={MOCK_PERFORMANCE.accuracy.series}
            seriesLabels={WEEK_LABELS}
            delta={MOCK_PERFORMANCE.accuracy.delta}
            footerLeft={`Target ≥ ${MOCK_PERFORMANCE.accuracy.target}%`}
            footerRight="Higher better"
            tplan="customer"
          />
        </div>
        <div className="mt-2 text-[11px] text-slate-400 italic">
          Performance Score = (Completion + On-Time + Accuracy + Calibration + Training) ÷ 5
        </div>
      </div>

      {/* ═══ WORK QUEUE — collapsible ═══ */}
      <div>
        <button
          onClick={() => setShowWork(!showWork)}
          className="w-full flex items-center justify-between py-2 text-xs text-slate-500 hover:text-slate-700 border-b border-slate-200"
        >
          <span className="flex items-center gap-2 font-semibold uppercase tracking-wider">
            <Award className="h-3.5 w-3.5" /> My Work ({queue.length} tests)
          </span>
          {showWork ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showWork && (
          <div className="mt-3 grid grid-cols-1 xl:grid-cols-12 gap-4">
            <Card title="My Work Queue" subtitle={`${queue.length} tests`} className="xl:col-span-8" noPadding
              action={<button onClick={() => navigate('/analysis/department')} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">All <ArrowRight className="h-3 w-3" /></button>}
            >
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Sample / Test</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Client</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Priority</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Time Left</th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {queue.map((item) => (
                      <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-3 py-2.5">
                          <div className="font-medium text-blue-600 text-sm">{item.sampleCode}</div>
                          <div className="text-xs text-gray-500 truncate max-w-[220px]">{item.testName}</div>
                        </td>
                        <td className="px-3 py-2.5 text-gray-600 truncate max-w-[120px]">{item.client}</td>
                        <td className="px-3 py-2.5 text-center"><Badge variant={priCfg[item.priority]?.v || 'blue'}>{priCfg[item.priority]?.l}</Badge></td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${timeColor(item.minutesLeft)} ${timeBg(item.minutesLeft)}`}>
                            <Timer className="h-3 w-3" />{fmtTimeLeft(item.minutesLeft)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <Button size="sm" variant={item.status === 'IN_PROGRESS' ? 'primary' : 'outline'} icon={<Play className="h-3 w-3" />} onClick={() => navigate('/analysis/results')}>
                            {item.status === 'IN_PROGRESS' ? 'Continue' : 'Start'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {queue.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-400">All caught up!</td></tr>}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Mini counters sidebar */}
            <div className="xl:col-span-4 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: 'Assigned',  value: MOCK_TODAY.assignedToday,   icon: <TestTube className="h-3.5 w-3.5" />,        tone: 'bg-blue-50 text-blue-700 border-blue-200' },
                  { label: 'Completed', value: MOCK_TODAY.completedToday,  icon: <CheckCircle2 className="h-3.5 w-3.5" />,    tone: 'bg-green-50 text-green-700 border-green-200' },
                  { label: 'Pending',   value: MOCK_TODAY.pendingToday,    icon: <Clock className="h-3.5 w-3.5" />,           tone: 'bg-amber-50 text-amber-700 border-amber-200' },
                  { label: 'Nearing TAT', value: MOCK_TODAY.nearingTat,    icon: <AlertTriangle className="h-3.5 w-3.5" />,   tone: 'bg-red-50 text-red-700 border-red-200' },
                ].map((t) => (
                  <div key={t.label} className={`rounded-lg border p-3 ${t.tone}`}>
                    <div className="flex items-center gap-1.5 opacity-70 text-[10px] uppercase font-semibold">
                      {t.icon}{t.label}
                    </div>
                    <div className="t-mono font-bold text-xl mt-1">{t.value}</div>
                  </div>
                ))}
              </div>

              {offlineEquip.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Equipment Issues</h3>
                  <div className="space-y-2">
                    {offlineEquip.map((eq) => {
                      const cfg = eqCfg[eq.status] || eqCfg.active;
                      const Icon = cfg.I;
                      return (
                        <div key={eq.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon className={`h-3.5 w-3.5 shrink-0 ${cfg.c}`} />
                            <span className="text-xs text-gray-700 truncate">{eq.name}</span>
                          </div>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${eq.status === 'out_of_service' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>{cfg.l}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
