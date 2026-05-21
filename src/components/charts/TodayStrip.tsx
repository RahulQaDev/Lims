import type { ReactNode } from 'react';

export interface TodayItem {
  label: string;
  value: ReactNode;
  /** 'ok' = green dot, 'alert' = red dot, undefined = no dot */
  status?: 'ok' | 'alert';
}

interface Props {
  /** Strip tag (e.g. "Today") */
  tag?: string;
  items: TodayItem[];
}

export default function TodayStrip({ tag = 'Today', items }: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-[10px] px-5 py-3 flex items-center gap-5">
      <div className="t-label pr-4 border-r border-slate-200 whitespace-nowrap">{tag}</div>
      <div className="flex flex-wrap gap-5 flex-1 text-[12px]">
        {items.map((it) => {
          const strongColor = it.status === 'alert' ? '#dc2626' : it.status === 'ok' ? '#16a34a' : '#0f172a';
          return (
            <div key={it.label} className="flex items-center gap-1.5 text-slate-500">
              {it.status && (
                <span
                  className="w-[5px] h-[5px] rounded-full"
                  style={{ background: it.status === 'alert' ? '#dc2626' : '#16a34a' }}
                />
              )}
              {it.label}{' '}
              <strong className="t-mono font-bold text-[13px]" style={{ color: strongColor }}>
                {it.value}
              </strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}
