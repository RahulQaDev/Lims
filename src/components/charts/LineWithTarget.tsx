import './_chartSetup';
import { Line } from 'react-chartjs-2';
import TplanChip, { type TplanAspect } from './TplanChip';

interface Props {
  title: string;
  subtitle?: string;
  bigValue?: string;
  bigUnit?: string;
  deltaChip?: { value: number; inverse?: boolean };
  labels: string[];
  /** Actual series */
  actual: number[];
  /** Optional target series (same length) drawn as dashed red */
  target?: number[];
  /** Or a single target value broadcast to all points */
  targetValue?: number;
  /** Color of actual line (default green) */
  color?: string;
  yMax?: number;
  height?: number;
  tplan?: TplanAspect;
  /** Second data series legend name (for Growth Path: Actual + Target both labeled) */
  showLegend?: boolean;
}

export default function LineWithTarget({
  title, subtitle, bigValue, bigUnit, deltaChip, labels, actual, target, targetValue, color = '#16a34a', yMax, height = 140, tplan, showLegend,
}: Props) {
  const targetSeries = target ?? (targetValue !== undefined ? Array(labels.length).fill(targetValue) : null);

  const datasets: any[] = [
    ...(targetSeries
      ? [{
          label: 'Target',
          data: targetSeries,
          borderColor: '#dc2626',
          borderWidth: 1.5,
          borderDash: [4, 3],
          pointRadius: 0,
          fill: false,
        }]
      : []),
    {
      label: 'Actual',
      data: actual,
      borderColor: color,
      backgroundColor: color + '1f',
      fill: true,
      borderWidth: 2,
      tension: 0.3,
      pointRadius: showLegend ? 3 : 0,
      pointBackgroundColor: color,
      spanGaps: false,
    },
  ];

  const isGoodDelta =
    deltaChip === undefined
      ? true
      : deltaChip.inverse
      ? deltaChip.value <= 0
      : deltaChip.value >= 0;

  return (
    <div className="bg-white border border-slate-200 rounded-[10px] p-4 flex flex-col">
      <div className="flex items-start justify-between">
        <div>
          <div className="t-label">{title}</div>
          {subtitle && <div className="text-[11px] text-slate-500 mt-0.5">{subtitle}</div>}
        </div>
        <div className="flex items-center gap-1.5">
          {tplan && <TplanChip aspect={tplan} />}
          {deltaChip && (
            <span
              className="t-mono text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: isGoodDelta ? '#f0fdf4' : '#fef2f2', color: isGoodDelta ? '#16a34a' : '#dc2626' }}
            >
              {deltaChip.value >= 0 ? '+' : ''}{deltaChip.value}
            </span>
          )}
        </div>
      </div>
      {bigValue && (
        <div className="t-mono text-[20px] font-bold text-slate-900 mt-1 leading-none">
          {bigValue}
          {bigUnit && <span className="text-[11px] text-slate-500 font-medium ml-0.5">{bigUnit}</span>}
        </div>
      )}
      <div style={{ height }} className="mt-2">
        <Line
          data={{ labels, datasets }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: showLegend
                ? { display: true, position: 'top', align: 'end', labels: { font: { size: 10 }, boxWidth: 10, boxHeight: 10, padding: 6 } }
                : { display: false },
            },
            scales: {
              x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 0 } },
              y: {
                beginAtZero: showLegend,
                max: yMax,
                grid: { color: '#f1f5f9' },
                ticks: { font: { size: 10 }, maxTicksLimit: 5, callback: (v) => (showLegend ? v + '%' : v) },
              },
            },
          }}
        />
      </div>
    </div>
  );
}
