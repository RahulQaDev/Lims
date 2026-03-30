import type { RoleDefinition, KRAItem, KPIBenchmark } from '../types';

const now = new Date().toISOString();

// ── Role-specific KRA/KPI templates ──

const ANALYST_KRAS: KRAItem[] = [
  { id: 'testing-accuracy', label: 'Testing Accuracy', target: 98, weightage: 30 },
  { id: 'tat-compliance', label: 'Turnaround Compliance', target: 95, weightage: 25 },
  { id: 'sample-throughput', label: 'Sample Throughput', target: 100, weightage: 25 },
  { id: 'quality-score', label: 'Quality Score', target: 95, weightage: 20 },
];

const ANALYST_KPIS: KPIBenchmark[] = [
  { id: 'samples-completed', label: 'Samples Completed / Month', unit: 'count', target: 120, greenThreshold: 100, yellowThreshold: 80 },
  { id: 'avg-tat', label: 'Average TAT', unit: 'hrs', target: 24, greenThreshold: 24, yellowThreshold: 36 },
  { id: 'on-time-pct', label: 'On-Time Delivery', unit: '%', target: 95, greenThreshold: 90, yellowThreshold: 70 },
  { id: 'rejection-rate', label: 'Rejection Rate', unit: '%', target: 2, greenThreshold: 3, yellowThreshold: 7 },
  { id: 'pending-tasks', label: 'Pending Tasks', unit: 'count', target: 0, greenThreshold: 5, yellowThreshold: 10 },
];

const REVIEWER_KRAS: KRAItem[] = [
  { id: 'review-accuracy', label: 'Review Accuracy', target: 99, weightage: 35 },
  { id: 'review-tat', label: 'Review Turnaround', target: 95, weightage: 25 },
  { id: 'rejection-identification', label: 'Rejection Identification', target: 90, weightage: 20 },
  { id: 'compliance-adherence', label: 'Compliance Adherence', target: 100, weightage: 20 },
];

const REVIEWER_KPIS: KPIBenchmark[] = [
  { id: 'reviews-completed', label: 'Reviews Completed / Month', unit: 'count', target: 150, greenThreshold: 130, yellowThreshold: 100 },
  { id: 'avg-review-time', label: 'Avg Review Time', unit: 'hrs', target: 4, greenThreshold: 4, yellowThreshold: 8 },
  { id: 'first-pass-rate', label: 'First Pass Rate', unit: '%', target: 92, greenThreshold: 90, yellowThreshold: 75 },
  { id: 'pending-reviews', label: 'Pending Reviews', unit: 'count', target: 0, greenThreshold: 10, yellowThreshold: 20 },
];

const RECEPTIONIST_KRAS: KRAItem[] = [
  { id: 'registration-accuracy', label: 'Registration Accuracy', target: 99, weightage: 30 },
  { id: 'processing-speed', label: 'Processing Speed', target: 95, weightage: 25 },
  { id: 'client-satisfaction', label: 'Client Satisfaction', target: 90, weightage: 25 },
  { id: 'documentation', label: 'Documentation Compliance', target: 100, weightage: 20 },
];

const RECEPTIONIST_KPIS: KPIBenchmark[] = [
  { id: 'samples-registered', label: 'Samples Registered / Day', unit: 'count', target: 30, greenThreshold: 25, yellowThreshold: 15 },
  { id: 'avg-registration-time', label: 'Avg Registration Time', unit: 'mins', target: 10, greenThreshold: 10, yellowThreshold: 20 },
  { id: 'booking-accuracy', label: 'Booking Accuracy', unit: '%', target: 99, greenThreshold: 97, yellowThreshold: 90 },
  { id: 'client-complaints', label: 'Client Complaints', unit: 'count', target: 0, greenThreshold: 2, yellowThreshold: 5 },
];

const DEPT_HEAD_KRAS: KRAItem[] = [
  { id: 'dept-tat', label: 'Department TAT Compliance', target: 95, weightage: 25 },
  { id: 'team-utilization', label: 'Team Utilization', target: 90, weightage: 20 },
  { id: 'quality-metrics', label: 'Quality Metrics', target: 98, weightage: 25 },
  { id: 'cost-efficiency', label: 'Cost Efficiency', target: 95, weightage: 15 },
  { id: 'training-compliance', label: 'Training Compliance', target: 100, weightage: 15 },
];

