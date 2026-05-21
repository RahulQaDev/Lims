import { forwardRef, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronUpDownIcon } from '@heroicons/react/16/solid';
import { CheckIcon } from '@heroicons/react/20/solid';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> {
  id?: string;
  name?: string;
  label?: string;
  options?: SelectOption[];
  placeholder?: string;
  error?: string;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  value?: string;
  onChange?: (event: { target: { name?: string; value: string } }) => void;
  onScrollEnd?: () => void;
  loading?: boolean;
  autoOpen?: boolean;
  onDropdownClose?: () => void;
  size?: 'sm' | 'md';
}

const Select = forwardRef<HTMLInputElement, SelectProps>(({
  id,
  name,
  label,
  options = [],
  placeholder = "Select an option",
  error,
  className = '',
  disabled = false,
  readOnly = false,
  required = false,
  value = '',
  onChange,
  onScrollEnd,
  loading = false,
  autoOpen = false,
  onDropdownClose,
  onBlur,
  size = 'md',
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const onDropdownCloseRef = useRef(onDropdownClose);
  onDropdownCloseRef.current = onDropdownClose;
  const wasOpenRef = useRef(false);

  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number; flipUp?: boolean } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Auto-open: open dropdown after mount (needs 2 frames for button to render + position)
  const autoOpenDone = useRef(false);
  useEffect(() => {
    if (autoOpen && !autoOpenDone.current) {
      autoOpenDone.current = true;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsOpen(true);
        });
      });
    }
  }, [autoOpen]);

  // Fire onBlur when dropdown closes (for form validation on touch)
  useEffect(() => {
    if (wasOpenRef.current && !isOpen && onBlur) {
      onBlur({} as React.FocusEvent<HTMLInputElement>);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, onBlur]);

  // Get display label
  const selectedOption = options.find(opt => opt.value === value);
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  // Filter options based on search term
  const filteredOptions = searchTerm
    ? options.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : options;

  // Scroll focused option into view when keyboard navigation is used
  useEffect(() => {
    if (focusedIndex >= 0 && optionRefs.current[focusedIndex]) {
      optionRefs.current[focusedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [focusedIndex]);

  // Calculate dropdown position when opening (flip above if not enough space below)
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updatePosition = () => {
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          const maxDropdownHeight = 240; // matches max-h-60 (15rem = 240px)
          const spaceBelow = window.innerHeight - rect.bottom - 8;
          const spaceAbove = rect.top - 8;

          // Place above if not enough space below but enough above
          const placeAbove = spaceBelow < maxDropdownHeight && spaceAbove > spaceBelow;

          setDropdownPosition({
            top: placeAbove ? rect.top - 4 : rect.bottom + 4,
            left: rect.left,
            width: rect.width,
            flipUp: placeAbove,
          });
        }
      };

      updatePosition();

      // Focus the search input when dropdown opens
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);

      // Update position on scroll and resize
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);

      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    } else {
      setDropdownPosition(null);
    }
  }, [isOpen]);

  // Close dropdown when clicking outside.
  // Uses CAPTURE phase so this listener runs before any ancestor that might
  // call stopPropagation on mousedown (e.g. the SignReportModal wrapper does
  // this to keep clicks from leaking to its backdrop). Without capture, the
  // dropdown would stay open when the user clicked anywhere inside such a modal.
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const clickedInsideContainer = containerRef.current?.contains(event.target as Node);
      const clickedInsideOptions = optionsRef.current?.contains(event.target as Node);
      if (!clickedInsideContainer && !clickedInsideOptions) {
        setIsOpen(false);
        setSearchTerm('');
        onDropdownCloseRef.current?.();
      }
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled || readOnly) return;

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (isOpen && focusedIndex >= 0 && filteredOptions[focusedIndex]) {
          handleSelect(filteredOptions[focusedIndex].value);
        } else if (!isOpen) {
          setIsOpen(true);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex(prev => Math.min(prev + 1, filteredOptions.length - 1));
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setFocusedIndex(prev => Math.max(prev - 1, 0));
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        break;
    }
  };

  const handleSelect = (selectedValue: string) => {
    if (onChange) {
      onChange({ target: { name, value: selectedValue } });
    }
    setIsOpen(false);
    setSearchTerm('');
    setFocusedIndex(-1);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!onScrollEnd) return;
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 50) {
      onScrollEnd();
    }
  };

  return (
    <div className={className} ref={containerRef}>
      {label && (
        <label className="block text-sm/6 font-medium text-gray-900 dark:text-gray-100 mb-2">
          {label}{required && <span className="text-gray-900 dark:text-gray-100 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => !disabled && !readOnly && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (!isOpen) { onDropdownCloseRef.current?.(); } }}
          disabled={disabled}
          className={`w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#00a6fb] focus:border-[#00a6fb] text-left text-gray-900 dark:text-white ${size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-3 py-2 text-sm'} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
            } ${disabled ? 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' : ''} ${readOnly ? 'cursor-default bg-white dark:bg-gray-700' : ''} ${!disabled && !readOnly ? 'cursor-pointer bg-white dark:bg-gray-700' : ''}`}
        >
          <span className="flex items-center justify-between">
            <span className={`truncate ${!value ? 'text-gray-500 dark:text-gray-400' : ''}`}>
              {displayLabel}
            </span>
            <ChevronUpDownIcon
              aria-hidden="true"
              className={`${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2 ${disabled ? 'text-gray-300 dark:text-gray-500' : ''}`}
            />
          </span>
        </button>

        {isOpen && dropdownPosition && createPortal(
          <div data-select-portal="true">
            {/* Backdrop to close on outside click */}
            <div
              className="fixed inset-0 z-[9998]"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => { setIsOpen(false); onDropdownCloseRef.current?.(); }}
            />
            {/* Dropdown menu */}
            <div
              className="fixed z-[9999] rounded-md bg-white dark:bg-gray-700 text-base shadow-lg ring-1 ring-black/5 dark:ring-gray-600 focus:outline-none sm:text-sm"
              style={{
                ...(dropdownPosition.flipUp
                  ? { bottom: `${window.innerHeight - dropdownPosition.top}px` }
                  : { top: `${dropdownPosition.top}px` }),
                left: `${dropdownPosition.left}px`,
                width: `${dropdownPosition.width}px`,
                zIndex: 9999
              }}
            >
              {/* Search input */}
              <div className="p-2 border-b border-gray-200 dark:border-gray-600">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setFocusedIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Type to search..."
                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* Options list */}
              <div
                ref={optionsRef}
                data-portal-dropdown="true"
                onScroll={handleScroll}
                className="max-h-52 overflow-auto py-1"
              >
              {filteredOptions.length === 0 && !loading && (
                <div className="py-2 px-3 text-center text-sm text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'No matching options' : 'No options available'}
                </div>
              )}
              {filteredOptions.map((option, index) => {
                const isSelected = option.value === value;
                const isFocused = index === focusedIndex;
                return (
                  <div
                    key={option.value}
                    ref={(el) => {optionRefs.current[index] = el}}
                    onClick={() => handleSelect(option.value)}
                    onMouseEnter={() => setFocusedIndex(index)}
                    className={`relative cursor-pointer select-none py-2 pl-3 pr-9 ${isFocused ? 'bg-[#00a6fb] text-white' : 'text-gray-900 dark:text-white'
                      }`}
                  >
                    <span className={`block truncate ${isSelected ? 'font-semibold' : 'font-normal'}`}>
                      {option.label}
                    </span>
                    {isSelected && (
                      <span className={`absolute inset-y-0 right-0 flex items-center pr-4 ${isFocused ? 'text-white' : 'text-[#00a6fb]'
                        }`}>
                        <CheckIcon aria-hidden="true" className="h-5 w-5" />
                      </span>
                    )}
                  </div>
                );
              })}
              {loading && (
                <div className="py-2 px-3 text-center text-sm text-gray-500 dark:text-gray-400">
                  Loading more...
                </div>
              )}
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
      <input ref={ref} type="hidden" id={id} name={name} value={value} readOnly onBlur={onBlur} {...props} />
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
