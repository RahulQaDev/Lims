import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ClipboardCheck,
  Package,
  Clock,
  AlertTriangle,
  Timer,
  Target,
  ArrowRight,
  Play,
  FileText,
  Mail,
  TicketCheck,
  CalendarDays,
  MapPin,
  CircleAlert,
  RefreshCw,
  PackagePlus,
  Users,
  Search,
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  Award,
  CheckCircle2,
  XCircle,
  UserPlus,
  ShieldAlert,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { get } from '../../services/api';

// ─── Types ─────────────────────────────────────────────────

interface Stats { processedToday: number; receivedToday: number; pendingTrfs: number; avgProcessingTime: number; approvalRate: number; }
interface TrfItem { id: number; sampleCode: string; client: string; clientCode: string; isNewClient: boolean; description: string; productType: string; priority: 'EXPRESS' | 'URGENT' | 'NORMAL'; condition: string; receivedDate: string; waitMinutes: number; }
interface ReceivedSample { id: number; sampleCode: string; client: string; description: string; condition: string; priority: 'EXPRESS' | 'URGENT' | 'NORMAL'; status: string; receivedDate: string; }
interface KpiItem { key: string; label: string; actual: number; target: number; unit: string; inverse: boolean; }
interface KraItem { key: string; label: string; target: string; actual: number; score: number; weight: number; inverse: boolean; }
interface KpiResponse { kpis: KpiItem[]; kras: KraItem[]; overallKraScore: number; }
interface AlertItem { type: string; severity: 'red' | 'amber'; message: string; count: number; }
interface ActivityItem { id: number; sampleCode: string; client: string; description: string; status: string; priority: string; condition: string; timestamp: string; }
interface ApiRes<T> { success: boolean; data: T; }

// ─── Mock Fallbacks ────────────────────────────────────────

const M_STATS: Stats = { processedToday: 22, receivedToday: 18, pendingTrfs: 4, avgProcessingTime: 7.2, approvalRate: 96.5 };
const M_QUEUE: TrfItem[] = [
  { id: 1, sampleCode: 'SMP-2026-00210', client: 'PharmaCo Ltd', clientCode: 'CLI00001', isNewClient: false, description: 'Paracetamol Tablets 500mg', productType: 'Pharmaceutical', priority: 'EXPRESS', condition: 'intact', receivedDate: '2026-04-08 09:10', waitMinutes: 15 },
  { id: 2, sampleCode: 'SMP-2026-00211', client: 'New Biotech Inc', clientCode: '', isNewClient: true, description: 'Herbal Extract Sample', productType: 'Herbal Products', priority: 'URGENT', condition: 'intact', receivedDate: '2026-04-08 08:45', waitMinutes: 40 },
  { id: 3, sampleCode: 'SMP-2026-00212', client: 'AquaPure Inc', clientCode: 'CLI00002', isNewClient: false, description: 'Drinking Water Sample', productType: 'Water Testing', priority: 'NORMAL', condition: 'intact', receivedDate: '2026-04-08 08:20', waitMinutes: 65 },
  { id: 4, sampleCode: 'SMP-2026-00213', client: 'FoodSafe Corp', clientCode: 'CLI00004', isNewClient: false, description: 'Wheat Flour - Batch WF-442', productType: 'Food Testing', priority: 'NORMAL', condition: 'damaged', receivedDate: '2026-04-08 07:50', waitMinutes: 95 },
];
const M_RECEIVED: ReceivedSample[] = [
  { id: 10, sampleCode: 'SMP-2026-00205', client: 'PharmaCo Ltd', description: 'Ibuprofen Syrup', condition: 'intact', priority: 'NORMAL', status: 'BOOKED', receivedDate: '2026-04-08 07:30' },
  { id: 11, sampleCode: 'SMP-2026-00206', client: 'AquaPure Inc', description: 'Wastewater Sample', condition: 'intact', priority: 'URGENT', status: 'IN_TESTING', receivedDate: '2026-04-07 16:20' },
  { id: 12, sampleCode: 'SMP-2026-00207', client: 'GreenHerbs Pvt', description: 'Turmeric Extract', condition: 'intact', priority: 'NORMAL', status: 'BOOKED', receivedDate: '2026-04-07 15:10' },
];
const M_KPIS: KpiResponse = {
  kpis: [
    { key: 'trfs_processed', label: 'TRFs Processed / Day', actual: 22, target: 30, unit: '', inverse: false },
    { key: 'avg_time', label: 'Avg Processing Time', actual: 7.2, target: 10, unit: 'mins', inverse: true },
    { key: 'approval_accuracy', label: 'Approval Accuracy', actual: 96.5, target: 99, unit: '%', inverse: false },
    { key: 'pending_trfs', label: 'Pending TRFs', actual: 4, target: 0, unit: '', inverse: true },
    { key: 'new_clients', label: 'New Client Activations', actual: 3, target: 0, unit: '', inverse: false },
  ],
  kras: [
    { key: 'processing_accuracy', label: 'Processing Accuracy', target: '99%', actual: 97.5, score: 98.5, weight: 30, inverse: false },
    { key: 'processing_speed', label: 'Processing Speed', target: '95%', actual: 92.0, score: 96.8, weight: 25, inverse: false },
    { key: 'client_verification', label: 'Client Verification', target: '90%', actual: 100, score: 100, weight: 25, inverse: false },
    { key: 'doc_compliance', label: 'Doc Compliance', target: '100%', actual: 95.5, score: 95.5, weight: 20, inverse: false },
  ],
  overallKraScore: 97.6,
};
const M_ALERTS: AlertItem[] = [
  { type: 'urgent_trf', severity: 'red', message: '2 urgent/express TRF(s) awaiting action', count: 2 },
];
const M_ACTIVITY: ActivityItem[] = [];

