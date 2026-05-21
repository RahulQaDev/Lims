import './_chartSetup';
import { Line } from 'react-chartjs-2';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface Mini { t: string; value: string }
interface Panel { title: string; items: Mini[] }

interface NavyHeroProps {
  greeting: string;
  subtitle?: string;
  /** Performance Score value e.g. "89.6" */
  score: string;
  unit?: string;
  /** vs last period */
  delta?: number;
  /** badge text like "On Track" */
  status?: { label: string; color?: string };
  /** mini panels e.g. Core KPIs + Discipline */
  panels?: Panel[];
  /** 7-point trend series for sparkline */
  trend?: { labels: string[]; values: number[] };
}

export default function NavyHero({
  greeting, subtitle, score, unit = '%', delta, status, panels = [], trend,
}: NavyHeroProps) {
  const isPositive = delta !== undefined && delta >= 0;

  return (
    <div
      className="rounded-xl p-5 text-white grid items-center gap-7"
      style={{
        background: 'linear-gradient(110deg, #0b1c3d 0%, #1e3a8a 100%)',
        gridTemplateColumns: 'auto auto 1fr auto',
      }}
    >
      {/* Greeting + Score */}
      <div>
        <div className="t-label text-white/65">{greeting}</div>
        <div className="t-mono text-[44px] font-bold leading-none -tracking-[0.03em] mt-1">
          {score}
          <span className="text-[18px] opacity-65 font-medium">{unit}</span>
        </div>
        {(delta !== undefined || subtitle) && (
          <div className="mt-1.5 text-[11px] opacity-80">
            {subtitle && <span>{subtitle}</span>}
            {delta !== undefined && (
              <span className="ml-1.5">
                vs last period{' '}
                <strong style={{ color: isPositive ? '#86efac' : '#fca5a5' }}>
                  {isPositive ? <ArrowUp className="inline h-3 w-3" /> : <ArrowDown className="inline h-3 w-3" />}
                  {' '}
                  {isPositive ? '+' : ''}{delta}
                </strong>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Status badge */}
      {status && (
        <div>
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.05em] px-3 py-1 rounded-full"
            style={{ background: status.color ?? '#16a34a', color: 'white' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            {status.label}
          </span>
        </div>
      )}

      {/* Mini-panels */}
      <div className="flex gap-5 text-[11px] flex-wrap">
        {panels.map((p, i) => (
          <div key={p.title} className={`${i > 0 ? 'border-l border-white/15 pl-4' : ''}`}>
            <div className="text-[9px] opacity-55 uppercase tracking-[0.1em] font-bold mb-1">{p.title}</div>
            {p.items.map((it) => (
              <div key={it.t} className="flex justify-between gap-5 mb-0.5">
                <span className="opacity-80">{it.t}</span>
                <span className="t-mono font-bold">{it.value}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Sparkline */}
      {trend && (
        <div className="w-[140px] h-[60px]">
          <Line
            data={{
              labels: trend.labels,
              datasets: [{
                data: trend.values,
                borderColor: '#86efac',
                backgroundColor: 'rgba(134, 239, 172, 0.2)',
                fill: true,
                borderWidth: 2,
                tension: 0.4,
                pointRadius: 0,
              }],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false }, tooltip: { enabled: false } },
              scales: { x: { display: false }, y: { display: false } },
            }}
          />
        </div>
      )}
    </div>
  );
}
