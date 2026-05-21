import { format, isValid } from 'date-fns';

/**
 * Format a date value as `dd MMM yyyy` (e.g. "20 Apr 2026").
 *
 * This is the standard display format for grids and previews across YLIMS
 * per the ui-standards skill. Handles null, undefined, and invalid values
 * by returning an em-dash so callers can just render the return value.
 *
 * Accepts either an ISO/date string or a Date object.
 */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '-';
  const d = value instanceof Date ? value : new Date(value);
  if (!isValid(d)) return '-';
  return format(d, 'dd MMM yyyy');
}

/**
 * Format a date-time value as `dd MMM yyyy, HH:mm` (24-hour).
 * Same null/invalid handling as `formatDate`.
 */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '-';
  const d = value instanceof Date ? value : new Date(value);
  if (!isValid(d)) return '-';
  return format(d, 'dd MMM yyyy, HH:mm');
}