// ─── Helpers ───────────────────────────────────────────────

function kpiProg(kpi: KpiItem): number {
  if (kpi.inverse) { if (kpi.target === 0) return kpi.actual === 0 ? 100 : Math.max(0, 100 - kpi.actual * 10); return Math.min(100, (kpi.target / Math.max(kpi.actual, 0.01)) * 100); }
  return kpi.target === 0 ? 100 : Math.min(100, (kpi.actual / kpi.target) * 100);
}
function barC(p: number) { return p >= 90 ? 'bg-emerald-500' : p >= 75 ? 'bg-amber-500' : 'bg-red-500'; }
function txtC(p: number) { return p >= 90 ? 'text-emerald-600' : p >= 75 ? 'text-amber-600' : 'text-red-600'; }
function bgC(p: number) { return p >= 90 ? 'bg-emerald-50 border-emerald-200' : p >= 75 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'; }

function fmtWait(min: number) { if (min < 60) return `${min}m`; const h = Math.floor(min / 60); const m = min % 60; return m ? `${h}h ${m}m` : `${h}h`; }
function waitColor(min: number) { return min > 60 ? 'text-red-600' : min > 30 ? 'text-amber-600' : 'text-emerald-600'; }
function waitBg(min: number) { return min > 60 ? 'bg-red-50' : min > 30 ? 'bg-amber-50' : 'bg-emerald-50'; }

const priCfg: Record<string, { v: 'red' | 'orange' | 'blue'; l: string }> = { EXPRESS: { v: 'red', l: 'Express' }, URGENT: { v: 'orange', l: 'Urgent' }, NORMAL: { v: 'blue', l: 'Normal' } };
const statusCfg: Record<string, { v: 'yellow' | 'purple' | 'blue' | 'green' | 'cyan' | 'teal' | 'gray'; l: string }> = {
  RECEIVED: { v: 'yellow', l: 'Received' }, BOOKED: { v: 'purple', l: 'Booked' }, IN_TESTING: { v: 'blue', l: 'In Testing' },
  UNDER_REVIEW: { v: 'cyan', l: 'Under Review' }, APPROVED: { v: 'green', l: 'Approved' }, COA_GENERATED: { v: 'teal', l: 'CoA Generated' }, DISPATCHED: { v: 'gray', l: 'Dispatched' },
};

const QUICK_ACTIONS = [
  { label: 'Receive Sample', icon: <PackagePlus className="h-4 w-4" />, path: '/samples/reception', gradient: 'from-blue-500 to-blue-600' },
  { label: 'View Clients', icon: <Users className="h-4 w-4" />, path: '/masters/clients', gradient: 'from-violet-500 to-violet-600' },
  { label: 'Track Samples', icon: <Search className="h-4 w-4" />, path: '/samples/tracking', gradient: 'from-cyan-500 to-cyan-600' },
  { label: 'Transfer', icon: <ArrowLeftRight className="h-4 w-4" />, path: '/samples/transfers', gradient: 'from-emerald-500 to-emerald-600' },
  { label: 'Mailer', icon: <Mail className="h-4 w-4" />, path: '/emails/compose', gradient: 'from-pink-500 to-pink-600' },
  { label: 'Ticket', icon: <TicketCheck className="h-4 w-4" />, path: '/tickets/new', gradient: 'from-orange-500 to-orange-600' },
  { label: 'Indent', icon: <Package className="h-4 w-4" />, path: '/indents/new', gradient: 'from-amber-500 to-amber-600' },
];

// ─── Component ─────────────────────────────────────────────

export default function ReceptionDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showExtras, setShowExtras] = useState(false);

  // ── API Queries ────────────────────────────────────────
  const { data: stats } = useQuery<Stats>({ queryKey: ['reception-dash', 'stats'], queryFn: async () => { try { return (await get<ApiRes<Stats>>('/reception-dashboard/stats')).data; } catch { return M_STATS; } }, refetchInterval: 60_000, staleTime: 30_000 });
  const { data: trfQueue } = useQuery<TrfItem[]>({ queryKey: ['reception-dash', 'trf-queue'], queryFn: async () => { try { return (await get<ApiRes<TrfItem[]>>('/reception-dashboard/trf-queue')).data; } catch { return M_QUEUE; } }, refetchInterval: 30_000, staleTime: 15_000 });
  const { data: receivedSamples } = useQuery<ReceivedSample[]>({ queryKey: ['reception-dash', 'received'], queryFn: async () => { try { return (await get<ApiRes<ReceivedSample[]>>('/reception-dashboard/received-samples')).data; } catch { return M_RECEIVED; } }, refetchInterval: 60_000, staleTime: 30_000 });
  const { data: kpiData } = useQuery<KpiResponse>({ queryKey: ['reception-dash', 'kpis'], queryFn: async () => { try { return (await get<ApiRes<KpiResponse>>('/reception-dashboard/kpis')).data; } catch { return M_KPIS; } }, refetchInterval: 300_000, staleTime: 60_000 });
  const { data: alerts } = useQuery<AlertItem[]>({ queryKey: ['reception-dash', 'alerts'], queryFn: async () => { try { return (await get<ApiRes<AlertItem[]>>('/reception-dashboard/alerts')).data; } catch { return M_ALERTS; } }, refetchInterval: 30_000, staleTime: 15_000 });
  const { data: recentActivity } = useQuery<ActivityItem[]>({ queryKey: ['reception-dash', 'activity'], queryFn: async () => { try { return (await get<ApiRes<ActivityItem[]>>('/reception-dashboard/recent-activity')).data; } catch { return M_ACTIVITY; } }, refetchInterval: 60_000, staleTime: 30_000 });

  const s = stats || M_STATS;
  const queue = trfQueue || M_QUEUE;
  const received = receivedSamples || M_RECEIVED;
  const kpis = kpiData?.kpis || M_KPIS.kpis;
  const kras = kpiData?.kras || M_KPIS.kras;
  const overallKra = kpiData?.overallKraScore ?? M_KPIS.overallKraScore;
  const alrt = alerts || M_ALERTS;
  const activity = recentActivity || M_ACTIVITY;

  const firstName = user?.fullName?.split(' ')[0] || 'Reception';

  return (
    <div className="space-y-4">
      {/* ═══ HEADER + STATS ═══ */}
      <div className="bg-gradient-to-r from-cyan-600 to-teal-600 rounded-2xl p-5 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9zdmc+')] opacity-50" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {firstName}</h1>
                <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-medium">Reception</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-white/60 mt-1">
                <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />Sample Reception</span>
              </div>
            </div>
            <Button size="sm" className="!bg-white !text-teal-700 hover:!bg-white/90" icon={<PackagePlus className="h-3.5 w-3.5" />} onClick={() => navigate('/samples/reception')}>Receive Sample</Button>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: 'Processed', value: s.processedToday, icon: <ClipboardCheck className="h-3.5 w-3.5" /> },
              { label: 'Received', value: s.receivedToday, icon: <Package className="h-3.5 w-3.5" /> },
              { label: 'Pending', value: s.pendingTrfs, icon: <Clock className="h-3.5 w-3.5" /> },
              { label: 'Avg Time', value: `${s.avgProcessingTime}m`, icon: <Timer className="h-3.5 w-3.5" /> },
              { label: 'Approval', value: `${s.approvalRate}%`, icon: <Target className="h-3.5 w-3.5" /> },
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
              {a.severity === 'red' ? <ShieldAlert className="h-4 w-4 text-red-500 shrink-0" /> : <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />}
              <span className={`text-sm flex-1 ${a.severity === 'red' ? 'text-red-700' : 'text-amber-700'}`}>{a.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* ═══ MAIN: TRF Queue + KRA/KPI ═══ */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* TRF Queue (8/12) */}
        <Card title="TRF Queue" subtitle={`${queue.length} pending`} className="xl:col-span-8" noPadding
          action={<button onClick={() => navigate('/samples/reception')} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">All <ArrowRight className="h-3 w-3" /></button>}
        >
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Sample / Client</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Priority</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Wait</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase w-36">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {queue.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-blue-600 text-sm">{item.sampleCode}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        {item.client}
                        {item.isNewClient && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">New Client</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 truncate max-w-[180px]">{item.description}</td>
                    <td className="px-3 py-2.5 text-center"><Badge variant={priCfg[item.priority]?.v || 'blue'}>{priCfg[item.priority]?.l || item.priority}</Badge></td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${waitColor(item.waitMinutes)} ${waitBg(item.waitMinutes)}`}>
                        <Timer className="h-3 w-3" />{fmtWait(item.waitMinutes)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button size="sm" variant="primary" icon={<CheckCircle2 className="h-3 w-3" />} onClick={() => navigate('/samples/reception')}>Approve</Button>
                        <Button size="sm" variant="outline" className="!text-red-600 !border-red-200 hover:!bg-red-50" icon={<XCircle className="h-3 w-3" />}>Reject</Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {queue.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-400">No pending TRFs</td></tr>}
              </tbody>
            </table>
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
                      <span className={`text-xs font-semibold ${kpi.target === 0 && !kpi.inverse ? 'text-gray-600' : txtC(pct)}`}>
                        {kpi.unit === '%' ? `${kpi.actual}%` : kpi.unit === 'mins' ? `${kpi.actual}m` : kpi.actual}
                        {kpi.target > 0 && <span className="text-gray-400 font-normal"> / {kpi.unit === '%' ? `${kpi.target}%` : kpi.unit === 'mins' ? `${kpi.target}m` : kpi.target}</span>}
                      </span>
                    </div>
                    {kpi.target > 0 && (
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${barC(pct)}`} style={{ width: `${Math.min(pct, 100)}%` }} /></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Received Samples ═══ */}
      <Card title="Recently Received" subtitle="Samples you processed" noPadding
        action={<button onClick={() => navigate('/samples/tracking')} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">Track All <ArrowRight className="h-3 w-3" /></button>}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Sample</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Client</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Priority</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {received.map((r) => {
                const sc = statusCfg[r.status] || statusCfg.RECEIVED;
                return (
                  <tr key={r.id} className="hover:bg-blue-50/50">
                    <td className="px-3 py-2.5 font-medium text-blue-600">{r.sampleCode}</td>
                    <td className="px-3 py-2.5 text-gray-600">{r.client}</td>
                    <td className="px-3 py-2.5 text-gray-600 truncate max-w-[180px]">{r.description}</td>
                    <td className="px-3 py-2.5 text-center"><Badge variant={priCfg[r.priority]?.v || 'blue'}>{priCfg[r.priority]?.l || r.priority}</Badge></td>
                    <td className="px-3 py-2.5 text-center"><Badge variant={sc.v}>{sc.l}</Badge></td>
                    <td className="px-3 py-2.5 text-gray-500 text-right text-xs">{new Date(r.receivedDate).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                  </tr>
                );
              })}
              {received.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-400">No samples received yet</td></tr>}
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
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
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
