import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Database,
  FlaskConical,
  FileText,
  BookOpen,
  Package,
  Mail,
  TicketCheck,
  ShieldCheck,
  CalendarDays,
  MapPin,
  AlertTriangle,
  CircleAlert,
  ChevronDown,
  ChevronUp,
  Award,
  Plus,
  Clock,
  CheckCircle2,
  BarChart3,
  ListChecks,
  IndianRupee,
  Layers,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { get } from '../../services/api';

// ─── Types ─────────────────────────────────────────────────

interface Stats { stpsCreatedToday: number; analytesAddedToday: number; totalActiveStps: number; incompleteStps: number; dataCompleteness: number; }
interface ActivityItem { id: number; action: string; entity: string; entityId: string; timestamp: string; description: string; }
interface KpiItem { key: string; label: string; actual: number; target: number; unit: string; inverse: boolean; }
interface KraItem { key: string; label: string; target: string; actual: number; score: number; weight: number; inverse: boolean; }
interface KpiResponse { kpis: KpiItem[]; kras: KraItem[]; overallKraScore: number; }
interface AlertItem { type: string; severity: 'red' | 'amber'; message: string; count: number; }
interface QualityField { field: string; filled: number; total: number; percentage: number; }
interface QualityResponse { total: number; fields: QualityField[]; }
interface ApiRes<T> { success: boolean; data: T; }

// ─── Mock Fallbacks ────────────────────────────────────────

const M_STATS: Stats = { stpsCreatedToday: 3, analytesAddedToday: 8, totalActiveStps: 142, incompleteStps: 7, dataCompleteness: 89.4 };
const M_ACTIVITY: ActivityItem[] = [
  { id: 1, action: 'create', entity: 'TestMaster', entityId: '15', timestamp: '2026-04-08 10:30', description: 'Created Test Master #15' },
  { id: 2, action: 'create', entity: 'TestParameter', entityId: '42', timestamp: '2026-04-08 10:15', description: 'Created Test Parameter #42' },
  { id: 3, action: 'update', entity: 'TestMaster', entityId: '8', timestamp: '2026-04-08 09:50', description: 'Updated Test Master #8' },
  { id: 4, action: 'create', entity: 'Standard', entityId: '7', timestamp: '2026-04-08 09:30', description: 'Created Standard #7' },
  { id: 5, action: 'create', entity: 'ProductType', entityId: '10', timestamp: '2026-04-08 09:00', description: 'Created Product Type #10' },
];
const M_KPIS: KpiResponse = {
  kpis: [
    { key: 'stps_created', label: 'STPs Created / Month', actual: 38, target: 50, unit: '', inverse: false },
    { key: 'analytes_added', label: 'Analytes Added / Month', actual: 72, target: 100, unit: '', inverse: false },
    { key: 'methods_uploaded', label: 'Methods Updated / Month', actual: 22, target: 30, unit: '', inverse: false },
    { key: 'pending_stps', label: 'Pending STPs', actual: 7, target: 0, unit: '', inverse: true },
    { key: 'data_completeness', label: 'Data Completeness', actual: 89.4, target: 100, unit: '%', inverse: false },
  ],
  kras: [
    { key: 'data_quality', label: 'Data Quality', target: '98%', actual: 85.2, score: 87.0, weight: 35, inverse: false },
    { key: 'stp_throughput', label: 'STP Throughput', target: '50/mo', actual: 76.0, score: 76.0, weight: 25, inverse: false },
    { key: 'standards_compliance', label: 'Standards Compliance', target: '100%', actual: 92.8, score: 92.8, weight: 20, inverse: false },
    { key: 'turnaround', label: 'Turnaround', target: '95%', actual: 95.0, score: 100, weight: 20, inverse: false },
  ],
  overallKraScore: 87.4,
};
const M_ALERTS: AlertItem[] = [
  { type: 'incomplete_stp', severity: 'amber', message: '7 STP(s) missing specification or method', count: 7 },
  { type: 'no_standard', severity: 'red', message: '3 test(s) not linked to any standard', count: 3 },
];
const M_QUALITY: QualityResponse = { total: 142, fields: [
  { field: 'Name', filled: 142, total: 142, percentage: 100 },
  { field: 'Code', filled: 140, total: 142, percentage: 98.6 },
  { field: 'Method', filled: 128, total: 142, percentage: 90.1 },
  { field: 'Unit', filled: 135, total: 142, percentage: 95.1 },
  { field: 'Department', filled: 138, total: 142, percentage: 97.2 },
  { field: 'Specification', filled: 120, total: 142, percentage: 84.5 },
  { field: 'Standard', filled: 132, total: 142, percentage: 93.0 },
  { field: 'Min Limit', filled: 115, total: 142, percentage: 81.0 },
  { field: 'Max Limit', filled: 115, total: 142, percentage: 81.0 },
] };

