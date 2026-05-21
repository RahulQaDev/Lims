import './_chartSetup';
import { Line } from 'react-chartjs-2';
import { ArrowUp, ArrowDown } from 'lucide-react';
import TplanChip, { type TplanAspect } from './TplanChip';

interface SparklineCardProps {
  label: string;
  value: string | number;
  unit?: string;
  /** 12-week (or N-point) series for the sparkline */
  series: number[];
  /** Delta vs previous period, e.g. +2.1 or -0.3 */
  delta?: number;
  /** Higher-is-better (green on +) or lower-is-better (green on −) */
  inverse?: boolean;
  /** Optional dashed red target line drawn across the chart */
  target?: number;
  /** Footer (e.g. "Target ≥ 95%") */
  footerLeft?: string;
  footerRight?: string;
  tplan?: TplanAspect;
  seriesLabels?: string[];
}

export default function SparklineCard({
  label, value, unit, series, delta, inverse, target, footerLeft, footerRight, tplan, seriesLabels,
}: SparklineCardProps) {
  const positiveIsGood = !inverse;
  const isPositive = delta !== undefined && delta >= 0;
  const isGood = delta === undefined ? true : positiveIsGood ? isPositive : !isPositive;
  const color = delta === undefined ? '#16a34a' : isGood ? '#16a34a' : '#dc2626';
  const labels = seriesLabels ?? series.map((_, i) => `W${i + 1}`);

  const datasets: any[] = [{
    data: series,
    borderColor: color,
    backgroundColor: color + '22',
    fill: true,
    borderWidth: 2,
    tension: 0.4,
    pointRadius: 0,
  }];
  if (target !== undefined) {
    datasets.push({
      data: Array(series.length).fill(target),
      borderColor: '#dc2626',
      borderWidth: 1.2,
      borderDash: [4, 3],
      pointRadius: 0,
      fill: false,
    });
  }

  return (
    <div className="bg-white border border-slate-200 rounded-[10px] p-4 flex flex-col">
      <div className="flex items-start justify-between">
        <div className="t-label">{label}</div>
        <div className="flex items-center gap-1.5">
          {tplan && <TplanChip aspect={tplan} />}
          {delta !== undefined && (
            <span
              className="t-mono text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: isGood ? '#f0fdf4' : '#fef2f2', color: isGood ? '#16a34a' : '#dc2626' }}
            >
              {isPositive ? <ArrowUp className="inline h-2.5 w-2.5" /> : <ArrowDown className="inline h-2.5 w-2.5" />}
              {' '}
              {isPositive ? '+' : ''}{delta}
            </span>
          )}
        </div>
      </div>
      <div className="t-mono text-[20px] font-bold mt-1 text-slate-900 leading-none">
        {value}
        {unit && <span className="text-[11px] text-slate-500 font-medium ml-0.5">{unit}</span>}
      </div>
      <div className="h-[90px] mt-1.5 -mx-1">
        <Line
          data={{ labels, datasets }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false }, ticks: { font: { size: 9 }, maxRotation: 0 } },
              y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 9 }, maxTicksLimit: 4 }, beginAtZero: false },
            },
          }}
        />
      </div>
      {(footerLeft || footerRight) && (
        <div className="flex justify-between items-center mt-auto pt-2 text-[11px] text-slate-500">
          <span>{footerLeft}</span>
          <span>{footerRight}</span>
        </div>
      )}
    </div>
  );
}
