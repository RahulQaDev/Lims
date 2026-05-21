import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  AlertTriangle,
  CircleAlert,
  CalendarDays,
  MapPin,
  ChevronDown,
  ChevronUp,
  Award,
  BookOpen,
  FileText,
  Mail,
  TicketCheck,
  Package,
  Database,
  IndianRupee,
  FlaskConical,
  Layers,
  ArrowRight,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { get } from '../../services/api';

// ─── Types ─────────────────────────────────────────────────

interface Stats { stpsCreatedToday: number; analytesToday: number; approvedToday: number; rejectedToday: number; pendingItems: number; dataCompleteness: number; }
interface QueueItem { id: number; name: string; code: string; department: string; standard: string; paramCount: number; hasMethod: boolean; hasSpec: boolean; hasLimits: boolean; isAccredited: boolean; issues: string[]; createdAt: string; }
interface KpiItem { key: string; label: string; actual: number; target: number; unit: string; inverse: boolean; }
interface KraItem { key: string; label: string; target: string; actual: number; score: number; weight: number; inverse: boolean; }
interface KpiResponse { kpis: KpiItem[]; kras: KraItem[]; overallKraScore: number; }
interface AlertItem { type: string; severity: 'red' | 'amber'; message: string; count: number; }
interface ReviewItem { id: number; action: string; entity: string; entityId: string; timestamp: string; description: string; }
interface ApiRes<T> { success: boolean; data: T; }

// ─── Mock Fallbacks ────────────────────────────────────────

const M_STATS: Stats = { stpsCreatedToday: 4, analytesToday: 12, approvedToday: 5, rejectedToday: 1, pendingItems: 7, dataCompleteness: 82.5 };
const M_QUEUE: QueueItem[] = [
  { id: 1, name: 'Lead Content', code: 'PB', department: 'ICPMS', standard: 'Not linked', paramCount: 0, hasMethod: false, hasSpec: false, hasLimits: false, isAccredited: false, issues: ['No method', 'No specification', 'No standard', 'No parameters'], createdAt: '2026-04-08' },
  { id: 2, name: 'Mercury Analysis', code: 'HG', department: 'ICPMS', standard: 'Not linked', paramCount: 0, hasMethod: true, hasSpec: false, hasLimits: false, isAccredited: false, issues: ['No specification', 'No standard', 'No parameters'], createdAt: '2026-04-08' },
  { id: 3, name: 'Vitamin C Assay', code: 'VITC', department: 'HPLC', standard: 'IS10500', paramCount: 0, hasMethod: false, hasSpec: true, hasLimits: false, isAccredited: false, issues: ['No method', 'No parameters'], createdAt: '2026-04-08' },
];
const M_KPIS: KpiResponse = {
  kpis: [
    { key: 'reviewed_month', label: 'Reviewed / Month', actual: 42, target: 80, unit: '', inverse: false },
    { key: 'approved_month', label: 'Approved / Month', actual: 38, target: 70, unit: '', inverse: false },
    { key: 'rejection_rate', label: 'Rejection Rate', actual: 9.5, target: 10, unit: '%', inverse: true },
    { key: 'pending_review', label: 'Pending Review', actual: 7, target: 0, unit: '', inverse: true },
    { key: 'data_quality', label: 'Data Quality', actual: 82.5, target: 98, unit: '%', inverse: false },
  ],
  kras: [
    { key: 'review_throughput', label: 'Review Throughput', target: '80/mo', actual: 52.5, score: 52.5, weight: 30, inverse: false },
    { key: 'data_quality', label: 'Data Quality Oversight', target: '98%', actual: 82.5, score: 84.2, weight: 25, inverse: false },
    { key: 'nabl_compliance', label: 'NABL Compliance', target: '100%', actual: 76.5, score: 76.5, weight: 25, inverse: false },
    { key: 'turnaround', label: 'Review Turnaround', target: '95%', actual: 95, score: 100, weight: 20, inverse: false },
  ],
  overallKraScore: 76.2,
};
const M_ALERTS: AlertItem[] = [
  { type: 'incomplete', severity: 'amber', message: '7 STP(s) pending your review', count: 7 },
  { type: 'no_standard', severity: 'red', message: '2 test(s) not linked to any standard', count: 2 },
];
const M_REVIEWS: ReviewItem[] = [];

