import { forwardRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  id?: string;
  name?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  error?: string;
  label?: string;
  helperText?: string;
  className?: string;
  required?: boolean;
  rows?: number;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  id,
  name,
  value,
  onChange,
  placeholder,
  error,
  label,
  helperText,
  className = '',
  required = false,
  rows = 4,
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`block w-full rounded-md bg-white dark:bg-gray-700 px-3 py-1.5 text-base text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-400 focus:border-[#00a6fb] focus:ring-1 focus:ring-[#00a6fb] focus:outline-none sm:text-sm/6 resize-none ${
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
            : ''
        } ${className}`}
        {...props}
      />
      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;

