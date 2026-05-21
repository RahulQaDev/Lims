import { FlaskConical } from 'lucide-react';
import { GroupedBarChart } from '../../components/charts';
import TplanChip from '../../components/charts/TplanChip';
import { MOCK_CONSUMPTION } from '../../data/mocks/consumption.mock';

export default function ConsumptionPage() {
  const { summary, rows } = MOCK_CONSUMPTION;

  // Color bars red when actual > SOP, green otherwise
  const barColors = rows.map((r) => (r.variancePct > 0 ? '#dc2626' : '#16a34a'));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-blue-600" />
          Chemical Consumption
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">KPI 25 — actual consumption per sample vs SOP standard</p>
      </div>

      <GroupedBarChart
        title="Chemical Consumption per Sample (vs SOP)"
        subtitle={`${summary.topOverage} +${summary.overagePct}% over SOP — review dispensing`}
        labels={rows.map((r) => r.chemical)}
        actual={{ label: 'Actual', data: rows.map((r) => r.actual), colors: barColors }}
        comparison={{ label: 'SOP', data: rows.map((r) => r.sop), color: '#cbd5e1' }}
        tplan="financial"
      />

      {/* Variance table */}
      <div className="bg-white border border-slate-200 rounded-[10px] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div>
            <div className="t-label">Variance Breakdown</div>
            <p className="text-xs text-slate-500 mt-0.5">Per-chemical SOP adherence</p>
          </div>
          <TplanChip aspect="financial" />
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2.5 text-left font-semibold">Chemical</th>
              <th className="px-4 py-2.5 text-right font-semibold">Actual</th>
              <th className="px-4 py-2.5 text-right font-semibold">SOP</th>
              <th className="px-4 py-2.5 text-right font-semibold">Variance</th>
              <th className="px-4 py-2.5 text-center font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => {
              const over = r.variancePct > 0.5;
              const under = r.variancePct < -0.5;
              return (
                <tr key={r.chemical}>
                  <td className="px-4 py-2.5 font-medium text-slate-800">{r.chemical}</td>
                  <td className="px-4 py-2.5 text-right t-mono text-slate-900">{r.actual.toFixed(2)} {r.unit}</td>
                  <td className="px-4 py-2.5 text-right t-mono text-slate-600">{r.sop.toFixed(2)} {r.unit}</td>
                  <td className={`px-4 py-2.5 text-right t-mono font-bold ${over ? 'text-red-600' : under ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {r.variancePct > 0 ? '+' : ''}{r.variancePct.toFixed(1)}%
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span
                      className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                      style={{
                        background: over ? '#fef2f2' : under ? '#fffbeb' : '#f0fdf4',
                        color: over ? '#dc2626' : under ? '#d97706' : '#16a34a',
                      }}
                    >
                      {over ? 'Over SOP' : under ? 'Under SOP' : 'On Target'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
