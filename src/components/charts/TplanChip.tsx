export type TplanAspect = 'customer' | 'internal' | 'learning' | 'financial';

const TPLAN_META: Record<TplanAspect, { label: string; bg: string; text: string }> = {
  customer:  { label: 'Customer',  bg: '#dbeafe', text: '#1e40af' },
  internal:  { label: 'Internal',  bg: '#e0e7ff', text: '#3730a3' },
  learning:  { label: 'L&G',       bg: '#dcfce7', text: '#166534' },
  financial: { label: 'Financial', bg: '#fef3c7', text: '#92400e' },
};

export default function TplanChip({ aspect }: { aspect: TplanAspect }) {
  const m = TPLAN_META[aspect];
  return (
    <span
      className="t-chip"
      style={{ background: m.bg, color: m.text }}
      title={`Balanced Scorecard: ${m.label}`}
    >
      {m.label}
    </span>
  );
}
