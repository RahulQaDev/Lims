import GaugeCard from './GaugeCard';
import type { TplanAspect } from './TplanChip';

/**
 * Convenience wrapper — a lower-is-better gauge.
 * Colors invert (low = green, high = red).
 */
export default function InvertedGauge(props: {
  label: string;
  value: number;
  sub?: string;
  target?: number;
  tplan?: TplanAspect;
}) {
  return <GaugeCard {...props} inverse />;
}
