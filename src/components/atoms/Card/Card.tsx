interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const Card = ({
  children,
  variant = 'default',
  padding = 'md',
  shadow = 'sm',
  className = '',
  ...props
}: CardProps) => {
  const variants: Record<'default' | 'elevated' | 'outlined' | 'filled', string> = {
    default: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    elevated: 'bg-white dark:bg-gray-800',
    outlined: 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600',
    filled: 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'
  };

  const paddings: Record<'none' | 'sm' | 'md' | 'lg', string> = {
    none: '',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  };

  const shadows: Record<'none' | 'sm' | 'md' | 'lg' | 'xl', string> = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };

  return (
    <div
      className={`rounded-lg ${variants[variant]} ${paddings[padding]} ${shadows[shadow]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
