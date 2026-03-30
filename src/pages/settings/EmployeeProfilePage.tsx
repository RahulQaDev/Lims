import { useState, useMemo } from 'react';
import {
  User, Mail, Phone, Building2, Calendar, Briefcase, Shield,
  TrendingUp, TrendingDown, Minus, Target, BarChart3, Award,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { useRoleStore } from '../../stores/roleStore';
import Badge from '../../components/ui/Badge';
import type { EmployeeProfile, EmployeeKRA, EmployeeKPI, KRAItem, KPIBenchmark } from '../../types';

// ── Mock employee (will be replaced by API later) ──
const MOCK_EMPLOYEE: EmployeeProfile = {
  id: 'emp-001',
  employeeCode: 'EMP-2024-001',
  firstName: 'Priya',
  lastName: 'Sharma',
  email: 'priya.sharma@auriga.lab',
  phone: '+91 98765 43210',
  roleId: 'analyst',
  departmentName: 'HPLC',
  designation: 'Senior Analyst',
  dateOfJoining: '2022-03-15',
  kras: [
    { kraId: 'testing-accuracy', actual: 97.2 },
    { kraId: 'tat-compliance', actual: 91.5, remarks: 'Delayed due to instrument downtime' },
    { kraId: 'sample-throughput', actual: 88 },
    { kraId: 'quality-score', actual: 96.8 },
  ],
  kpis: [
    { kpiId: 'samples-completed', actual: 115 },
    { kpiId: 'avg-tat', actual: 22 },
    { kpiId: 'on-time-pct', actual: 91.5 },
    { kpiId: 'rejection-rate', actual: 1.8 },
    { kpiId: 'pending-tasks', actual: 3 },
  ],
};

// ── Color helpers ──
function getKRAColor(actual: number, target: number) {
  const ratio = actual / target;
  if (ratio >= 0.95) return { bar: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50', badge: 'green' as const };
  if (ratio >= 0.75) return { bar: 'bg-yellow-500', text: 'text-yellow-700', bg: 'bg-yellow-50', badge: 'yellow' as const };
  return { bar: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50', badge: 'red' as const };
}

function getKPIColor(actual: number, benchmark: KPIBenchmark) {
  // For "lower is better" metrics (rejection rate, pending tasks, TAT)
  const lowerIsBetter = benchmark.unit === 'hrs' || benchmark.unit === 'mins' || benchmark.id.includes('rejection') || benchmark.id.includes('pending') || benchmark.id.includes('complaint') || benchmark.id.includes('finding') || benchmark.id.includes('deviation');
  if (lowerIsBetter) {
    if (actual <= benchmark.greenThreshold) return { text: 'text-green-700', bg: 'bg-green-50', badge: 'green' as const };
    if (actual <= benchmark.yellowThreshold) return { text: 'text-yellow-700', bg: 'bg-yellow-50', badge: 'yellow' as const };
    return { text: 'text-red-700', bg: 'bg-red-50', badge: 'red' as const };
  }
  // Higher is better
  if (actual >= benchmark.greenThreshold) return { text: 'text-green-700', bg: 'bg-green-50', badge: 'green' as const };
  if (actual >= benchmark.yellowThreshold) return { text: 'text-yellow-700', bg: 'bg-yellow-50', badge: 'yellow' as const };
  return { text: 'text-red-700', bg: 'bg-red-50', badge: 'red' as const };
}

function getTrend(actual: number, target: number) {
  const ratio = actual / target;
  if (ratio >= 0.95) return { icon: TrendingUp, text: 'On Track', color: 'text-green-600' };
  if (ratio >= 0.80) return { icon: Minus, text: 'Needs Attention', color: 'text-yellow-600' };
  return { icon: TrendingDown, text: 'Below Target', color: 'text-red-600' };
}

export default function EmployeeProfilePage() {
  const { roles } = useRoleStore();
  const [employee] = useState<EmployeeProfile>(MOCK_EMPLOYEE);
  const [expandedKRA, setExpandedKRA] = useState<string | null>(null);

  const role = useMemo(() => roles.find((r) => r.id === employee.roleId), [roles, employee.roleId]);
  const roleKRAs = role?.kras || [];
  const roleKPIs = role?.kpiBenchmarks || [];

  // Map employee actuals to role KRAs
  const kraData = useMemo(() => {
    return roleKRAs.map((kra) => {
      const empKRA = employee.kras.find((k) => k.kraId === kra.id);
      return { ...kra, actual: empKRA?.actual ?? 0, remarks: empKRA?.remarks };
    });
  }, [roleKRAs, employee.kras]);

  const kpiData = useMemo(() => {
    return roleKPIs.map((kpi) => {
      const empKPI = employee.kpis.find((k) => k.kpiId === kpi.id);
      return { ...kpi, actual: empKPI?.actual ?? 0 };
    });
  }, [roleKPIs, employee.kpis]);

  // Overall KRA Score
  const overallKRA = useMemo(() => {
    if (kraData.length === 0) return 0;
    const totalWeightage = kraData.reduce((sum, k) => sum + k.weightage, 0);
    const weighted = kraData.reduce((sum, k) => sum + (Math.min(k.actual / k.target, 1) * 100 * k.weightage), 0);
    return Math.round((weighted / totalWeightage) * 10) / 10;
  }, [kraData]);

  const overallColor = overallKRA >= 90 ? 'text-green-600' : overallKRA >= 70 ? 'text-yellow-600' : 'text-red-600';
  const overallBg = overallKRA >= 90 ? 'bg-green-500' : overallKRA >= 70 ? 'bg-yellow-500' : 'bg-red-500';

  const tenure = useMemo(() => {
    const join = new Date(employee.dateOfJoining);
    const now = new Date();
    const years = now.getFullYear() - join.getFullYear();
    const months = now.getMonth() - join.getMonth();
    return `${years}y ${months >= 0 ? months : months + 12}m`;
  }, [employee.dateOfJoining]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Employee Profile</h1>

      {/* ── Employee Info Card ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold shrink-0">
              {employee.firstName[0]}{employee.lastName[0]}
            </div>
            <div className="text-white min-w-0">
              <h2 className="text-lg font-bold">{employee.firstName} {employee.lastName}</h2>
              <p className="text-blue-100 text-sm">{employee.designation} &middot; {employee.departmentName}</p>
              <p className="text-blue-200 text-xs font-mono mt-0.5">{employee.employeeCode}</p>
            </div>
            <div className="ml-auto flex items-center gap-3 shrink-0">
              <div className="text-right text-white">
                <p className="text-2xl font-bold">{overallKRA}%</p>
                <p className="text-xs text-blue-200">Overall KRA</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="truncate">{employee.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone className="h-4 w-4 text-gray-400 shrink-0" />
            <span>{employee.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
            <span>{employee.departmentName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Shield className="h-4 w-4 text-gray-400 shrink-0" />
            <span>{role?.label || employee.roleId}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
            <span>Joined {new Date(employee.dateOfJoining).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Briefcase className="h-4 w-4 text-gray-400 shrink-0" />
            <span>Tenure: {tenure}</span>
          </div>
        </div>
      </div>

      {/* ── KRA Section ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Key Result Areas (KRA)</h3>
              <p className="text-xs text-gray-500">
                Mapped from role: <span className="font-medium text-gray-700">{role?.label}</span> &middot; {kraData.length} KRAs
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`text-right`}>
              <span className={`text-2xl font-bold ${overallColor}`}>{overallKRA}%</span>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Weighted Score</p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${overallBg} bg-opacity-10`}>
              <div className={`w-9 h-9 rounded-full ${overallBg} flex items-center justify-center`}>
                <Award className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="px-6 pt-4 pb-2">
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full ${overallBg} rounded-full transition-all duration-500`} style={{ width: `${Math.min(overallKRA, 100)}%` }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-gray-400">0%</span>
            <span className="text-[10px] text-gray-400">100%</span>
          </div>
        </div>

        {/* Individual KRAs */}
        <div className="px-6 pb-5 space-y-3">
          {kraData.map((kra) => {
            const colors = getKRAColor(kra.actual, kra.target);
            const trend = getTrend(kra.actual, kra.target);
            const TrendIcon = trend.icon;
            const isExpanded = expandedKRA === kra.id;
            const progress = Math.min((kra.actual / kra.target) * 100, 100);
            const targetPosition = 100; // target is always at the end

            return (
              <div key={kra.id} className={`rounded-lg border ${isExpanded ? 'border-gray-300' : 'border-gray-200'} transition-all`}>
                <button
                  onClick={() => setExpandedKRA(isExpanded ? null : kra.id)}
                  className="w-full px-4 py-3 flex items-center gap-4 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm font-medium text-gray-900">{kra.label}</span>
                      <Badge variant={colors.badge}>{kra.actual}%</Badge>
                      <span className={`flex items-center gap-1 text-xs ${trend.color}`}>
                        <TrendIcon className="h-3 w-3" /> {trend.text}
                      </span>
                    </div>
                    {/* Progress bar with target marker */}
                    <div className="relative">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${colors.bar} rounded-full transition-all duration-500`} style={{ width: `${progress}%` }} />
                      </div>
                      {/* Target marker */}
                      <div className="absolute top-0 h-2 w-0.5 bg-gray-900" style={{ left: `${targetPosition}%`, transform: 'translateX(-50%)' }} title={`Target: ${kra.target}%`} />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-[10px] text-gray-400">Actual: {kra.actual}%</span>
                      <span className="text-[10px] text-gray-500 font-medium">Target: {kra.target}% &middot; Weightage: {kra.weightage}%</span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />}
                </button>
                {isExpanded && (
                  <div className="px-4 pb-3 border-t border-gray-100">
                    <div className="grid grid-cols-3 gap-4 pt-3">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Achievement</p>
                        <p className={`text-lg font-bold ${colors.text}`}>{Math.round((kra.actual / kra.target) * 100)}%</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Gap</p>
                        <p className={`text-lg font-bold ${kra.actual >= kra.target ? 'text-green-600' : 'text-red-600'}`}>
                          {kra.actual >= kra.target ? '+' : ''}{Math.round((kra.actual - kra.target) * 10) / 10}%
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Weighted Contribution</p>
                        <p className="text-lg font-bold text-gray-900">{Math.round(Math.min(kra.actual / kra.target, 1) * kra.weightage * 10) / 10}%</p>
                      </div>
                    </div>
                    {kra.remarks && (
                      <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2">
                        <p className="text-xs text-amber-700"><span className="font-medium">Remarks:</span> {kra.remarks}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── KPI Section ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Key Performance Indicators (KPI)</h3>
            <p className="text-xs text-gray-500">
              Benchmarks from role: <span className="font-medium text-gray-700">{role?.label}</span> &middot; {kpiData.length} KPIs
            </p>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {kpiData.map((kpi) => {
            const colors = getKPIColor(kpi.actual, kpi as KPIBenchmark);
            return (
              <div key={kpi.id} className={`rounded-lg border border-gray-200 p-4 ${colors.bg}`}>
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs font-medium text-gray-600">{kpi.label}</p>
                  <Badge variant={colors.badge}>{kpi.unit === '%' ? `${kpi.actual}%` : kpi.actual}</Badge>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-2xl font-bold ${colors.text}`}>
                    {kpi.actual}
                  </span>
                  <span className="text-xs text-gray-400">{kpi.unit}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-gray-400">Target: {kpi.target} {kpi.unit}</span>
                  <span className={`font-medium ${colors.text}`}>
                    {kpi.unit === '%' || kpi.unit === 'hrs' || kpi.unit === 'mins'
                      ? `${kpi.actual <= kpi.target ? 'On Target' : 'Over'}`
                      : `${kpi.actual >= kpi.target ? 'On Target' : `${Math.round(((kpi.target - kpi.actual) / kpi.target) * 100)}% below`}`}
                  </span>
                </div>
                {/* Mini gauge */}
                <div className="mt-2 h-1.5 bg-white/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${colors.text.replace('text-', 'bg-')}`}
                    style={{ width: `${Math.min((kpi.actual / kpi.target) * 100, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Threshold Legend */}
        <div className="px-6 pb-4 flex flex-wrap items-center gap-4 text-[11px] text-gray-500">
          <span className="font-medium text-gray-700">Thresholds:</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> On Target</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> Needs Attention</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Critical</span>
        </div>
      </div>

      {/* ── Role KRA/KPI Definition Reference ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Role KRA/KPI Definitions</h3>
          <p className="text-xs text-gray-500 mt-0.5">Reference targets and thresholds defined for role: {role?.label}</p>
        </div>
        <div className="overflow-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Metric</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">Target</th>
                <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">Weightage / Unit</th>
                <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">Green</th>
                <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">Yellow</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {roleKRAs.map((kra) => (
                <tr key={kra.id}>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">{kra.label}</td>
                  <td className="px-4 py-2"><Badge variant="blue">KRA</Badge></td>
                  <td className="px-4 py-2 text-center text-sm text-gray-700">{kra.target}%</td>
                  <td className="px-4 py-2 text-center text-sm text-gray-500">{kra.weightage}%</td>
                  <td className="px-4 py-2 text-center text-xs text-green-600">≥{Math.round(kra.target * 0.95)}%</td>
                  <td className="px-4 py-2 text-center text-xs text-yellow-600">≥{Math.round(kra.target * 0.75)}%</td>
                </tr>
              ))}
              {roleKPIs.map((kpi) => (
                <tr key={kpi.id}>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">{kpi.label}</td>
                  <td className="px-4 py-2"><Badge variant="purple">KPI</Badge></td>
                  <td className="px-4 py-2 text-center text-sm text-gray-700">{kpi.target} {kpi.unit}</td>
                  <td className="px-4 py-2 text-center text-sm text-gray-500">{kpi.unit}</td>
                  <td className="px-4 py-2 text-center text-xs text-green-600">{kpi.unit === '%' || kpi.unit === 'count' ? '≥' : '≤'}{kpi.greenThreshold}</td>
                  <td className="px-4 py-2 text-center text-xs text-yellow-600">{kpi.unit === '%' || kpi.unit === 'count' ? '≥' : '≤'}{kpi.yellowThreshold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
