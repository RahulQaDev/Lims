import './_chartSetup';
import { Bar } from 'react-chartjs-2';
import TplanChip, { type TplanAspect } from './TplanChip';

interface GroupedBarProps {
  title: string;
  subtitle?: string;
  labels: string[];
  /** First series (e.g. Actual) — can color individual bars per value */
  actual: { label: string; data: number[]; colors?: string[]; defaultColor?: string };
  /** Second series (e.g. SOP) */
  comparison: { label: string; data: number[]; color?: string };
  yUnit?: string;
  tplan?: TplanAspect;
}

export default function GroupedBarChart({ title, subtitle, labels, actual, comparison, tplan }: GroupedBarProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-[10px] p-4 flex flex-col">
      <div className="flex items-start justify-between">
        <div>
          <div className="t-label">{title}</div>
          {subtitle && <div className="text-[11px] text-red-600 font-semibold mt-0.5">{subtitle}</div>}
        </div>
        {tplan && <TplanChip aspect={tplan} />}
      </div>
      <div className="h-[140px] mt-2">
        <Bar
          data={{
            labels,
            datasets: [
              {
                label: actual.label,
                data: actual.data,
                backgroundColor: actual.colors ?? actual.data.map(() => actual.defaultColor ?? '#2563eb'),
                borderRadius: 4,
                barPercentage: 0.8,
                categoryPercentage: 0.7,
              },
              {
                label: comparison.label,
                data: comparison.data,
                backgroundColor: comparison.color ?? '#cbd5e1',
                borderRadius: 4,
                barPercentage: 0.8,
                categoryPercentage: 0.7,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'top',
                align: 'end',
                labels: { font: { size: 10 }, boxWidth: 10, boxHeight: 10, padding: 8 },
              },
            },
            scales: {
              x: { grid: { display: false }, ticks: { font: { size: 10 } } },
              y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 }, maxTicksLimit: 5 }, beginAtZero: true },
            },
          }}
        />
      </div>
    </div>
  );
}
