import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ClipboardList,
  Clock,
  AlertTriangle,
  Timer,
  ArrowRight,
  Play,
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
  GaugeCard,
  DonutWithLegend,
  HorizontalBarMatrix,
  LineWithTarget,
  KpiProgressTile,
  MilestoneCard,
  type TodayItem,
} from '../../components/charts';
import {
  B_MOCK_HERO,
  B_MOCK_TODAY,
  B_MOCK_PERFORMANCE,
  B_MOCK_QUALITY,
  B_MOCK_DISCIPLINE,
  B_MOCK_GROWTH,
  B_WEEK_LABELS,
} from '../../data/mocks/booking-dashboard.mock';

// ─── Types (queue only; KPIs come from mocks per plan) ─────
interface QueueItem { id: number; sampleCode: string; description: string; clientName: string; priority: string; receivedDate: string; waitHours: number; }
interface QueueResponse { queue: QueueItem[]; total: number; }
interface ApiRes<T> { success: boolean; data: T; }

const MOCK_QUEUE: QueueResponse = { queue: [
  { id: 1, sampleCode: 'SMP-2026-00230', description: 'Ibuprofen Tablets 200mg', clientName: 'Pharmatech Labs',  priority: 'express', receivedDate: '2026-04-08 08:10', waitHours: 1.2 },
  { id: 2, sampleCode: 'SMP-2026-00231', description: 'Amoxicillin Capsules',    clientName: 'Vertex Biotech',   priority: 'urgent',  receivedDate: '2026-04-08 07:30', waitHours: 2.1 },
  { id: 3, sampleCode: 'SMP-2026-00232', description: 'Vitamin D3 Drops',        clientName: 'Sunlife Naturals', priority: 'normal',  receivedDate: '2026-04-08 06:45', waitHours: 3.0 },
], total: 3 };

// ─── Helpers ───────────────────────────────────────────────
function fmtWait(hrs: number) { if (hrs < 1) return `${Math.round(hrs * 60)}m`; return `${Math.round(hrs * 10) / 10}h`; }
function waitColor(hrs: number) { return hrs > 4 ? 'text-red-600' : hrs > 2 ? 'text-amber-600' : 'text-emerald-600'; }
function waitBg(hrs: number)    { return hrs > 4 ? 'bg-red-50'    : hrs > 2 ? 'bg-amber-50'    : 'bg-emerald-50'; }

const priCfg: Record<string, { v: 'red' | 'orange' | 'blue'; l: string }> = {
  express: { v: 'red',    l: 'Express' },
  urgent:  { v: 'orange', l: 'Urgent' },
  normal:  { v: 'blue',   l: 'Normal' },
};

// ─── Component ─────────────────────────────────────────────

