import './_chartSetup';
import { Bar } from 'react-chartjs-2';
import TplanChip, { type TplanAspect } from './TplanChip';

export interface SkillRow {
  label: string;
  /** 1–4 */
  level: number;
}

interface Props {
  title: string;
  subtitle?: string;
  skills: SkillRow[];
  /** Target level line (default 3) */
  targetLevel?: number;
  max?: number;
  tplan?: TplanAspect;
}

function colorForLevel(v: number): string {
  if (v >= 4) return '#16a34a';
  if (v >= 3) return '#2563eb';
  if (v >= 2) return '#f59e0b';
  return '#dc2626';
}

export default function HorizontalBarMatrix({
  title, subtitle, skills, targetLevel = 3, max = 4, tplan,
}: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-[10px] p-4 flex flex-col">
      <div className="flex items-start justify-between">
        <div>
          <div className="t-label">{title} <span className="normal-case text-slate-500 font-medium">(1–{max})</span></div>
          {subtitle && <div className="text-[11px] text-slate-500 mt-0.5 t-mono">{subtitle}</div>}
        </div>
        {tplan && <TplanChip aspect={tplan} />}
      </div>
      <div className="h-[220px] mt-2">
        <Bar
          data={{
            labels: skills.map((s) => s.label),
            datasets: [
              {
                label: 'Current',
                data: skills.map((s) => s.level),
                backgroundColor: skills.map((s) => colorForLevel(s.level)),
                borderRadius: 3,
                barPercentage: 0.7,
              },
              {
                type: 'line' as const,
                label: `Target L${targetLevel}`,
                data: skills.map(() => targetLevel),
                borderColor: '#dc2626',
                borderWidth: 1.5,
                borderDash: [4, 3],
                pointRadius: 0,
              } as any,
            ],
          }}
          options={{
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { beginAtZero: true, max, ticks: { stepSize: 1, font: { size: 10 } }, grid: { color: '#f1f5f9' } },
              y: { grid: { display: false }, ticks: { font: { size: 10 } } },
            },
          }}
        />
      </div>
    </div>
  );
}
