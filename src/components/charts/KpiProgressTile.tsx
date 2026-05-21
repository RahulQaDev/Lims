import TplanChip, { type TplanAspect } from './TplanChip';

interface Props {
  label: string;
  value: string | number;
  unit?: string;
  /** "X / Y" right-hand progress readout */
  progress?: string;
  /** 0–100 for bar width */
  percent: number;
  /** Color tone: blue default, green for "on target", red for "miss" */
  tone?: 'blue' | 'green' | 'red' | 'amber';
  footerLeft?: string;
  footerRight?: string;
  tplan?: TplanAspect;
}

const TONE_GRADIENT = {
  blue:  'linear-gradient(90deg, #2563eb, #06b6d4)',
  green: 'linear-gradient(90deg, #16a34a, #15803d)',
  red:   'linear-gradient(90deg, #dc2626, #991b1b)',
  amber: 'linear-gradient(90deg, #d97706, #92400e)',
};

export default function KpiProgressTile({
  label, value, unit, progress, percent, tone = 'blue', footerLeft, footerRight, tplan,
}: Props) {
  const width = Math.max(0, Math.min(100, percent));
  return (
    <div className="bg-white border border-slate-200 rounded-[10px] p-4 flex flex-col">
      <div className="flex items-start justify-between">
        <div className="t-label">{label}</div>
        {tplan && <TplanChip aspect={tplan} />}
      </div>
      <div className="flex items-baseline justify-between mt-1 t-mono text-[11px] text-slate-500 font-semibold">
        <span className="text-[19px] text-slate-900 font-bold">
          {value}
          {unit && <span className="text-[11px] text-slate-500 font-medium ml-0.5">{unit}</span>}
        </span>
        {progress && <span>{progress}</span>}
      </div>
      <div className="h-[6px] bg-slate-200 rounded-full overflow-hidden my-1.5">
        <div className="h-full rounded-full" style={{ width: `${width}%`, background: TONE_GRADIENT[tone] }} />
      </div>
      {(footerLeft || footerRight) && (
        <div className="flex justify-between text-[11px] text-slate-500">
          <span>{footerLeft}</span>
          <span>{footerRight}</span>
        </div>
      )}
    </div>
  );
}
