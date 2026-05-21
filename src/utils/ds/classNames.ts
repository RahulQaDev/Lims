/**
 * Utility function to conditionally join class names
 * @param {...string} classes - Class names to join
 * @returns {string} - Joined class names
 */
export const classNames = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};