/**
 * Format a date string or Date to a readable format.
 */
export function formatDate(
  date: string | Date | undefined | null,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options,
  });
}

/**
 * Format a number as Indian Rupees.
 */
export function formatCurrency(amount: number | undefined | null): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format sample code with prefix (e.g. SMP-2024-00001).
 */
export function formatSampleCode(code: string | undefined | null): string {
  if (!code) return '—';
  return code.toUpperCase();
}

/**
 * Format report / CoA number.
 */
export function formatReportNumber(num: string | undefined | null): string {
  if (!num) return '—';
  return num.toUpperCase();
}

/**
 * Return Tailwind color classes for a given status string.
 */
export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    RECEIVED: 'bg-blue-100 text-blue-800',
    REGISTERED: 'bg-indigo-100 text-indigo-800',
    BOOKED: 'bg-purple-100 text-purple-800',
    IN_TESTING: 'bg-yellow-100 text-yellow-800',
    PENDING_REVIEW: 'bg-orange-100 text-orange-800',
    REVIEWED: 'bg-cyan-100 text-cyan-800',
    APPROVED: 'bg-green-100 text-green-800',
    COA_GENERATED: 'bg-teal-100 text-teal-800',
    COA_PRINTED: 'bg-emerald-100 text-emerald-800',
    DISPATCHED: 'bg-lime-100 text-lime-800',
    INVOICED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    ON_HOLD: 'bg-gray-100 text-gray-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    VERIFIED: 'bg-emerald-100 text-emerald-800',
    RETURNED: 'bg-orange-100 text-orange-800',
    DRAFT: 'bg-gray-100 text-gray-800',
    SENT: 'bg-blue-100 text-blue-800',
    PAID: 'bg-green-100 text-green-800',
    OVERDUE: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-gray-100 text-gray-600',
    PARTIALLY_PAID: 'bg-yellow-100 text-yellow-800',
    NORMAL: 'bg-blue-100 text-blue-800',
    URGENT: 'bg-orange-100 text-orange-800',
    CRITICAL: 'bg-red-100 text-red-800',
  };
  return map[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Return a human-readable label for a status string.
 */
export function getStatusBadge(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Truncate a string to maxLength, appending ellipsis if needed.
 */
export function truncate(str: string | undefined | null, maxLength: number = 50): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}
