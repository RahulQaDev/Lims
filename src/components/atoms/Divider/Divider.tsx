interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  color?: 'gray-200' | 'gray-300' | 'gray-400' | 'blue-200';
  thickness?: 'thin' | 'thick';
  className?: string;
}

const Divider = ({
  orientation = 'horizontal',
  color = 'gray-200',
  thickness = 'thin',
  className = '',
  ...props
}: DividerProps) => {
  const orientations: Record<'horizontal' | 'vertical', string> = {
    horizontal: 'w-full',
    vertical: 'h-full'
  };

  const colors: Record<'gray-200' | 'gray-300' | 'gray-400' | 'blue-200', string> = {
    'gray-200': 'border-gray-200',
    'gray-300': 'border-gray-300',
    'gray-400': 'border-gray-400',
    'blue-200': 'border-blue-200'
  };

  const thicknesses: Record<'thin' | 'thick', string> = {
    thin: orientation === 'horizontal' ? 'border-t' : 'border-l',
    thick: orientation === 'horizontal' ? 'border-t-2' : 'border-l-2'
  };

  const classes = `${orientations[orientation]} ${colors[color]} ${thicknesses[thickness]} ${className}`;

  return (
    <div className={classes} {...props} />
  );
};

export default Divider;