const DEPT_HEAD_KPIS: KPIBenchmark[] = [
  { id: 'dept-throughput', label: 'Department Throughput / Month', unit: 'count', target: 500, greenThreshold: 450, yellowThreshold: 350 },
  { id: 'team-on-time', label: 'Team On-Time %', unit: '%', target: 95, greenThreshold: 90, yellowThreshold: 75 },
  { id: 'instrument-uptime', label: 'Instrument Uptime', unit: '%', target: 98, greenThreshold: 95, yellowThreshold: 85 },
  { id: 'dept-rejection', label: 'Department Rejection Rate', unit: '%', target: 2, greenThreshold: 3, yellowThreshold: 7 },
  { id: 'budget-variance', label: 'Budget Variance', unit: '%', target: 5, greenThreshold: 5, yellowThreshold: 15 },
];

const QM_KRAS: KRAItem[] = [
  { id: 'audit-compliance', label: 'Audit Compliance', target: 100, weightage: 30 },
  { id: 'coa-accuracy', label: 'CoA Accuracy', target: 99, weightage: 25 },
  { id: 'corrective-actions', label: 'Corrective Action Closure', target: 95, weightage: 25 },
  { id: 'process-improvement', label: 'Process Improvement', target: 90, weightage: 20 },
];

const QM_KPIS: KPIBenchmark[] = [
  { id: 'coas-approved', label: 'CoAs Approved / Month', unit: 'count', target: 200, greenThreshold: 180, yellowThreshold: 140 },
  { id: 'audit-findings', label: 'Open Audit Findings', unit: 'count', target: 0, greenThreshold: 3, yellowThreshold: 8 },
  { id: 'capa-closure', label: 'CAPA Closure Rate', unit: '%', target: 95, greenThreshold: 90, yellowThreshold: 75 },
  { id: 'deviation-rate', label: 'Deviation Rate', unit: '%', target: 1, greenThreshold: 2, yellowThreshold: 5 },
];

// Helper: grant all permissions on all sub-module keys
function allPermissions(moduleKeys: string[]): Record<string, ('view' | 'edit' | 'approve')[]> {
  const perms: Record<string, ('view' | 'edit' | 'approve')[]> = {};
  for (const key of moduleKeys) perms[key] = ['view', 'edit', 'approve'];
  return perms;
}

const ALL_SUB_KEYS = [
  'dashboard',
  'reception', 'booking', 'sample-tracking', 'sample-transfer',
  'department-work', 'result-entry',
  'technical-review',
  'coa-management', 'coa-templates', 'printing-queue',
  'invoicing', 'client-portal', 'outsource',
  'mis-reports', 'analytics', 'audit-trail',
  'lab-planner', 'department-planner',
  'master-clients', 'master-departments', 'master-tests', 'master-standards', 'master-products', 'master-instruments', 'master-rates',
  'stock-management', 'purchase-orders', 'vendors', 'budget',
  'user-management', 'role-management', 'permission-matrix', 'module-management', 'organogram', 'locations', 'settings',
];

