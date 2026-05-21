import React from 'react';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Minimal skeleton placeholder. Caller supplies sizing + shape classes
 * (e.g. `h-10 w-full rounded-md`, `h-4 w-4 rounded`). The base
 * animation + palette are fixed so skeletons across the app look identical.
 * `style` is accepted for cases where the width is computed (e.g. random
 * shimmer widths or pixel-exact placeholders).
 */
export const Skeleton: React.FC<SkeletonProps> = ({ className = '', style }) => (
  <div className={`bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`} style={style} />
);

export default Skeleton;
