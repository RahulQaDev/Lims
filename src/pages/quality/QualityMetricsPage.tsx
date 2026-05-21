import { ShieldAlert, AlertTriangle, Flame } from 'lucide-react';
import { DonutWithLegend, InvertedGauge, SparklineCard } from '../../components/charts';
import { MOCK_QUALITY } from '../../data/mocks/quality-metrics.mock';
import { WEEK_LABELS } from '../../data/mocks/analyst-dashboard.mock';
import TplanChip from '../../components/charts/TplanChip';

export default function QualityMetricsPage() {
  const q = MOCK_QUALITY;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-red-600" />
          Quality Metrics
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Panel 3 — redo, deviations, complaints, and lab incidents</p>
      </div>

      {/* Row 1 — redo tiles + inverted rate gauge + reason donut */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 13 Redo Count */}
        <div className="bg-white border-l-[3px] border-amber-500 border-y border-r border-slate-200 rounded-[10px] p-4 flex flex-col">
          <div className="flex items-start justify-between">
            <div className="t-label">Re-do Count</div>
            <TplanChip aspect="internal" />
          </div>
          <div className="t-mono text-[22px] font-bold mt-1 leading-none text-slate-900">{q.redoCount}</div>
          <div className="flex justify-between mt-auto pt-2 text-[11px] text-slate-500">
            <span
              className="t-mono font-bold px-1.5 py-0.5 rounded text-[10px]"
              style={{ background: q.redoDelta > 0 ? '#fef2f2' : '#f0fdf4', color: q.redoDelta > 0 ? '#dc2626' : '#16a34a' }}
            >
              {q.redoDelta > 0 ? '+' : ''}{q.redoDelta}
            </span>
            <span>Target: Min</span>
          </div>
        </div>

        {/* KPI 14 Redo Rate % — inverted gauge + sparkline */}
        <SparklineCard
          label="Re-do Rate"
          value={q.redoRatePct.toFixed(1)}
          unit="%"
          series={q.redoRateSeries}
          seriesLabels={WEEK_LABELS}
          delta={q.redoRateDelta}
          inverse
          target={q.redoRateTarget}
          footerLeft={`Target ≤ ${q.redoRateTarget}%`}
          footerRight="Lower better"
          tplan="internal"
        />

        {/* KPI 15 Donut — span 2 */}
        <div className="lg:col-span-2">
          <DonutWithLegend
            title="Re-do Reason Split"
            subtitle={`${q.redoReasons[0]?.label} top cause`}
            slices={q.redoReasons}
            tplan="internal"
          />
        </div>
      </div>

      {/* Row 2 — Alert tiles: Deviations / Complaints / Incidents + inverted gauge of rate */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <InvertedGauge
          label="Re-do Rate (Gauge)"
          value={q.redoRatePct}
          target={q.redoRateTarget}
          sub={`Target ≤ ${q.redoRateTarget}%`}
          tplan="internal"
        />

        {/* KPI 16 Deviation Count */}
        <div className="bg-white border-l-[3px] border-amber-500 border-y border-r border-slate-200 rounded-[10px] p-4 flex flex-col">
          <div className="flex items-start justify-between">
            <div className="t-label">Deviations</div>
            <TplanChip aspect="customer" />
          </div>
          <div className="t-mono text-[22px] font-bold mt-1 leading-none text-slate-900">{q.deviationCount}</div>
          <div className="flex justify-between mt-auto pt-2 text-[11px] text-slate-500">
            <span>{q.deviationFailToPass} F→P · {q.deviationPassToFail} P→F</span>
            <span>Target: 0</span>
          </div>
        </div>

        {/* KPI 17 Complaints */}
        <div className="bg-white border-l-[3px] border-red-500 border-y border-r border-slate-200 rounded-[10px] p-4 flex flex-col">
          <div className="flex items-start justify-between">
            <div className="t-label flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-red-500" />Customer Complaints</div>
            <TplanChip aspect="customer" />
          </div>
          <div className="t-mono text-[22px] font-bold mt-1 leading-none text-slate-900">{q.customerComplaints}</div>
          <div className="flex justify-between mt-auto pt-2 text-[11px] text-slate-500">
            <span
              className="t-mono font-bold px-1.5 py-0.5 rounded text-[10px]"
              style={{ background: q.complaintsDelta > 0 ? '#fef2f2' : '#f0fdf4', color: q.complaintsDelta > 0 ? '#dc2626' : '#16a34a' }}
            >
              {q.complaintsDelta > 0 ? '+' : ''}{q.complaintsDelta}
            </span>
            <span>Target: 0</span>
          </div>
        </div>

        {/* KPI 18 Incidents — streak */}
        <div className="bg-white border-l-[3px] border-emerald-500 border-y border-r border-slate-200 rounded-[10px] p-4 flex flex-col">
          <div className="flex items-start justify-between">
            <div className="t-label">Lab Incidents</div>
            <TplanChip aspect="internal" />
          </div>
          <div className="t-mono text-[22px] font-bold mt-1 leading-none text-emerald-600">{q.labIncidents}</div>
          <div className="flex justify-between mt-auto pt-2 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
              <Flame className="h-3 w-3" /> {q.incidentStreakDays}-day streak
            </span>
            <span>Target: 0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
