interface TextProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  weight?: 'thin' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  color?: 'gray-900' | 'gray-700' | 'gray-600' | 'gray-500' | 'blue-600' | 'red-600' | 'green-600' | 'white';
  align?: 'left' | 'center' | 'right' | 'justify';
  className?: string;
}

const Text = ({
  children,
  as = 'p',
  size = 'base',
  weight = 'normal',
  color = 'gray-900',
  align = 'left',
  className = '',
  ...props
}: TextProps) => {
  const Component = as;

  const sizes: Record<'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl', string> = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl'
  };

  const weights: Record<'thin' | 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'extrabold', string> = {
    thin: 'font-thin',
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    extrabold: 'font-extrabold'
  };

  const colors: Record<'gray-900' | 'gray-700' | 'gray-600' | 'gray-500' | 'blue-600' | 'red-600' | 'green-600' | 'white', string> = {
    'gray-900': 'text-gray-900',
    'gray-700': 'text-gray-700',
    'gray-600': 'text-gray-600',
    'gray-500': 'text-gray-500',
    'blue-600': 'text-blue-600',
    'red-600': 'text-red-600',
    'green-600': 'text-green-600',
    'white': 'text-white'
  };

  const alignments: Record<'left' | 'center' | 'right' | 'justify', string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify'
  };

  const classes = `${sizes[size]} ${weights[weight]} ${colors[color]} ${alignments[align]} ${className}`;

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
};

export default Text;