export const DEFAULT_ROLES: RoleDefinition[] = [
  {
    id: 'admin',
    label: 'Administrator',
    description: 'Full system access — manages all modules, users, and configurations',
    permissions: allPermissions(ALL_SUB_KEYS),
    kras: DEPT_HEAD_KRAS,
    kpiBenchmarks: DEPT_HEAD_KPIS,
    isSystem: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'lab_director',
    label: 'Lab Director',
    description: 'Oversees all lab operations, reviews, approvals, and reporting',
    permissions: {
      dashboard: ['view'],
      reception: ['view'], booking: ['view'], 'sample-tracking': ['view'], 'sample-transfer': ['view'],
      'department-work': ['view'], 'result-entry': ['view'],
      'technical-review': ['view', 'approve'],
      'coa-management': ['view', 'approve'], 'coa-templates': ['view', 'edit'], 'printing-queue': ['view'],
      invoicing: ['view'], 'client-portal': ['view'], outsource: ['view', 'edit'],
      'mis-reports': ['view'], analytics: ['view'], 'audit-trail': ['view'],
      'lab-planner': ['view', 'edit'], 'department-planner': ['view'],
      'master-clients': ['view'], 'master-departments': ['view', 'edit'], 'master-tests': ['view', 'edit'], 'master-standards': ['view', 'edit'], 'master-products': ['view'], 'master-instruments': ['view', 'edit'], 'master-rates': ['view'],
      organogram: ['view'], settings: ['view'],
    },
    kras: DEPT_HEAD_KRAS,
    kpiBenchmarks: DEPT_HEAD_KPIS,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'quality_manager',
    label: 'Quality Manager',
    description: 'Manages quality assurance, reviews results, and approves CoAs',
    permissions: {
      dashboard: ['view'],
      'sample-tracking': ['view'],
      'department-work': ['view'], 'result-entry': ['view'],
      'technical-review': ['view', 'approve'],
      'coa-management': ['view', 'edit', 'approve'], 'coa-templates': ['view', 'edit'], 'printing-queue': ['view', 'edit'],
      'mis-reports': ['view'], analytics: ['view'], 'audit-trail': ['view'],
      'master-tests': ['view'], 'master-standards': ['view', 'edit'], 'master-instruments': ['view'],
    },
    kras: QM_KRAS,
    kpiBenchmarks: QM_KPIS,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'department_head',
    label: 'Department Head',
    description: 'Manages department operations, assigns work, and reviews results',
    permissions: {
      dashboard: ['view'],
      'sample-tracking': ['view'],
      'department-work': ['view', 'edit'], 'result-entry': ['view', 'approve'],
      'technical-review': ['view', 'approve'],
      'mis-reports': ['view'], analytics: ['view'],
      'department-planner': ['view', 'edit'],
      'master-tests': ['view', 'edit'], 'master-instruments': ['view', 'edit'],
      'stock-management': ['view', 'edit'], 'purchase-orders': ['view', 'edit'], budget: ['view'],
    },
    kras: DEPT_HEAD_KRAS,
    kpiBenchmarks: DEPT_HEAD_KPIS,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'analyst',
    label: 'Analyst',
    description: 'Performs testing and enters results for assigned samples',
    permissions: {
      dashboard: ['view'],
      'sample-tracking': ['view'],
      'department-work': ['view'], 'result-entry': ['view', 'edit'],
      'master-tests': ['view'], 'master-instruments': ['view'],
      'stock-management': ['view'],
    },
    kras: ANALYST_KRAS,
    kpiBenchmarks: ANALYST_KPIS,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'reviewer',
    label: 'Reviewer',
    description: 'Reviews test results and provides technical verification',
    permissions: {
      dashboard: ['view'],
      'sample-tracking': ['view'],
      'department-work': ['view'], 'result-entry': ['view'],
      'technical-review': ['view', 'edit', 'approve'],
      'mis-reports': ['view'],
    },
    kras: REVIEWER_KRAS,
    kpiBenchmarks: REVIEWER_KPIS,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'receptionist',
    label: 'Receptionist',
    description: 'Receives samples, registers them, and manages initial booking',
    permissions: {
      dashboard: ['view'],
      reception: ['view', 'edit'], booking: ['view', 'edit'], 'sample-tracking': ['view'], 'sample-transfer': ['view', 'edit'],
      'client-portal': ['view'],
      'master-clients': ['view'],
    },
    kras: RECEPTIONIST_KRAS,
    kpiBenchmarks: RECEPTIONIST_KPIS,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'accounts',
    label: 'Accounts',
    description: 'Manages invoicing, payments, and financial reporting',
    permissions: {
      dashboard: ['view'],
      invoicing: ['view', 'edit'], 'client-portal': ['view'],
      'mis-reports': ['view'],
      'master-clients': ['view'], 'master-rates': ['view', 'edit'],
      budget: ['view', 'edit'],
    },
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'marketing',
    label: 'Marketing',
    description: 'Manages client relationships, rates, and business reports',
    permissions: {
      dashboard: ['view'],
      'client-portal': ['view', 'edit'], outsource: ['view'],
      'mis-reports': ['view'], analytics: ['view'],
      'master-clients': ['view', 'edit'], 'master-rates': ['view', 'edit'],
    },
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'client',
    label: 'Client',
    description: 'External client with limited access to track samples and view CoAs',
    permissions: {
      dashboard: ['view'],
      'sample-tracking': ['view'],
      'coa-management': ['view'],
      'client-portal': ['view'],
    },
    createdAt: now,
    updatedAt: now,
  },
];
