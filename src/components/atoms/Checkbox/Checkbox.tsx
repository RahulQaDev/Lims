import { forwardRef } from 'react';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  id?: string;
  name?: string;
  label?: string;
  description?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({
  id,
  name,
  label,
  description,
  error,
  className = '',
  disabled = false,
  ...props
}, ref) => {
  return (
    <div className={`flex gap-3 ${className}`}>
      <div className="flex h-6 shrink-0 items-center">
        <div className="group grid size-4 grid-cols-1">
          <input
            ref={ref}
            id={id}
            name={name}
            type="checkbox"
            aria-describedby={description ? `${id}-description` : undefined}
            disabled={disabled}
            className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 checked:border-[#00a6fb] checked:bg-[#00a6fb] indeterminate:border-[#00a6fb] indeterminate:bg-[#00a6fb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00a6fb] disabled:border-gray-300 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
            {...props}
          />
          <svg
            fill="none"
            viewBox="0 0 14 14"
            className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25"
          >
            <path
              d="M3 8L6 11L11 3.5"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-0 group-has-checked:opacity-100"
            />
            <path
              d="M3 7H11"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-0 group-has-indeterminate:opacity-100"
            />
          </svg>
        </div>
      </div>
      <div className="text-sm/6">
        <label htmlFor={id} className="font-medium text-gray-900 dark:text-gray-100 cursor-pointer">
          {label}
        </label>
        {description && (
          <p id={`${id}-description`} className="text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
        {error && (
          <p className="text-red-600 text-xs mt-1">
            {error}
          </p>
        )}
      </div>
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

export default Checkbox;
