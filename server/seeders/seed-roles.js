/**
 * Seed default roles and their permissions into the database.
 * Idempotent — safe to run multiple times.
 */

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

function allPermissions() {
  const perms = {};
  for (const key of ALL_SUB_KEYS) perms[key] = ['view', 'edit', 'approve'];
  return perms;
}

// KRA/KPI templates
const ANALYST_KRAS = [
  { id: 'testing-accuracy', label: 'Testing Accuracy', target: 98, weightage: 30 },
  { id: 'tat-compliance', label: 'Turnaround Compliance', target: 95, weightage: 25 },
  { id: 'sample-throughput', label: 'Sample Throughput', target: 100, weightage: 25 },
  { id: 'quality-score', label: 'Quality Score', target: 95, weightage: 20 },
];
const ANALYST_KPIS = [
  { id: 'samples-completed', label: 'Samples Completed / Month', unit: 'count', target: 120, greenThreshold: 100, yellowThreshold: 80 },
  { id: 'avg-tat', label: 'Average TAT', unit: 'hrs', target: 24, greenThreshold: 24, yellowThreshold: 36 },
  { id: 'on-time-pct', label: 'On-Time Delivery', unit: '%', target: 95, greenThreshold: 90, yellowThreshold: 70 },
  { id: 'rejection-rate', label: 'Rejection Rate', unit: '%', target: 2, greenThreshold: 3, yellowThreshold: 7 },
  { id: 'pending-tasks', label: 'Pending Tasks', unit: 'count', target: 0, greenThreshold: 5, yellowThreshold: 10 },
];
const REVIEWER_KRAS = [
  { id: 'review-accuracy', label: 'Review Accuracy', target: 99, weightage: 35 },
  { id: 'review-tat', label: 'Review Turnaround', target: 95, weightage: 25 },
  { id: 'rejection-identification', label: 'Rejection Identification', target: 90, weightage: 20 },
  { id: 'compliance-adherence', label: 'Compliance Adherence', target: 100, weightage: 20 },
];
const REVIEWER_KPIS = [
  { id: 'reviews-completed', label: 'Reviews Completed / Month', unit: 'count', target: 150, greenThreshold: 130, yellowThreshold: 100 },
  { id: 'avg-review-time', label: 'Avg Review Time', unit: 'hrs', target: 4, greenThreshold: 4, yellowThreshold: 8 },
  { id: 'first-pass-rate', label: 'First Pass Rate', unit: '%', target: 92, greenThreshold: 90, yellowThreshold: 75 },
  { id: 'pending-reviews', label: 'Pending Reviews', unit: 'count', target: 0, greenThreshold: 10, yellowThreshold: 20 },
];
const RECEPTIONIST_KRAS = [
  { id: 'registration-accuracy', label: 'Registration Accuracy', target: 99, weightage: 30 },
  { id: 'processing-speed', label: 'Processing Speed', target: 95, weightage: 25 },
  { id: 'client-satisfaction', label: 'Client Satisfaction', target: 90, weightage: 25 },
  { id: 'documentation', label: 'Documentation Compliance', target: 100, weightage: 20 },
];
const RECEPTIONIST_KPIS = [
  { id: 'samples-registered', label: 'Samples Registered / Day', unit: 'count', target: 30, greenThreshold: 25, yellowThreshold: 15 },
  { id: 'avg-registration-time', label: 'Avg Registration Time', unit: 'mins', target: 10, greenThreshold: 10, yellowThreshold: 20 },
  { id: 'booking-accuracy', label: 'Booking Accuracy', unit: '%', target: 99, greenThreshold: 97, yellowThreshold: 90 },
  { id: 'client-complaints', label: 'Client Complaints', unit: 'count', target: 0, greenThreshold: 2, yellowThreshold: 5 },
];
const DEPT_HEAD_KRAS = [
  { id: 'dept-tat', label: 'Department TAT Compliance', target: 95, weightage: 25 },
  { id: 'team-utilization', label: 'Team Utilization', target: 90, weightage: 20 },
  { id: 'quality-metrics', label: 'Quality Metrics', target: 98, weightage: 25 },
  { id: 'cost-efficiency', label: 'Cost Efficiency', target: 95, weightage: 15 },
  { id: 'training-compliance', label: 'Training Compliance', target: 100, weightage: 15 },
];
const DEPT_HEAD_KPIS = [
  { id: 'dept-throughput', label: 'Department Throughput / Month', unit: 'count', target: 500, greenThreshold: 450, yellowThreshold: 350 },
  { id: 'team-on-time', label: 'Team On-Time %', unit: '%', target: 95, greenThreshold: 90, yellowThreshold: 75 },
  { id: 'instrument-uptime', label: 'Instrument Uptime', unit: '%', target: 98, greenThreshold: 95, yellowThreshold: 85 },
  { id: 'dept-rejection', label: 'Department Rejection Rate', unit: '%', target: 2, greenThreshold: 3, yellowThreshold: 7 },
  { id: 'budget-variance', label: 'Budget Variance', unit: '%', target: 5, greenThreshold: 5, yellowThreshold: 15 },
];
const QM_KRAS = [
  { id: 'audit-compliance', label: 'Audit Compliance', target: 100, weightage: 30 },
  { id: 'coa-accuracy', label: 'CoA Accuracy', target: 99, weightage: 25 },
  { id: 'corrective-actions', label: 'Corrective Action Closure', target: 95, weightage: 25 },
  { id: 'process-improvement', label: 'Process Improvement', target: 90, weightage: 20 },
];
const QM_KPIS = [
  { id: 'coas-approved', label: 'CoAs Approved / Month', unit: 'count', target: 200, greenThreshold: 180, yellowThreshold: 140 },
  { id: 'audit-findings', label: 'Open Audit Findings', unit: 'count', target: 0, greenThreshold: 3, yellowThreshold: 8 },
  { id: 'capa-closure', label: 'CAPA Closure Rate', unit: '%', target: 95, greenThreshold: 90, yellowThreshold: 75 },
  { id: 'deviation-rate', label: 'Deviation Rate', unit: '%', target: 1, greenThreshold: 2, yellowThreshold: 5 },
];

