import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id?: string;
  name?: string;
  type?: string;
  value?: string | number;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  label?: string;
  helperText?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
  label,
  helperText,
  className = '',
  required = false,
  disabled = false,
  readOnly = false,
  ...props
}, ref) => {
  return (
    <div className={`w-full ${type === 'date' ? 'relative isolate' : ''}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100 mb-2">
          {label}{required && <span className="text-gray-900 dark:text-gray-100 ml-0.5">*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        readOnly={readOnly}
        className={`block w-full rounded-md px-3 py-1.5 text-base text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-400 focus:border-[#00a6fb] focus:ring-1 focus:ring-[#00a6fb] focus:outline-none sm:text-sm/6 disabled:bg-gray-100 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:placeholder:text-gray-400 dark:disabled:placeholder:text-gray-500 ${readOnly ? 'cursor-default' : ''} ${error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
            : ''
          } ${className}`}
        style={type === 'date' ? {
          position: 'relative',
          zIndex: 10,
          isolation: 'isolate'
        } : undefined}
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

Input.displayName = 'Input';

export default Input;
