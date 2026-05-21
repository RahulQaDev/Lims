interface ErrorMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
  variant?: 'default' | 'inline' | 'banner';
  className?: string;
}

const ErrorMessage = ({
  message,
  variant = 'default',
  className = '',
  ...props
}: ErrorMessageProps) => {
  if (!message) return null;

  const variants: Record<'default' | 'inline' | 'banner', string> = {
    default: 'mb-4 rounded-md bg-red-50 dark:bg-red-900/20 p-4',
    inline: 'mt-2',
    banner: 'mb-6 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4'
  };

  const textClasses: Record<'default' | 'inline' | 'banner', string> = {
    default: 'text-sm text-red-700 dark:text-red-400',
    inline: 'text-sm text-red-600 dark:text-red-400',
    banner: 'text-sm text-red-800 dark:text-red-300'
  };

  return (
    <div className={`${variants[variant]} ${className}`} {...props}>
      <div className={textClasses[variant]}>
        {message}
      </div>
    </div>
  );
};

export default ErrorMessage;
