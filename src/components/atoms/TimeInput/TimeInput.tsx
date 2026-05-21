import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ClockIcon } from '@heroicons/react/24/outline';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);
const PERIODS: ('AM' | 'PM')[] = ['AM', 'PM'];

interface TimeInputProps {
  label?: string;
  required?: boolean;
  error?: string;
  value?: string; // HH:mm (24h) from form
  onChange?: (timeStr: string) => void;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  name?: string;
}

const TimeInput = React.forwardRef<HTMLInputElement, TimeInputProps>(
  (
    {
      label,
      required = false,
      error,
      value,
      onChange,
      placeholder = 'hh:mm AM/PM',
      disabled = false,
      readOnly = false,
      name,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const hourColRef = useRef<HTMLDivElement>(null);
    const minColRef = useRef<HTMLDivElement>(null);

    // Parse HH:mm to hour/minute/period
    const parseTime = (val: string) => {
      if (!val) return { hour: 12, minute: 0, period: 'AM' as const };
      const [h, m] = val.split(':').map(Number);
      const period = h >= 12 ? ('PM' as const) : ('AM' as const);
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      return { hour: hour12, minute: m || 0, period };
    };

    const { hour, minute, period } = parseTime(value || '');

    // Display value
    const displayValue = value
      ? `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`
      : '';

    // Convert 12h to 24h and emit
    const emitChange = useCallback(
      (h: number, m: number, p: 'AM' | 'PM') => {
        let h24 = h;
        if (p === 'AM' && h === 12) h24 = 0;
        else if (p === 'PM' && h !== 12) h24 = h + 12;
        const timeStr = `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        if (onChange) onChange(timeStr);
      },
      [onChange]
    );

    // Position
    const syncPosition = useCallback(() => {
      if (!triggerRef.current || !popoverRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const el = popoverRef.current;
      const popoverHeight = el.offsetHeight || 240;
      const spaceBelow = window.innerHeight - rect.bottom;

      if (spaceBelow >= popoverHeight + 4) {
        el.style.top = `${rect.bottom + 4}px`;
      } else {
        el.style.top = `${Math.max(4, rect.top - popoverHeight - 4)}px`;
      }
      // Align left edge with input, but don't overflow right
      const left = Math.min(rect.left, window.innerWidth - 190);
      el.style.left = `${left}px`;
    }, []);

    // Scroll selected items into view on open
    useEffect(() => {
      if (!isOpen) return;
      if (!value && onChange) {
        onChange('12:00');
      }
      // Double rAF to ensure popover is rendered and sized before positioning
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          syncPosition();
          // Scroll to selected hour
          const hourEl = hourColRef.current?.querySelector('[data-selected="true"]');
          if (hourEl) hourEl.scrollIntoView({ block: 'center', behavior: 'instant' });
          // Scroll to selected minute
          const minEl = minColRef.current?.querySelector('[data-selected="true"]');
          if (minEl) minEl.scrollIntoView({ block: 'center', behavior: 'instant' });
        });
      });

      const handleClickOutside = (e: MouseEvent) => {
        if (
          triggerRef.current?.contains(e.target as Node) ||
          popoverRef.current?.contains(e.target as Node)
        )
          return;
        setIsOpen(false);
      };
      const handleScroll = () => requestAnimationFrame(syncPosition);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsOpen(false);
      };

      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
        document.removeEventListener('keydown', handleKeyDown);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, syncPosition]);

    const itemBase =
      'w-full px-2 py-1 text-xs text-center rounded-md cursor-pointer transition-colors';
    const itemActive = 'bg-[#00a6fb] text-white font-semibold';
    const itemInactive =
      'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700';

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100 mb-2">
            {label}
            {required && (
              <span className="text-gray-900 dark:text-gray-100 ml-0.5">*</span>
            )}
          </label>
        )}

        <input ref={ref} type="hidden" name={name} value={value || ''} readOnly />

        <div
          ref={triggerRef}
          onClick={() => {
            if (!disabled && !readOnly) setIsOpen(!isOpen);
          }}
          className={`flex items-center w-full rounded-md px-3 py-1.5 border cursor-pointer transition-colors sm:text-sm/6 ${
            disabled
              ? 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed border-gray-300 dark:border-gray-600'
              : readOnly
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-default border-gray-300 dark:border-gray-600'
                : isOpen
                  ? 'bg-white dark:bg-gray-700 border-[#00a6fb] ring-1 ring-[#00a6fb]'
                  : error
                    ? 'bg-white dark:bg-gray-700 border-red-500'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }`}
        >
          <span
            className={`flex-1 ${
              displayValue
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-400 dark:text-gray-400'
            }`}
          >
            {displayValue || placeholder}
          </span>
          <ClockIcon className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
        </div>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        {isOpen &&
          createPortal(
            <div
              ref={popoverRef}
              style={{ position: 'fixed', zIndex: 9999, width: 180 }}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-2"
            >
              {/* Scrollable columns */}
              <div className="flex gap-1" style={{ height: 180 }}>
                {/* Hours */}
                <div
                  ref={hourColRef}
                  className="flex-1 overflow-y-auto space-y-0.5 scrollbar-thin pr-0.5"
                >
                  {HOURS.map((h) => (
                    <button
                      key={h}
                      type="button"
                      data-selected={h === hour}
                      onClick={() => emitChange(h, minute, period)}
                      className={`${itemBase} ${h === hour ? itemActive : itemInactive}`}
                    >
                      {String(h).padStart(2, '0')}
                    </button>
                  ))}
                </div>

                {/* Minutes */}
                <div
                  ref={minColRef}
                  className="flex-1 overflow-y-auto space-y-0.5 scrollbar-thin pr-0.5"
                >
                  {MINUTES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      data-selected={m === minute}
                      onClick={() => emitChange(hour, m, period)}
                      className={`${itemBase} ${m === minute ? itemActive : itemInactive}`}
                    >
                      {String(m).padStart(2, '0')}
                    </button>
                  ))}
                </div>

                {/* AM/PM */}
                <div className="w-10 space-y-0.5">
                  {PERIODS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => emitChange(hour, minute, p)}
                      className={`${itemBase} ${p === period ? itemActive : itemInactive}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear */}
              {value && (
                <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (onChange) onChange('');
                      setIsOpen(false);
                    }}
                    className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors px-2 py-1"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>,
            document.body
          )}
      </div>
    );
  }
);

TimeInput.displayName = 'TimeInput';

export default TimeInput;
