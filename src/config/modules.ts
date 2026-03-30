import type { ModuleDefinition } from '../types';

export const DEFAULT_MODULES: ModuleDefinition[] = [
  { key: 'dashboard', label: 'Dashboard' },
  {
    key: 'sample-management',
    label: 'Sample Management',
    subModules: [
      { key: 'reception', label: 'Reception' },
      { key: 'booking', label: 'Booking' },
      { key: 'sample-tracking', label: 'Sample Tracking' },
      { key: 'sample-transfer', label: 'Sample Transfer' },
    ],
  },
  {
    key: 'analysis',
    label: 'Analysis',
    subModules: [
      { key: 'department-work', label: 'Department Work' },
      { key: 'result-entry', label: 'Result Entry' },
    ],
  },
  {
    key: 'review',
    label: 'Review',
    subModules: [
      { key: 'technical-review', label: 'Review & Approve' },
    ],
  },
  {
    key: 'output',
    label: 'Output',
    subModules: [
      { key: 'coa-management', label: 'CoA Management' },
      { key: 'coa-templates', label: 'CoA Templates' },
      { key: 'printing-queue', label: 'Printing Queue' },
    ],
  },
  {
    key: 'business',
    label: 'Business',
    subModules: [
      { key: 'invoicing', label: 'Invoicing' },
      { key: 'client-portal', label: 'Client Portal' },
      { key: 'outsource', label: 'Outsource' },
    ],
  },
  {
    key: 'reports',
    label: 'Reports',
    subModules: [
      { key: 'mis-reports', label: 'MIS Reports' },
      { key: 'analytics', label: 'Analytics' },
      { key: 'audit-trail', label: 'Audit Trail' },
    ],
  },
  {
    key: 'planning',
    label: 'Planning',
    subModules: [
      { key: 'lab-planner', label: 'Lab Planner' },
      { key: 'department-planner', label: 'Department Planner' },
    ],
  },
  {
    key: 'masters',
    label: 'Masters',
    subModules: [
      { key: 'master-clients', label: 'Clients' },
      { key: 'master-departments', label: 'Departments' },
      { key: 'master-tests', label: 'Tests' },
      { key: 'master-standards', label: 'Standards' },
      { key: 'master-products', label: 'Products' },
      { key: 'master-instruments', label: 'Instruments' },
      { key: 'master-rates', label: 'Rate Card' },
    ],
  },
  {
    key: 'inventory',
    label: 'Inventory',
    subModules: [
      { key: 'stock-management', label: 'Stock Management' },
      { key: 'purchase-orders', label: 'Purchase Orders' },
      { key: 'vendors', label: 'Vendors' },
      { key: 'budget', label: 'Budget' },
    ],
  },
  {
    key: 'administration',
    label: 'Administration',
    subModules: [
      { key: 'user-management', label: 'Users' },
      { key: 'role-management', label: 'Roles' },
      { key: 'permission-matrix', label: 'Permission Matrix' },
      { key: 'module-management', label: 'Modules' },
      { key: 'organogram', label: 'Organogram' },
      { key: 'locations', label: 'Locations' },
      { key: 'settings', label: 'Settings' },
    ],
  },
];