export default function BookingDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showWork, setShowWork] = useState(true);

  const { data: queueData } = useQuery<QueueResponse>({
    queryKey: ['booking-dash', 'queue'],
    queryFn: async () => {
      try { return (await get<ApiRes<QueueResponse>>('/booking-kpi/pending-queue')).data; }
      catch { return MOCK_QUEUE; }
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const queue = queueData?.queue || MOCK_QUEUE.queue;

  const firstName = user?.firstName || 'Booking';
  const hour = new Date().getHours();
  const greeting = useMemo(() => {
    const partOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    return `Good ${partOfDay}, ${firstName}`;
  }, [hour, firstName]);

  // ── Panel 1: Today's To-Do ──
  const todayItems: TodayItem[] = [
    {
      label: 'Log Book',
      value: B_MOCK_TODAY.logBookDone ? 'Done' : 'Pending',
      status: B_MOCK_TODAY.logBookDone ? 'ok' : 'alert',
    },
    { label: 'Assigned',          value: B_MOCK_TODAY.assignedToday },
    { label: 'Booked',            value: B_MOCK_TODAY.bookedToday },
    { label: 'Pending',           value: B_MOCK_TODAY.pendingToday },
    { label: 'Awaiting Barcode',  value: B_MOCK_TODAY.awaitingBarcode,  status: 'alert' },
    { label: 'Rebookings',        value: B_MOCK_TODAY.rebookingsToday,  status: 'alert' },
  ];

  return (
    <div className="space-y-5">
      {/* ═══ HERO: Performance Score ═══ */}
      <NavyHero
        greeting="Performance Score"
        subtitle={B_MOCK_HERO.periodLabel}
        score={B_MOCK_HERO.performanceScore.toFixed(1)}
        delta={B_MOCK_HERO.delta}
        status={{ label: B_MOCK_HERO.status, color: B_MOCK_HERO.status === 'On Track' ? '#16a34a' : B_MOCK_HERO.status === 'At Risk' ? '#d97706' : '#dc2626' }}
        panels={[
          {
            title: 'Core KPIs',
            items: [
              { t: 'Completion', value: `${B_MOCK_HERO.coreKpis.completion}%` },
              { t: 'On-Time',    value: `${B_MOCK_HERO.coreKpis.onTime}%` },
              { t: 'Accuracy',   value: `${B_MOCK_HERO.coreKpis.accuracy}%` },
            ],
          },
          {
            title: 'Discipline',
            items: [
              { t: 'Log Book',   value: `${B_MOCK_HERO.discipline.logBook}%` },
              { t: 'Training',   value: `${B_MOCK_HERO.discipline.training}%` },
              { t: 'Attendance', value: `${B_MOCK_HERO.discipline.attendance}%` },
            ],
          },
        ]}
        trend={{ labels: B_MOCK_HERO.trendLabels, values: B_MOCK_HERO.trendValues }}
      />

      {/* ═══ GREETING ROW ═══ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{greeting}</h1>
          <p className="text-sm text-slate-500 mt-0.5">Here is what is happening today</p>
        </div>
        <Button onClick={() => navigate('/booking')} icon={<ClipboardList className="h-3.5 w-3.5" />}>Book Sample</Button>
      </div>

      {/* ═══ Panel 1 — Today's To-Do ═══ */}
      <TodayStrip items={todayItems} />

      {/* ═══ Panel 2 — Booking Performance (4 sparkline cards) ═══ */}
      <div>
        <div className="t-label mb-2.5">Booking Performance</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <SparklineCard
            label="Completion Rate"
            value={B_MOCK_PERFORMANCE.completionRate.value.toFixed(1)}
            unit="%"
            series={B_MOCK_PERFORMANCE.completionRate.series}
            seriesLabels={B_WEEK_LABELS}
            delta={B_MOCK_PERFORMANCE.completionRate.delta}
            footerLeft={`Target ≥ ${B_MOCK_PERFORMANCE.completionRate.target}%`}
            footerRight="Higher better"
            tplan="internal"
          />
          <SparklineCard
            label="On-Time Booking"
            value={B_MOCK_PERFORMANCE.onTimeBooking.value.toFixed(1)}
            unit="%"
            series={B_MOCK_PERFORMANCE.onTimeBooking.series}
            seriesLabels={B_WEEK_LABELS}
            delta={B_MOCK_PERFORMANCE.onTimeBooking.delta}
            target={B_MOCK_PERFORMANCE.onTimeBooking.target}
            footerLeft={`Target ${B_MOCK_PERFORMANCE.onTimeBooking.target}%`}
            footerRight="Higher better"
            tplan="customer"
          />
          <SparklineCard
            label="Average Booking TAT"
            value={B_MOCK_PERFORMANCE.avgBookingTat.value.toFixed(1)}
            unit="hrs"
            series={B_MOCK_PERFORMANCE.avgBookingTat.series}
            seriesLabels={B_WEEK_LABELS}
            delta={B_MOCK_PERFORMANCE.avgBookingTat.delta}
            inverse
            footerLeft="SLA < 4 hrs"
            footerRight="Lower better"
            tplan="customer"
          />
          <SparklineCard
            label="Booking Accuracy"
            value={B_MOCK_PERFORMANCE.bookingAccuracy.value.toFixed(1)}
            unit="%"
            series={B_MOCK_PERFORMANCE.bookingAccuracy.series}
            seriesLabels={B_WEEK_LABELS}
            delta={B_MOCK_PERFORMANCE.bookingAccuracy.delta}
            footerLeft={`Target ≥ ${B_MOCK_PERFORMANCE.bookingAccuracy.target}%`}
            footerRight="Higher better"
            tplan="customer"
          />
        </div>
        <div className="mt-2 text-[11px] text-slate-400 italic">
          Performance Score = (Completion + On-Time + Accuracy + Log Book + Training) ÷ 5
        </div>

        {/* SLA Counters strip */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {[
            { label: 'Assigned',    value: B_MOCK_PERFORMANCE.samplesAssigned, tone: 'bg-blue-50 text-blue-700 border-blue-200',     icon: <ClipboardList className="h-3.5 w-3.5" /> },
            { label: 'Booked',      value: B_MOCK_PERFORMANCE.samplesBooked,   tone: 'bg-green-50 text-green-700 border-green-200',  icon: <Play className="h-3.5 w-3.5" /> },
            { label: 'Pending',     value: B_MOCK_PERFORMANCE.samplesPending,  tone: 'bg-amber-50 text-amber-700 border-amber-200',  icon: <Clock className="h-3.5 w-3.5" /> },
            { label: 'SLA Breached', value: B_MOCK_PERFORMANCE.slaBreached,    tone: 'bg-red-50 text-red-700 border-red-200',        icon: <AlertTriangle className="h-3.5 w-3.5" />, sub: `▲ ${B_MOCK_PERFORMANCE.severelyLate} samples > 8 hrs late` },
            { label: '> 8 hrs Late', value: B_MOCK_PERFORMANCE.severelyLate,   tone: 'bg-red-100 text-red-800 border-red-300',       icon: <Timer className="h-3.5 w-3.5" /> },
          ].map((t) => (
            <div key={t.label} className={`rounded-lg border p-3 ${t.tone}`}>
              <div className="flex items-center gap-1.5 opacity-70 text-[10px] uppercase font-semibold">
                {t.icon}{t.label}
              </div>
              <div className="t-mono font-bold text-xl mt-1">{t.value}</div>
              {t.sub && <div className="text-[10px] opacity-80 mt-0.5">{t.sub}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* ═══ Panel 3 — Quality & Rework ═══ */}
      <div>
        <div className="t-label mb-2.5">Quality & Rework</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          <KpiProgressTile
            label="Rebooking Count"
            value={B_MOCK_QUALITY.rebookingCount.value}
            percent={Math.min(100, B_MOCK_QUALITY.rebookingCount.value * 3)}
            tone={B_MOCK_QUALITY.rebookingCount.delta > 0 ? 'red' : 'green'}
            footerLeft="This month"
            footerRight={`${B_MOCK_QUALITY.rebookingCount.delta > 0 ? '▲' : '▼'} ${Math.abs(B_MOCK_QUALITY.rebookingCount.delta)} vs prev`}
            tplan="internal"
          />
          <LineWithTarget
            title="Rebooking Rate"
            bigValue={B_MOCK_QUALITY.rebookingRate.value.toFixed(1)}
            bigUnit="%"
            deltaChip={{ value: B_MOCK_QUALITY.rebookingRate.delta, inverse: true }}
            labels={B_WEEK_LABELS}
            actual={B_MOCK_QUALITY.rebookingRate.series}
            targetValue={B_MOCK_QUALITY.rebookingRate.target}
            subtitle={`Target ≤ ${B_MOCK_QUALITY.rebookingRate.target}%`}
          />
          <DonutWithLegend
            title="Rebooking Reasons"
            subtitle={`Total: ${B_MOCK_QUALITY.rebookingReasons.reduce((a, s) => a + s.value, 0)}`}
            slices={B_MOCK_QUALITY.rebookingReasons}
            tplan="internal"
          />
          <GaugeCard
            label="Barcode Accuracy"
            value={B_MOCK_QUALITY.barcodeAccuracy.value}
            sub={`Target ≥ ${B_MOCK_QUALITY.barcodeAccuracy.target}%`}
            target={B_MOCK_QUALITY.barcodeAccuracy.target}
            tplan="customer"
          />
          <KpiProgressTile
            label="Booking Errors (QA)"
            value={B_MOCK_QUALITY.bookingErrorsQa}
            percent={Math.min(100, B_MOCK_QUALITY.bookingErrorsQa * 10)}
            tone={B_MOCK_QUALITY.bookingErrorsQa > 3 ? 'red' : 'amber'}
            footerLeft="This month"
            footerRight="Target: 0"
            tplan="internal"
          />
          <KpiProgressTile
            label="Customer Complaints"
            value={B_MOCK_QUALITY.customerComplaints}
            percent={Math.min(100, B_MOCK_QUALITY.customerComplaints * 20)}
            tone={B_MOCK_QUALITY.customerComplaints > 0 ? 'red' : 'green'}
            footerLeft="This month"
            footerRight="Target: 0"
            tplan="customer"
          />
        </div>
      </div>

      {/* ═══ Panel 4 — Daily Discipline ═══ */}
      <div>
        <div className="t-label mb-2.5">Daily Discipline</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <GaugeCard
            label="Log Book Compliance"
            value={B_MOCK_DISCIPLINE.logBookCompliance.pct}
            sub={B_MOCK_DISCIPLINE.logBookCompliance.sub}
            target={100}
            tplan="internal"
          />
          <GaugeCard
            label="Barcode Same-Day"
            value={B_MOCK_DISCIPLINE.barcodeSameDay.pct}
            sub={B_MOCK_DISCIPLINE.barcodeSameDay.sub}
            target={95}
            tplan="internal"
          />
          <GaugeCard
            label="Attendance"
            value={B_MOCK_DISCIPLINE.attendance.pct}
            sub={B_MOCK_DISCIPLINE.attendance.sub}
            target={95}
            tplan="financial"
          />
        </div>
      </div>

      {/* ═══ Panel 5 — Learning & Growth ═══ */}
      <div>
        <div className="t-label mb-2.5">Learning & Growth</div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5">
          {/* Training tiles (4/12) */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-2.5">
            <KpiProgressTile
              label="Training Assigned"
              value={B_MOCK_GROWTH.training.assigned}
              percent={100}
              tone="blue"
              footerLeft="Target: 5"
              tplan="learning"
            />
            <KpiProgressTile
              label="Completed"
              value={B_MOCK_GROWTH.training.completed}
              percent={(B_MOCK_GROWTH.training.completed / B_MOCK_GROWTH.training.assigned) * 100}
              tone="green"
              progress={`${B_MOCK_GROWTH.training.completed} / ${B_MOCK_GROWTH.training.assigned}`}
              footerLeft={B_MOCK_GROWTH.training.completedNames}
              tplan="learning"
            />
            <KpiProgressTile
              label="Pending"
              value={B_MOCK_GROWTH.training.pending}
              percent={Math.min(100, (B_MOCK_GROWTH.training.pending / B_MOCK_GROWTH.training.assigned) * 100)}
              tone="amber"
              footerLeft={B_MOCK_GROWTH.training.pendingNames}
              tplan="learning"
            />
            <KpiProgressTile
              label="Training Hours (YTD)"
              value={B_MOCK_GROWTH.training.hoursYtd}
              unit="hrs"
              percent={(B_MOCK_GROWTH.training.hoursYtd / B_MOCK_GROWTH.training.hoursTarget) * 100}
              tone="blue"
              progress={`${B_MOCK_GROWTH.training.hoursYtd} / ${B_MOCK_GROWTH.training.hoursTarget}`}
              footerLeft="Annual target"
              tplan="learning"
            />
          </div>

          {/* Skills matrix (5/12) */}
          <div className="lg:col-span-5">
            <HorizontalBarMatrix
              title="Skill Matrix"
              subtitle="Level 1–5 (Target ≥ 3)"
              skills={B_MOCK_GROWTH.skills}
              targetLevel={3}
              tplan="learning"
            />
          </div>

          {/* Growth path (3/12) */}
          <div className="lg:col-span-3 space-y-2.5">
            <LineWithTarget
              title="Growth Path"
              subtitle={`${B_MOCK_GROWTH.growthPath.currentRole} → ${B_MOCK_GROWTH.growthPath.nextRole}`}
              bigValue={`${B_MOCK_GROWTH.growthPath.progressPct}`}
              bigUnit="%"
              labels={B_MOCK_GROWTH.growthPath.labels}
              actual={B_MOCK_GROWTH.growthPath.actual as number[]}
              target={B_MOCK_GROWTH.growthPath.target}
            />
          </div>
        </div>

        {/* Milestone card — full width */}
        <div className="mt-2.5">
          <MilestoneCard
            label="Next Milestone"
            title={B_MOCK_GROWTH.milestone.title}
            description={B_MOCK_GROWTH.milestone.description}
            items={B_MOCK_GROWTH.milestone.items}
            tplan="learning"
          />
        </div>
      </div>

      {/* ═══ BOOKING QUEUE — collapsible ═══ */}
      <div>
        <button
          onClick={() => setShowWork(!showWork)}
          className="w-full flex items-center justify-between py-2 text-xs text-slate-500 hover:text-slate-700 border-b border-slate-200"
        >
          <span className="flex items-center gap-2 font-semibold uppercase tracking-wider">
            <Award className="h-3.5 w-3.5" /> My Work ({queue.length} samples)
          </span>
          {showWork ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {showWork && (
          <div className="mt-3 grid grid-cols-1 xl:grid-cols-12 gap-4">
            <Card
              title="Booking Queue"
              subtitle={`${queue.length} samples waiting`}
              className="xl:col-span-8"
              noPadding
              actions={<button onClick={() => navigate('/booking')} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">All <ArrowRight className="h-3 w-3" /></button>}
            >
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Sample / Client</th>
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Priority</th>
                      <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Wait</th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {queue.map((item) => (
                      <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-3 py-2.5">
                          <div className="font-medium text-blue-600 text-sm">{item.sampleCode}</div>
                          <div className="text-xs text-gray-500">{item.clientName}</div>
                        </td>
                        <td className="px-3 py-2.5 text-gray-600 truncate max-w-[180px]">{item.description}</td>
                        <td className="px-3 py-2.5 text-center"><Badge variant={priCfg[item.priority]?.v || 'blue'}>{priCfg[item.priority]?.l || item.priority}</Badge></td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${waitColor(item.waitHours)} ${waitBg(item.waitHours)}`}>
                            <Timer className="h-3 w-3" />{fmtWait(item.waitHours)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <Button size="sm" variant="primary" icon={<Play className="h-3 w-3" />} onClick={() => navigate('/booking')}>Book</Button>
                        </td>
                      </tr>
                    ))}
                    {queue.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-400">No samples in queue</td></tr>}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Mini counters sidebar */}
            <div className="xl:col-span-4 space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: 'Assigned',         value: B_MOCK_TODAY.assignedToday,   icon: <ClipboardList className="h-3.5 w-3.5" />, tone: 'bg-blue-50 text-blue-700 border-blue-200' },
                  { label: 'Booked',           value: B_MOCK_TODAY.bookedToday,     icon: <Play className="h-3.5 w-3.5" />,          tone: 'bg-green-50 text-green-700 border-green-200' },
                  { label: 'Pending',          value: B_MOCK_TODAY.pendingToday,    icon: <Clock className="h-3.5 w-3.5" />,         tone: 'bg-amber-50 text-amber-700 border-amber-200' },
                  { label: 'Awaiting Barcode', value: B_MOCK_TODAY.awaitingBarcode, icon: <AlertTriangle className="h-3.5 w-3.5" />, tone: 'bg-red-50 text-red-700 border-red-200' },
                ].map((t) => (
                  <div key={t.label} className={`rounded-lg border p-3 ${t.tone}`}>
                    <div className="flex items-center gap-1.5 opacity-70 text-[10px] uppercase font-semibold">
                      {t.icon}{t.label}
                    </div>
                    <div className="t-mono font-bold text-xl mt-1">{t.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
