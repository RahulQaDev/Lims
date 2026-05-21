import './_chartSetup';
import { Doughnut } from 'react-chartjs-2';
import TplanChip, { type TplanAspect } from './TplanChip';

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface DonutWithLegendProps {
  title: string;
  slices: DonutSlice[];
  subtitle?: string;
  tplan?: TplanAspect;
}

export default function DonutWithLegend({ title, slices, subtitle, tplan }: DonutWithLegendProps) {
  const data = {
    labels: slices.map((s) => s.label),
    datasets: [
      {
        data: slices.map((s) => s.value),
        backgroundColor: slices.map((s) => s.color),
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  return (
    <div className="bg-white border border-slate-200 rounded-[10px] p-4 flex flex-col">
      <div className="flex items-start justify-between">
        <div>
          <div className="t-label">{title}</div>
          {subtitle && <div className="text-[11px] text-red-600 font-semibold mt-0.5">{subtitle}</div>}
        </div>
        {tplan && <TplanChip aspect={tplan} />}
      </div>
      <div className="grid grid-cols-[90px_1fr] gap-3 items-center mt-2">
        <div className="w-[90px] h-[90px] relative">
          <Doughnut
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              cutout: '65%',
              plugins: { legend: { display: false }, tooltip: { enabled: true } },
            }}
          />
        </div>
        <div className="text-[11px] flex flex-col gap-1">
          {slices.map((s) => (
            <div key={s.label} className="flex justify-between gap-2">
              <span>
                <span
                  className="inline-block w-2 h-2 rounded-sm mr-1.5 align-middle"
                  style={{ background: s.color }}
                />
                {s.label}
              </span>
              <span className="t-mono font-bold text-slate-900">{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