// ─── Helpers ───────────────────────────────────────────────

function kpiProg(kpi: KpiItem): number {
  if (kpi.inverse) { if (kpi.target === 0) return kpi.actual === 0 ? 100 : Math.max(0, 100 - kpi.actual * 10); return Math.min(100, (kpi.target / Math.max(kpi.actual, 0.01)) * 100); }
  return kpi.target === 0 ? 100 : Math.min(100, (kpi.actual / kpi.target) * 100);
}
function barC(p: number) { return p >= 90 ? 'bg-emerald-500' : p >= 75 ? 'bg-amber-500' : 'bg-red-500'; }
function txtC(p: number) { return p >= 90 ? 'text-emerald-600' : p >= 75 ? 'text-amber-600' : 'text-red-600'; }
function bgC(p: number) { return p >= 90 ? 'bg-emerald-50 border-emerald-200' : p >= 75 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'; }

const actionCfg: Record<string, { icon: string; color: string }> = {
  approve: { icon: '\u2713', color: 'bg-emerald-100 text-emerald-700' },
  reject: { icon: '\u2717', color: 'bg-red-100 text-red-700' },
  update: { icon: '~', color: 'bg-blue-100 text-blue-700' },
  create: { icon: '+', color: 'bg-violet-100 text-violet-700' },
};

const QUICK_ACTIONS = [
  { label: 'Review STPs', icon: <Database className="h-4 w-4" />, path: '/masters/tests', gradient: 'from-blue-500 to-blue-600' },
  { label: 'Standards', icon: <BookOpen className="h-4 w-4" />, path: '/masters/standards', gradient: 'from-violet-500 to-violet-600' },
  { label: 'Products', icon: <Layers className="h-4 w-4" />, path: '/masters/products', gradient: 'from-cyan-500 to-cyan-600' },
  { label: 'NABL', icon: <ShieldCheck className="h-4 w-4" />, path: '/qdms/nabl', gradient: 'from-emerald-500 to-emerald-600' },
  { label: 'Price List', icon: <IndianRupee className="h-4 w-4" />, path: '/masters/rates', gradient: 'from-teal-500 to-teal-600' },
  { label: 'TRF Table', icon: <FileText className="h-4 w-4" />, path: '/samples/tracking', gradient: 'from-amber-500 to-amber-600' },
  { label: 'Mailer', icon: <Mail className="h-4 w-4" />, path: '/emails/compose', gradient: 'from-pink-500 to-pink-600' },
  { label: 'Ticket', icon: <TicketCheck className="h-4 w-4" />, path: '/tickets/new', gradient: 'from-orange-500 to-orange-600' },
  { label: 'Indent', icon: <Package className="h-4 w-4" />, path: '/indents/new', gradient: 'from-rose-500 to-rose-600' },
];

// ─── Component ─────────────────────────────────────────────

export default function MasterControllerDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showExtras, setShowExtras] = useState(false);

  const { data: stats } = useQuery<Stats>({ queryKey: ['mc-dash', 'stats'], queryFn: async () => { try { return (await get<ApiRes<Stats>>('/master-controller-dashboard/stats')).data; } catch { return M_STATS; } }, refetchInterval: 60_000, staleTime: 30_000 });
  const { data: queue } = useQuery<QueueItem[]>({ queryKey: ['mc-dash', 'queue'], queryFn: async () => { try { return (await get<ApiRes<QueueItem[]>>('/master-controller-dashboard/approval-queue')).data; } catch { return M_QUEUE; } }, refetchInterval: 60_000, staleTime: 30_000 });
  const { data: kpiData } = useQuery<KpiResponse>({ queryKey: ['mc-dash', 'kpis'], queryFn: async () => { try { return (await get<ApiRes<KpiResponse>>('/master-controller-dashboard/kpis')).data; } catch { return M_KPIS; } }, refetchInterval: 300_000, staleTime: 60_000 });
  const { data: alerts } = useQuery<AlertItem[]>({ queryKey: ['mc-dash', 'alerts'], queryFn: async () => { try { return (await get<ApiRes<AlertItem[]>>('/master-controller-dashboard/alerts')).data; } catch { return M_ALERTS; } }, refetchInterval: 60_000, staleTime: 30_000 });
  const { data: reviews } = useQuery<ReviewItem[]>({ queryKey: ['mc-dash', 'reviews'], queryFn: async () => { try { return (await get<ApiRes<ReviewItem[]>>('/master-controller-dashboard/recent-activity')).data; } catch { return M_REVIEWS; } }, refetchInterval: 60_000, staleTime: 30_000 });

  const s = stats || M_STATS;
  const q = queue || M_QUEUE;
  const kpis = kpiData?.kpis || M_KPIS.kpis;
  const kras = kpiData?.kras || M_KPIS.kras;
  const overallKra = kpiData?.overallKraScore ?? M_KPIS.overallKraScore;
  const alrt = alerts || M_ALERTS;
  const rev = reviews || M_REVIEWS;
  const firstName = user?.fullName?.split(' ')[0] || 'Controller';

  return (
    <div className="space-y-4">
      {/* ═══ HEADER + STATS ═══ */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-700 rounded-2xl p-5 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9zdmc+')] opacity-50" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {firstName}</h1>
                <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-medium">Master Controller</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-white/60 mt-1">
                <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />Master Data Approval</span>
              </div>
            </div>
            <Button size="sm" className="!bg-white !text-purple-700 hover:!bg-white/90" icon={<ShieldCheck className="h-3.5 w-3.5" />} onClick={() => navigate('/masters/tests')}>Review STPs</Button>
          </div>
          <div className="grid grid-cols-6 gap-2.5">
            {[
              { label: 'STPs Today', value: s.stpsCreatedToday, icon: <Database className="h-3.5 w-3.5" /> },
              { label: 'Analytes', value: s.analytesToday, icon: <FlaskConical className="h-3.5 w-3.5" /> },
              { label: 'Approved', value: s.approvedToday, icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
              { label: 'Rejected', value: s.rejectedToday, icon: <XCircle className="h-3.5 w-3.5" /> },
              { label: 'Pending', value: s.pendingItems, icon: <Clock className="h-3.5 w-3.5" /> },
              { label: 'Complete', value: `${s.dataCompleteness}%`, icon: <BarChart3 className="h-3.5 w-3.5" /> },
            ].map((item) => (
              <div key={item.label} className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2.5 text-center">
                <div className="flex items-center justify-center gap-1.5 text-white/60 mb-1">{item.icon}<span className="text-[10px] uppercase tracking-wider">{item.label}</span></div>
                <div className="text-xl font-bold">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ ALERTS ═══ */}
      {alrt.length > 0 && (
        <div className="space-y-2">
          {alrt.map((a, i) => (
            <div key={i} className={`flex items-center gap-3 rounded-xl px-4 py-2.5 ${a.severity === 'red' ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
              {a.severity === 'red' ? <CircleAlert className="h-4 w-4 text-red-500 shrink-0" /> : <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />}
              <span className={`text-sm flex-1 ${a.severity === 'red' ? 'text-red-700' : 'text-amber-700'}`}>{a.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* ═══ MAIN: Approval Queue + KRA/KPI ═══ */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Approval Queue (8/12) */}
        <Card title="STP Review Queue" subtitle={`${q.length} tests to review`} className="xl:col-span-8" noPadding
          action={<button onClick={() => navigate('/masters/tests')} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">All <ArrowRight className="h-3 w-3" /></button>}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Test / Dept</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Standard</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Params</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Issues</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase w-36">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {q.map((item) => (
                  <tr key={item.id} className="hover:bg-purple-50/50 transition-colors">
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                      <div className="text-xs text-gray-400">{item.code} — {item.department}</div>
                    </td>
                    <td className="px-3 py-2.5 text-sm text-gray-600">{item.standard}</td>
                    <td className="px-3 py-2.5 text-center"><span className={`text-xs font-semibold ${item.paramCount > 0 ? 'text-emerald-600' : 'text-red-600'}`}>{item.paramCount}</span></td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {item.issues.slice(0, 3).map((issue) => (
                          <span key={issue} className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 font-medium">{issue}</span>
                        ))}
                        {item.issues.length > 3 && <span className="text-[10px] text-gray-400">+{item.issues.length - 3}</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button size="sm" variant="primary" icon={<CheckCircle2 className="h-3 w-3" />}>Approve</Button>
                        <Button size="sm" variant="outline" className="!text-red-600 !border-red-200 hover:!bg-red-50" icon={<XCircle className="h-3 w-3" />}>Reject</Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {q.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-400">No tests pending review</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Right Sidebar */}
        <div className="xl:col-span-4 space-y-4">
          <div className={`rounded-xl border p-4 ${bgC(overallKra)}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><Award className="h-4 w-4" /><span className="text-sm font-semibold">KRA Score</span></div>
              <span className={`text-2xl font-bold ${txtC(overallKra)}`}>{overallKra}%</span>
            </div>
            <div className="space-y-2">
              {kras.map((k) => {
                const pct = Math.min(100, k.score);
                return (
                  <div key={k.key} className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 w-28 truncate">{k.label}</span>
                    <div className="flex-1 h-1.5 bg-white/60 rounded-full overflow-hidden"><div className={`h-full rounded-full ${barC(pct)}`} style={{ width: `${pct}%` }} /></div>
                    <span className={`text-[11px] font-semibold w-10 text-right ${txtC(pct)}`}>{Math.round(pct)}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">KPI Metrics</h3>
            <div className="space-y-2.5">
              {kpis.map((kpi) => {
                const pct = kpiProg(kpi);
                return (
                  <div key={kpi.key}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs text-gray-600">{kpi.label}</span>
                      <span className={`text-xs font-semibold ${txtC(pct)}`}>
                        {kpi.unit === '%' ? `${kpi.actual}%` : kpi.actual}
                        {kpi.target > 0 && <span className="text-gray-400 font-normal"> / {kpi.unit === '%' ? `${kpi.target}%` : kpi.target}</span>}
                      </span>
                    </div>
                    {kpi.target > 0 && <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${barC(pct)}`} style={{ width: `${Math.min(pct, 100)}%` }} /></div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Recent Reviews ═══ */}
      {rev.length > 0 && (
        <Card title="Recent Reviews" subtitle="Your review activity" noPadding>
          <div className="divide-y divide-gray-100">
            {rev.map((item) => {
              const ac = actionCfg[item.action] || actionCfg.update;
              return (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold ${ac.color}`}>{ac.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-800">{item.description}</div>
                    <div className="text-[11px] text-gray-400">{new Date(item.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <Badge variant={item.action === 'approve' ? 'green' : item.action === 'reject' ? 'red' : 'blue'}>{item.action}</Badge>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ═══ TOGGLE: Quick Actions ═══ */}
      <button onClick={() => setShowExtras(!showExtras)} className="w-full flex items-center justify-center gap-2 py-2 text-xs text-gray-500 hover:text-gray-700 transition-colors">
        {showExtras ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        {showExtras ? 'Hide' : 'Show'} Quick Actions
      </button>
      {showExtras && (
        <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
          {QUICK_ACTIONS.map((a) => (
            <button key={a.label} onClick={() => navigate(a.path)} className="group flex flex-col items-center gap-1.5 rounded-lg border border-gray-200 bg-white p-3 hover:shadow-sm hover:border-gray-300 transition-all">
              <div className={`w-8 h-8 rounded-md bg-gradient-to-br ${a.gradient} text-white flex items-center justify-center group-hover:scale-110 transition-transform`}>{a.icon}</div>
              <span className="text-[11px] font-medium text-gray-700">{a.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
