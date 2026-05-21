import { forwardRef, useState, useEffect } from 'react';

interface ToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  id?: string;
  name?: string;
  label?: string;
  checked?: boolean;
  onChange?: (event: { target: { name?: string; value: boolean; checked: boolean; type: string } }) => void;
  disabled?: boolean;
  className?: string;
}

const Toggle = forwardRef<HTMLInputElement, ToggleProps>(({
  id,
  name,
  label,
  checked = false,
  onChange,
  disabled = false,
  className = '',
  ...props
}, ref) => {
  const [isChecked, setIsChecked] = useState(checked);

  const handleToggle = () => {
    if (disabled) return;

    const newValue = !isChecked;
    setIsChecked(newValue);

    if (onChange) {
      // Create a synthetic event for React Hook Form
      const syntheticEvent = {
        target: {
          name,
          value: newValue,
          checked: newValue,
          type: 'checkbox'
        }
      };
      onChange(syntheticEvent);
    }
  };

  // Update internal state when checked prop changes
  useEffect(() => {
    setIsChecked(checked);
  }, [checked]);

  return (
    <div className={`flex items-center justify-start gap-6 ${className}`}>
      {label && (
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-5">
          {label}
        </span>
      )}
      <div
        onClick={handleToggle}
        className={`group relative inline-flex items-center w-10 h-5 shrink-0 rounded-full p-0.5 inset-ring inset-ring-gray-900/5 outline-offset-2 outline-[#00a6fb] transition-colors duration-200 ease-in-out ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${isChecked ? 'bg-[#00a6fb]' : 'bg-gray-200 dark:bg-gray-600'}`}
      >
        <span className={`w-4 h-4 rounded-full bg-white shadow-xs ring-1 ring-gray-900/5 transition-transform duration-200 ease-in-out ${isChecked ? 'translate-x-5' : 'translate-x-0'}`} />
        <input
          ref={ref}
          id={id}
          name={name}
          type="checkbox"
          checked={isChecked}
          onChange={() => {}} // Handled by onClick
          disabled={disabled}
          aria-label={label || 'Toggle setting'}
          className="sr-only"
          {...props}
        />
      </div>
    </div>
  );
});

Toggle.displayName = 'Toggle';

export default Toggle;
