import TplanChip, { type TplanAspect } from './TplanChip';

interface GaugeCardProps {
  label: string;
  /** Current percentage 0–100 */
  value: number;
  /** Optional secondary text e.g. "22 of 22 days" */
  sub?: string;
  /** Optional target threshold percentage (draws a notch at this angle) */
  target?: number;
  tplan?: TplanAspect;
  /** lower-is-better gauge — fills from the OTHER end and colors invert */
  inverse?: boolean;
}

/**
 * SVG circular gauge matching the mock. Shows a colored arc (green ≥90, amber ≥75, red <75).
 * Set `inverse` for "lower is better" KPIs (e.g. redo rate).
 */
export default function GaugeCard({ label, value, sub, target, tplan, inverse }: GaugeCardProps) {
  const v = Math.max(0, Math.min(100, value));
  const effective = inverse ? 100 - v : v;
  const color = effective >= 90 ? '#16a34a' : effective >= 75 ? '#d97706' : '#dc2626';

  // Circle: radius 30, circumference ~188. We draw an arc = (value/100) * 188.
  const CIRC = 2 * Math.PI * 30;
  const dash = (v / 100) * CIRC;
  const targetDash = target !== undefined ? (Math.max(0, Math.min(100, target)) / 100) * CIRC : null;

  return (
    <div className="bg-white border border-slate-200 rounded-[10px] p-4 flex flex-col">
      <div className="flex items-start justify-between">
        <div className="t-label">{label}</div>
        {tplan && <TplanChip aspect={tplan} />}
      </div>
      <div className="flex items-center gap-3.5 mt-1">
        <svg viewBox="0 0 70 70" className="w-[70px] h-[70px] -rotate-90 shrink-0">
          <circle cx="35" cy="35" r="30" fill="none" stroke="#e2e8f0" strokeWidth="7" />
          <circle
            cx="35"
            cy="35"
            r="30"
            fill="none"
            stroke={color}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${CIRC}`}
          />
          {targetDash !== null && (
            <circle
              cx="35"
              cy="35"
              r="30"
              fill="none"
              stroke="#dc2626"
              strokeWidth="1"
              strokeDasharray={`1 ${CIRC - 1}`}
              strokeDashoffset={-targetDash + 0.5}
            />
          )}
        </svg>
        <div>
          <div className="t-mono text-[22px] font-bold text-slate-900 leading-none">
            {v.toFixed(v % 1 === 0 ? 0 : 1)}
            <span className="text-[11px] text-slate-500 font-medium ml-0.5">%</span>
          </div>
          {sub && <div className="text-[10px] text-slate-500 mt-1">{sub}</div>}
        </div>
      </div>
    </div>
  );
}
