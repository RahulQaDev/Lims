import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { DayPicker } from 'react-day-picker';
import { format, parse, isValid } from 'date-fns';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface DateInputProps {
  label?: string;
  required?: boolean;
  error?: string;
  value?: string; // yyyy-MM-dd from form
  onChange?: (dateStr: string) => void; // emits yyyy-MM-dd
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  name?: string;
  maxDate?: Date; // Disable dates after this date
  minDate?: Date; // Disable dates before this date
  displayFormat?: string; // Display format (default: dd/MM/yyyy). E.g. 'dd MMM yyyy' for "28 Mar 2026"
  autoOpen?: boolean; // Open calendar immediately on mount
  keepOpenOnSelect?: boolean; // Don't close calendar on date selection — close on outside click only
  onCalendarClose?: () => void; // Called when calendar closes (outside click)
  onClear?: () => void; // Custom clear handler (overrides default clear behavior)
  compact?: boolean; // Compact mode for toolbar usage — smaller padding, text-xs, shorter icon
}

const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  (
    {
      label,
      required = false,
      error,
      value,
      onChange,
      placeholder = 'dd/mm/yyyy',
      disabled = false,
      readOnly = false,
      name,
      maxDate,
      minDate,
      displayFormat = 'dd/MM/yyyy',
      autoOpen = false,
      keepOpenOnSelect = false,
      onCalendarClose,
      onClear,
      compact = false,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const autoOpenDone = useRef(false);
    const onCalendarCloseRef = useRef(onCalendarClose);
    onCalendarCloseRef.current = onCalendarClose;
    const onClearRef = useRef(onClear);
    onClearRef.current = onClear;
    useEffect(() => {
      if (autoOpen && !autoOpenDone.current) {
        autoOpenDone.current = true;
        setIsOpen(true);
      }
    }, [autoOpen]);
    const triggerRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    // Close calendar when trigger becomes hidden (e.g., filter panel collapses)
    useEffect(() => {
      if (!isOpen) return;
      const checkVisibility = () => {
        const el = triggerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) setIsOpen(false);
      };
      const id = setInterval(checkVisibility, 300);
      return () => clearInterval(id);
    }, [isOpen]);

    // Parse yyyy-MM-dd to Date
    const selectedDate = value
      ? (() => {
          const d = parse(value, 'yyyy-MM-dd', new Date());
          return isValid(d) ? d : undefined;
        })()
      : undefined;

    const displayValue = selectedDate ? format(selectedDate, displayFormat) : '';

    const handleSelect = (date: Date | undefined) => {
      if (date && onChange) {
        onChange(format(date, 'yyyy-MM-dd'));
      }
      if (!keepOpenOnSelect) {
        setIsOpen(false);
      }
    };

    // Position the popover
    const syncPosition = useCallback(() => {
      if (!triggerRef.current || !popoverRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const el = popoverRef.current;
      const popoverHeight = el.offsetHeight || 340;
      const popoverWidth = el.offsetWidth || 300;
      const spaceBelow = window.innerHeight - rect.bottom;

      if (spaceBelow >= popoverHeight + 4) {
        el.style.top = `${rect.bottom + 4}px`;
      } else {
        el.style.top = `${Math.max(4, rect.top - popoverHeight - 4)}px`;
      }
      const left = Math.min(rect.left, window.innerWidth - popoverWidth - 8);
      el.style.left = `${Math.max(4, left)}px`;
    }, []);

    useEffect(() => {
      if (!isOpen) return;
      requestAnimationFrame(() => requestAnimationFrame(syncPosition));

      const handleClickOutside = (e: MouseEvent) => {
        // Use composedPath() to reliably detect clicks inside the popover
        // (e.target may reference a removed DOM node after DayPicker re-renders on nav)
        const path = e.composedPath();
        if (
          (triggerRef.current && path.includes(triggerRef.current)) ||
          (popoverRef.current && path.includes(popoverRef.current))
        )
          return;
        setIsOpen(false);
        onCalendarCloseRef.current?.();
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
    }, [isOpen, syncPosition]);

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100 mb-2">
            {label}
            {required && <span className="text-gray-900 dark:text-gray-100 ml-0.5">*</span>}
          </label>
        )}

        {/* Hidden input for form integration */}
        <input
          ref={ref}
          type="hidden"
          name={name}
          value={value || ''}
          readOnly
        />

        {/* Visible trigger */}
        <div
          ref={triggerRef}
          onClick={() => {
            if (!disabled && !readOnly) setIsOpen(!isOpen);
          }}
          className={`flex items-center w-full rounded-md border cursor-pointer transition-colors ${compact ? 'px-3 py-2 text-xs gap-1' : 'px-3 py-1.5 sm:text-sm/6'} ${
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
          <CalendarIcon className={`${compact ? 'w-3.5 h-3.5 ml-1' : 'w-4 h-4 ml-2'} text-gray-400 flex-shrink-0`} />
        </div>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        {/* Calendar popover */}
        {isOpen &&
          createPortal(
            <div
              ref={popoverRef}
              data-datepicker-portal
              style={{ position: 'fixed', zIndex: 9999 }}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-3"
            >
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={handleSelect}
                defaultMonth={selectedDate || new Date()}
                showOutsideDays
                disabled={[
                  ...(maxDate ? [{ after: maxDate }] : []),
                  ...(minDate ? [{ before: minDate }] : []),
                ] as any}
                classNames={{
                  months: 'flex flex-col',
                  month: 'space-y-3',
                  month_caption: 'flex justify-center items-center h-8',
                  caption_label: 'text-sm font-semibold text-gray-900 dark:text-white',
                  nav: 'flex items-center justify-between absolute top-3 left-3 right-3',
                  button_previous:
                    'p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-pointer',
                  button_next:
                    'p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-pointer',
                  month_grid: 'w-full border-collapse',
                  weekdays: 'flex',
                  weekday:
                    'w-9 h-8 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400',
                  week: 'flex',
                  day: 'w-9 h-9 flex items-center justify-center',
                  day_button:
                    'w-8 h-8 rounded-md text-sm text-gray-900 dark:text-gray-100 hover:bg-[#00a6fb]/10 dark:hover:bg-[#00a6fb]/20 transition-colors cursor-pointer',
                  selected:
                    '!bg-[#00a6fb] !text-white rounded-md hover:!bg-[#0095e8]',
                  today: 'font-bold text-[#00a6fb]',
                  outside: 'text-gray-300 dark:text-gray-600',
                  disabled: 'text-gray-300 dark:text-gray-600 opacity-40 [&>button]:!cursor-not-allowed [&>button]:hover:!bg-transparent',
                }}
                components={{
                  Chevron: (props) =>
                    props.orientation === 'left' ? (
                      <ChevronLeftIcon className="w-4 h-4" />
                    ) : (
                      <ChevronRightIcon className="w-4 h-4" />
                    ),
                }}
              />
              {selectedDate && (
                <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (onClearRef.current) {
                        onClearRef.current();
                      } else if (onChange) {
                        onChange('');
                      }
                      setIsOpen(false);
                    }}
                    className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors px-2 py-1 cursor-pointer"
                  >
                    Clear
                  </button>
                  {keepOpenOnSelect && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onCalendarCloseRef.current?.();
                      }}
                      className="text-xs font-medium text-white bg-[#00a6fb] hover:bg-[#0095e2] transition-colors px-3 py-1 rounded cursor-pointer"
                    >
                      OK
                    </button>
                  )}
                </div>
              )}
            </div>,
            document.body
          )}
      </div>
    );
  }
);

DateInput.displayName = 'DateInput';

export default DateInput;
