import TplanChip, { type TplanAspect } from './TplanChip';

interface Props {
  label: string;
  title: string;
  description?: string;
  items: string[];
  tplan?: TplanAspect;
}

export default function MilestoneCard({ label, title, description, items, tplan }: Props) {
  return (
    <div
      className="rounded-[10px] p-4 border flex flex-col"
      style={{
        background: 'linear-gradient(135deg, #eff6ff, #e0f2fe)',
        borderColor: '#93c5fd',
      }}
    >
      <div className="flex items-start justify-between">
        <div className="t-label" style={{ color: '#0b1c3d' }}>{label}</div>
        {tplan && <TplanChip aspect={tplan} />}
      </div>
      <div className="text-[12px] font-bold mt-1" style={{ color: '#0b1c3d' }}>{title}</div>
      {description && <div className="text-[11px] text-slate-600 mt-1 leading-relaxed">{description}</div>}
      <ul className="list-none flex flex-col gap-1.5 mt-2">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2 text-[11px] text-slate-700 leading-snug">
            <span className="text-blue-600 font-bold">→</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
