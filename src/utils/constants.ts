export const APP_NAME = 'LabWise LIMS';
export const APP_VERSION = '1.0.0';

export const ROLES = [
  { value: 'ADMIN', label: 'Administrator' },
  { value: 'LAB_DIRECTOR', label: 'Lab Director' },
  { value: 'QUALITY_MANAGER', label: 'Quality Manager' },
  { value: 'DEPARTMENT_HEAD', label: 'Department Head' },
  { value: 'ANALYST', label: 'Analyst' },
  { value: 'REVIEWER', label: 'Reviewer' },
  { value: 'RECEPTIONIST', label: 'Receptionist' },
  { value: 'ACCOUNTS', label: 'Accounts' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'CLIENT', label: 'Client' },
] as const;

export const DEPARTMENTS = [
  'MICRO BIOLOGY',
  'HERBAL',
  'ICPMS',
  'HPLC',
  'WATER',
  'FOOD',
  'MASSPECTROSCOPY',
  'GC',
  'MARKETING',
  'BOOKING',
  'PRINTING',
  'REVIEW',
  'SIGNATURE',
  'CUSTOMER CORDINATOR',
  'APPROVED',
  'INVOICE',
  'AREA MANAGER',
  'ACCOUNTS',
  'XRD',
  'GENERIC',
  'PRODUCT',
  'OUTSOURCE',
  'MALVERN',
  'ICPOES',
  'HPLC2',
  'Technical',
  'Sample Archive',
  'LCMS',
  'Purchase',
  'COSMETICS',
  'HR',
  'Environmental',
  'Validation',
  'AAS',
  'ION Chromatography',
  'DSC',
  'Radiological',
  'PHARMA CHEMICAL',
  'INSTRUMENTATION',
  'MECHANICAL',
  'MOLECULAR BIOLOGY',
  'QA',
] as const;

export const SAMPLE_STATUSES = [
  { value: 'RECEIVED', label: 'Received', color: 'blue' },
  { value: 'REGISTERED', label: 'Registered', color: 'indigo' },
  { value: 'BOOKED', label: 'Booked', color: 'purple' },
  { value: 'IN_TESTING', label: 'In Testing', color: 'yellow' },
  { value: 'PENDING_REVIEW', label: 'Pending Review', color: 'orange' },
  { value: 'REVIEWED', label: 'Reviewed', color: 'cyan' },
  { value: 'APPROVED', label: 'Approved', color: 'green' },
  { value: 'COA_GENERATED', label: 'CoA Generated', color: 'teal' },
  { value: 'COA_PRINTED', label: 'CoA Printed', color: 'emerald' },
  { value: 'DISPATCHED', label: 'Dispatched', color: 'lime' },
  { value: 'INVOICED', label: 'Invoiced', color: 'green' },
  { value: 'REJECTED', label: 'Rejected', color: 'red' },
  { value: 'ON_HOLD', label: 'On Hold', color: 'gray' },
] as const;

export const PRIORITIES = [
  { value: 'NORMAL', label: 'Normal', color: 'blue' },
  { value: 'URGENT', label: 'Urgent', color: 'orange' },
  { value: 'CRITICAL', label: 'Critical', color: 'red' },
] as const;

export const TESTING_TYPES = [
  { value: 'IN_HOUSE', label: 'In-House' },
  { value: 'OUTSOURCED', label: 'Outsourced' },
  { value: 'BOTH', label: 'Both' },
] as const;

export const INVOICE_STATUSES = [
  { value: 'DRAFT', label: 'Draft', color: 'gray' },
  { value: 'SENT', label: 'Sent', color: 'blue' },
  { value: 'PAID', label: 'Paid', color: 'green' },
  { value: 'OVERDUE', label: 'Overdue', color: 'red' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'gray' },
  { value: 'PARTIALLY_PAID', label: 'Partially Paid', color: 'yellow' },
] as const;

export const PERMISSION_TYPES = [
  { value: 'view', label: 'View', color: 'blue', description: 'Can see all information but cannot edit' },
  { value: 'edit', label: 'Edit', color: 'amber', description: 'Can make entries and save changes' },
  { value: 'approve', label: 'Approve', color: 'green', description: 'Read-only + approve or reject decisions' },
] as const;

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 25;