const DEFAULT_ROLES = [
  {
    id: 'admin',
    label: 'Administrator',
    description: 'Full system access — manages all modules, users, and configurations',
    permissions: allPermissions(),
    kras: DEPT_HEAD_KRAS,
    kpiBenchmarks: DEPT_HEAD_KPIS,
    isSystem: true,
  },
  {
    id: 'lab_head',
    label: 'Lab Head',
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
    isSystem: true,
  },
  {
    id: 'qa',
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
    isSystem: true,
  },
  {
    id: 'dept_head',
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
    isSystem: true,
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
    isSystem: true,
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
    isSystem: true,
  },
  {
    id: 'reception',
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
    isSystem: true,
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
    isSystem: true,
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
    isSystem: true,
  },
  {
    id: 'booking',
    label: 'Booking',
    description: 'Creates and manages sample bookings',
    permissions: {
      dashboard: ['view'],
      reception: ['view'], booking: ['view', 'edit'], 'sample-tracking': ['view'],
      'client-portal': ['view'],
      'master-clients': ['view'],
    },
    kras: RECEPTIONIST_KRAS,
    kpiBenchmarks: RECEPTIONIST_KPIS,
    isSystem: true,
  },
  {
    id: 'approver',
    label: 'Approver',
    description: 'Approves results and generates CoAs',
    permissions: {
      dashboard: ['view'],
      'sample-tracking': ['view'],
      'result-entry': ['view'],
      'technical-review': ['view', 'approve'],
      'coa-management': ['view', 'edit', 'approve'],
      'mis-reports': ['view'],
    },
    kras: REVIEWER_KRAS,
    kpiBenchmarks: REVIEWER_KPIS,
    isSystem: true,
  },
  {
    id: 'customer_coordinator',
    label: 'Customer Coordinator',
    description: 'Handles client communication and sample coordination',
    permissions: {
      dashboard: ['view'],
      'sample-tracking': ['view'],
      'client-portal': ['view', 'edit'],
      'coa-management': ['view'],
      'master-clients': ['view'],
    },
    isSystem: true,
  },
  {
    id: 'purchase',
    label: 'Purchase',
    description: 'Manages inventory procurement and purchase orders',
    permissions: {
      dashboard: ['view'],
      'stock-management': ['view', 'edit'], 'purchase-orders': ['view', 'edit'], vendors: ['view', 'edit'], budget: ['view'],
    },
    isSystem: true,
  },
  {
    id: 'hr',
    label: 'HR',
    description: 'Manages employee records and workforce planning',
    permissions: {
      dashboard: ['view'],
      'user-management': ['view', 'edit'],
      organogram: ['view'],
    },
    isSystem: true,
  },
  {
    id: 'printing',
    label: 'Printing',
    description: 'Manages CoA printing queue',
    permissions: {
      dashboard: ['view'],
      'coa-management': ['view'],
      'printing-queue': ['view', 'edit'],
    },
    isSystem: true,
  },
  {
    id: 'technical',
    label: 'Technical',
    description: 'Technical support and instrument management',
    permissions: {
      dashboard: ['view'],
      'master-instruments': ['view', 'edit'],
      'stock-management': ['view'],
    },
    isSystem: true,
  },
  {
    id: 'area_manager',
    label: 'Area Manager',
    description: 'Manages operations across assigned area',
    permissions: {
      dashboard: ['view'],
      'sample-tracking': ['view'],
      'mis-reports': ['view'], analytics: ['view'],
      'client-portal': ['view'],
      'master-clients': ['view'],
    },
    isSystem: true,
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
    isSystem: true,
  },
  {
    id: 'master_personnel',
    label: 'Master Personnel',
    description: 'Maintains all master data — analytes, STPs, generic masters, product masters, and methods',
    permissions: {
      dashboard: ['view'],
      'master-tests': ['view', 'edit'],
      'master-standards': ['view', 'edit'],
      'master-products': ['view', 'edit'],
      'master-rates': ['view'],
      'master-instruments': ['view'],
    },
    isSystem: true,
  },
  {
    id: 'master_controller',
    label: 'Master Controller',
    description: 'Reviews and approves master data — analytes, STPs, generic masters created by Master Personnel',
    permissions: {
      dashboard: ['view'],
      'master-tests': ['view', 'edit', 'approve'],
      'master-standards': ['view', 'edit', 'approve'],
      'master-products': ['view', 'edit', 'approve'],
      'master-rates': ['view'],
      'master-instruments': ['view'],
    },
    isSystem: true,
  },
];

async function seedRoles(db) {
  console.log('--- Seeding roles ---');

  for (const roleDef of DEFAULT_ROLES) {
    const [role] = await db.Role.findOrCreate({
      where: { id: roleDef.id },
      defaults: {
        label: roleDef.label,
        description: roleDef.description,
        isSystem: roleDef.isSystem || false,
        isActive: true,
        kras: roleDef.kras || [],
        kpiBenchmarks: roleDef.kpiBenchmarks || [],
      },
    });

    // Seed permissions — delete existing and re-insert for idempotency
    await db.RolePermission.destroy({ where: { roleId: roleDef.id } });

    const permRows = [];
    for (const [moduleKey, types] of Object.entries(roleDef.permissions)) {
      for (const permissionType of types) {
        permRows.push({ roleId: roleDef.id, moduleKey, permissionType });
      }
    }

    if (permRows.length > 0) {
      await db.RolePermission.bulkCreate(permRows);
    }

    console.log(`  Role "${roleDef.id}" — ${permRows.length} permissions`);
  }

  console.log(`  Seeded ${DEFAULT_ROLES.length} roles.`);
}

module.exports = { seedRoles, DEFAULT_ROLES };