// ─── Helpers ───────────────────────────────────────────────

function kpiProg(kpi: KpiItem): number {
  if (kpi.inverse) { if (kpi.target === 0) return kpi.actual === 0 ? 100 : Math.max(0, 100 - kpi.actual * 10); return Math.min(100, (kpi.target / Math.max(kpi.actual, 0.01)) * 100); }
  return kpi.target === 0 ? 100 : Math.min(100, (kpi.actual / kpi.target) * 100);
}
function barC(p: number) { return p >= 90 ? 'bg-emerald-500' : p >= 75 ? 'bg-amber-500' : 'bg-red-500'; }
function txtC(p: number) { return p >= 90 ? 'text-emerald-600' : p >= 75 ? 'text-amber-600' : 'text-red-600'; }
function bgC(p: number) { return p >= 90 ? 'bg-emerald-50 border-emerald-200' : p >= 75 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'; }

const actionIcon: Record<string, { icon: string; color: string }> = {
  create: { icon: '+', color: 'bg-emerald-100 text-emerald-700' },
  update: { icon: '~', color: 'bg-blue-100 text-blue-700' },
  delete: { icon: '-', color: 'bg-red-100 text-red-700' },
};

const QUICK_ACTIONS = [
  { label: 'Create STP', icon: <Plus className="h-4 w-4" />, path: '/masters/tests', gradient: 'from-blue-500 to-blue-600' },
  { label: 'Add Analyte', icon: <FlaskConical className="h-4 w-4" />, path: '/masters/tests', gradient: 'from-violet-500 to-violet-600' },
  { label: 'Products', icon: <Layers className="h-4 w-4" />, path: '/masters/products', gradient: 'from-cyan-500 to-cyan-600' },
  { label: 'Standards', icon: <BookOpen className="h-4 w-4" />, path: '/masters/standards', gradient: 'from-emerald-500 to-emerald-600' },
  { label: 'Price List', icon: <IndianRupee className="h-4 w-4" />, path: '/masters/rates', gradient: 'from-teal-500 to-teal-600' },
  { label: 'NABL', icon: <ShieldCheck className="h-4 w-4" />, path: '/qdms/nabl', gradient: 'from-amber-500 to-amber-600' },
  { label: 'Mailer', icon: <Mail className="h-4 w-4" />, path: '/emails/compose', gradient: 'from-pink-500 to-pink-600' },
  { label: 'Ticket', icon: <TicketCheck className="h-4 w-4" />, path: '/tickets/new', gradient: 'from-orange-500 to-orange-600' },
  { label: 'Indent', icon: <Package className="h-4 w-4" />, path: '/indents/new', gradient: 'from-rose-500 to-rose-600' },
];

// ─── Component ─────────────────────────────────────────────

export default function MasterDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showExtras, setShowExtras] = useState(false);

  const { data: stats } = useQuery<Stats>({ queryKey: ['master-dash', 'stats'], queryFn: async () => { try { return (await get<ApiRes<Stats>>('/master-dashboard/stats')).data; } catch { return M_STATS; } }, refetchInterval: 60_000, staleTime: 30_000 });
  const { data: activity } = useQuery<ActivityItem[]>({ queryKey: ['master-dash', 'activity'], queryFn: async () => { try { return (await get<ApiRes<ActivityItem[]>>('/master-dashboard/recent-activity')).data; } catch { return M_ACTIVITY; } }, refetchInterval: 60_000, staleTime: 30_000 });
  const { data: kpiData } = useQuery<KpiResponse>({ queryKey: ['master-dash', 'kpis'], queryFn: async () => { try { return (await get<ApiRes<KpiResponse>>('/master-dashboard/kpis')).data; } catch { return M_KPIS; } }, refetchInterval: 300_000, staleTime: 60_000 });
  const { data: alerts } = useQuery<AlertItem[]>({ queryKey: ['master-dash', 'alerts'], queryFn: async () => { try { return (await get<ApiRes<AlertItem[]>>('/master-dashboard/alerts')).data; } catch { return M_ALERTS; } }, refetchInterval: 60_000, staleTime: 30_000 });
  const { data: quality } = useQuery<QualityResponse>({ queryKey: ['master-dash', 'quality'], queryFn: async () => { try { return (await get<ApiRes<QualityResponse>>('/master-dashboard/data-quality')).data; } catch { return M_QUALITY; } }, refetchInterval: 300_000, staleTime: 60_000 });

  const s = stats || M_STATS;
  const act = activity || M_ACTIVITY;
  const kpis = kpiData?.kpis || M_KPIS.kpis;
  const kras = kpiData?.kras || M_KPIS.kras;
  const overallKra = kpiData?.overallKraScore ?? M_KPIS.overallKraScore;
  const alrt = alerts || M_ALERTS;
  const qual = quality || M_QUALITY;

  const firstName = user?.fullName?.split(' ')[0] || 'Master';

  return (
    <div className="space-y-4">
      {/* ═══ HEADER + STATS ═══ */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-5 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9zdmc+')] opacity-50" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {firstName}</h1>
                <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-medium">Master Personnel</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-white/60 mt-1">
                <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />Master Data Management</span>
              </div>
            </div>
            <Button size="sm" className="!bg-white !text-emerald-700 hover:!bg-white/90" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => navigate('/masters/tests')}>Create STP</Button>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: 'STPs Today', value: s.stpsCreatedToday, icon: <Database className="h-3.5 w-3.5" /> },
              { label: 'Analytes', value: s.analytesAddedToday, icon: <FlaskConical className="h-3.5 w-3.5" /> },
              { label: 'Total STPs', value: s.totalActiveStps, icon: <ListChecks className="h-3.5 w-3.5" /> },
              { label: 'Incomplete', value: s.incompleteStps, icon: <AlertTriangle className="h-3.5 w-3.5" /> },
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

      {/* ═══ MAIN: Activity + KRA/KPI + Quality ═══ */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Recent Activity (8/12) */}
        <Card title="Recent Activity" subtitle={`${act.length} recent changes`} className="xl:col-span-8" noPadding>
          <div className="divide-y divide-gray-100">
            {act.map((item) => {
              const ac = actionIcon[item.action] || actionIcon.update;
              return (
                <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold ${ac.color}`}>{ac.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-800">{item.description}</div>
                    <div className="text-[11px] text-gray-400">{new Date(item.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <Badge variant={item.action === 'create' ? 'green' : item.action === 'update' ? 'blue' : 'red'}>{item.action}</Badge>
                </div>
              );
            })}
            {act.length === 0 && <div className="px-4 py-8 text-center text-sm text-gray-400">No recent activity</div>}
          </div>
        </Card>

        {/* Right Sidebar */}
        <div className="xl:col-span-4 space-y-4">
          {/* KRA Score */}
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

          {/* KPI Metrics */}
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

      {/* ═══ Data Quality Breakdown ═══ */}
      <Card title="Data Quality Breakdown" subtitle={`${qual.total} active test masters`} noPadding>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Field</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Filled</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Missing</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase w-48">Completeness</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {qual.fields.map((f) => (
                <tr key={f.field} className="hover:bg-gray-50/50">
                  <td className="px-4 py-2.5 font-medium text-gray-800">{f.field}</td>
                  <td className="px-4 py-2.5 text-center text-gray-600">{f.filled}</td>
                  <td className="px-4 py-2.5 text-center text-gray-600">{f.total - f.filled}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${barC(f.percentage)}`} style={{ width: `${f.percentage}%` }} /></div>
                      <span className={`text-xs font-semibold w-12 text-right ${txtC(f.percentage)}`}>{f.percentage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

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
