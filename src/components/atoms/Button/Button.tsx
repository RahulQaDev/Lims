import Spinner from '../Spinner/Spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  ...props
}: ButtonProps) => {
  const baseClasses = 'inline-flex justify-center rounded-md font-semibold shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer';

  const variants: Record<'primary' | 'secondary' | 'danger' | 'outline', string> = {
    primary: 'bg-[#00a6fb] text-white hover:bg-[#0095e2] focus-visible:outline-[#00a6fb]',
    secondary: 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-500 focus-visible:outline-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-500 focus-visible:outline-red-500',
    outline: 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus-visible:outline-gray-500'
  };

  const sizes: Record<'sm' | 'md' | 'lg', string> = {
    sm: 'px-3 py-1.5 text-sm/6',
    md: 'px-3 py-1.5 text-sm/6',
    lg: 'px-4 py-2 text-base/6'
  };

  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${disabled || loading ? 'cursor-not-allowed opacity-50' : ''} ${className}`;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={classes}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <Spinner size="lg" className="-ml-1 mr-3" />
          {children}
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
