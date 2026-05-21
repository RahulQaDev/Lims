import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  PackagePlus,
  BookOpen,
  Search,
  FlaskConical,
  FileEdit,
  CheckCircle2,
  FileText,
  Layout,
  Printer,
  Receipt,
  Users,
  ExternalLink,
  BarChart3,
  TrendingUp,
  Shield,
  KeyRound,
  Grid3X3,
  Boxes,
  UserCheck,
  Calendar,
  ClipboardList,
  Building2,
  Layers,
  TestTube,
  BookCopy,
  Package,
  Cpu,
  DollarSign,
  Warehouse,
  ShoppingCart,
  Truck,
  PiggyBank,
  UserCog,
  GitBranch,
  Settings,
  Bell,
  ChevronDown,
  ChevronLeft,
  FlaskRound,
  ArrowLeftRight,
  MapPin,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  roles?: string[]; // if set, only these roles see this item
  hideRoles?: string[]; // if set, hide from these roles
}

interface NavGroup {
  label: string;
  items: NavItem[];
  roles?: string[]; // if set, only these roles see this group
  hideRoles?: string[];
}

// Booking role sidebar (per Booking Personnel role matrix):
//   Sample Management  → Test Request Form (Book Sample), Bar Coding
//   Customer Relations → Client Profile
//   Masters            → Product Master
//   Quotation & Pricing→ Quotation
//   Purchase & Indent  → Purchase Order, Indent
//   Support            → Mailer, Ticket
//   Administration     → Employee Profile, Notifications
//
// Items the Booking role should NOT see are marked with hideRoles: ['BOOKING'].

const navigation: NavGroup[] = [
  {
    label: '',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, hideRoles: ['BOOKING'] },
      { label: 'HQ Dashboard', path: '/dashboard/hq', icon: Building2, hideRoles: ['BOOKING', 'ANALYST', 'REVIEWER', 'RECEPTIONIST', 'ACCOUNTS'] },
      { label: 'My Dashboard', path: '/dashboard/booking', icon: ClipboardList, roles: ['BOOKING'] },
    ],
  },
  {
    label: 'Sample Management',
    items: [
      { label: 'Reception',           path: '/samples/reception',   icon: PackagePlus,     hideRoles: ['BOOKING'] },
      { label: 'Test Request Form',   path: '/booking',             icon: BookOpen },
      { label: 'Bar Coding',          path: '/samples/barcoding',   icon: Layout,          roles: ['BOOKING'] },
      { label: 'Sample Tracking',     path: '/samples/tracking',    icon: Search,          hideRoles: ['BOOKING'] },
      { label: 'Sample Transfer',     path: '/samples/transfers',   icon: ArrowLeftRight,  hideRoles: ['BOOKING'] },
    ],
  },
  {
    label: 'Analysis',
    hideRoles: ['BOOKING'],
    items: [
      { label: 'Department Work', path: '/analysis/department', icon: FlaskConical },
      { label: 'Result Entry', path: '/analysis/results', icon: FileEdit },
      { label: 'Review & Approve', path: '/review', icon: CheckCircle2 },
    ],
  },
  {
    label: 'Output',
    hideRoles: ['BOOKING'],
    items: [
      { label: 'CoA Management', path: '/coa', icon: FileText },
      { label: 'CoA Templates', path: '/coa/templates', icon: Layout },
      { label: 'Printing Queue', path: '/coa/printing', icon: Printer },
    ],
  },
  {
    label: 'Customer Relations',
    roles: ['BOOKING'],
    items: [
      { label: 'Client Profile', path: '/clients', icon: Users },
    ],
  },
  {
    label: 'Quotation & Pricing',
    roles: ['BOOKING'],
    items: [
      { label: 'Quotation', path: '/quotations', icon: FileText },
    ],
  },
  {
    label: 'Purchase & Indent',
    roles: ['BOOKING'],
    items: [
      { label: 'Purchase Order', path: '/inventory/purchase-orders', icon: ShoppingCart },
      { label: 'Indent',         path: '/indents',                   icon: Package },
    ],
  },
  {
    label: 'Support',
    roles: ['BOOKING'],
    items: [
      { label: 'Mailer', path: '/mailer',  icon: Bell },
      { label: 'Ticket', path: '/tickets', icon: FileText },
    ],
  },
  {
    label: 'Business',
    hideRoles: ['BOOKING'],
    items: [
      { label: 'Invoicing', path: '/invoicing', icon: Receipt },
      { label: 'Client Portal', path: '/clients', icon: Users },
      { label: 'Outsource', path: '/outsource', icon: ExternalLink },
    ],
  },
  {
    label: 'Reports',
    hideRoles: ['BOOKING'],
    items: [
      { label: 'MIS Reports', path: '/reports', icon: BarChart3 },
      { label: 'Analytics', path: '/reports/analytics', icon: TrendingUp },
      { label: 'Audit Trail', path: '/reports/audit', icon: Shield },
    ],
  },
  {
    label: 'Quality Management',
    roles: ['ADMIN', 'LAB_HEAD', 'QA'],
    items: [
      { label: 'Authority Matrix',  path: '/quality/signatories',           icon: Grid3X3 },
      { label: 'Template View',     path: '/quality/signatories/templates', icon: FileText },
      { label: 'Today\'s Coverage', path: '/quality/signatories/coverage',  icon: Shield },
      { label: 'Absence Calendar',  path: '/quality/signatories/absences',  icon: Calendar },
    ],
  },
  {
    label: 'Planning',
    hideRoles: ['BOOKING'],
    items: [
      { label: 'Lab Planner', path: '/planning/lab', icon: Calendar },
      { label: 'Department Planner', path: '/planning/department', icon: ClipboardList },
    ],
  },
  {
    label: 'Masters',
    items: [
      { label: 'Clients',     path: '/masters/clients',     icon: Building2,   hideRoles: ['BOOKING'] },
      { label: 'Departments', path: '/masters/departments', icon: Layers,      hideRoles: ['BOOKING'] },
      { label: 'Tests',       path: '/masters/tests',       icon: TestTube,    hideRoles: ['BOOKING'] },
      { label: 'Standards',   path: '/masters/standards',   icon: BookCopy,    hideRoles: ['BOOKING'] },
      { label: 'Products',    path: '/masters/products',    icon: Package },
      { label: 'Instruments', path: '/masters/instruments', icon: Cpu,         hideRoles: ['BOOKING'] },
      { label: 'Rate Card',   path: '/masters/rates',       icon: DollarSign,  hideRoles: ['BOOKING'] },
    ],
  },
  {
    label: 'Inventory',
    hideRoles: ['BOOKING'],
    items: [
      { label: 'Stock Management', path: '/inventory', icon: Warehouse },
      { label: 'Purchase Orders', path: '/inventory/purchase-orders', icon: ShoppingCart },
      { label: 'Vendors', path: '/inventory/vendors', icon: Truck },
      { label: 'Budget', path: '/inventory/budget', icon: PiggyBank },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Users',              path: '/settings/users',             icon: UserCog,    hideRoles: ['BOOKING'] },
      { label: 'Roles',              path: '/settings/roles',             icon: KeyRound,   hideRoles: ['BOOKING'] },
      { label: 'Permission Matrix',  path: '/settings/permissions',       icon: Grid3X3,    hideRoles: ['BOOKING'] },
      { label: 'Modules',            path: '/settings/modules',           icon: Boxes,      hideRoles: ['BOOKING'] },
      { label: 'Employee Profile',   path: '/settings/employee-profile',  icon: UserCheck },
      { label: 'Organogram',         path: '/settings/organogram',        icon: GitBranch,  hideRoles: ['BOOKING'] },
      { label: 'Workforce Planning', path: '/settings/workforce',         icon: Users,      hideRoles: ['BOOKING'] },
      { label: 'Locations',          path: '/settings/locations',         icon: MapPin,     hideRoles: ['BOOKING'] },
      { label: 'Settings',           path: '/settings',                   icon: Settings,   hideRoles: ['BOOKING'] },
      { label: 'Notifications',      path: '/notifications',              icon: Bell },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();
  const userRole = user?.role?.toUpperCase() || '';

  // Filter navigation based on user role
  const filteredNavigation = navigation
    .filter((group) => {
      if (group.roles && !group.roles.includes(userRole) && userRole !== 'ADMIN') return false;
      if (group.hideRoles && group.hideRoles.includes(userRole)) return false;
      return true;
    })
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.roles && !item.roles.includes(userRole) && userRole !== 'ADMIN') return false;
        if (item.hideRoles && item.hideRoles.includes(userRole)) return false;
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => {
      // Auto-expand the group that contains the current route
      const active = new Set<string>();
      for (const group of filteredNavigation) {
        if (group.items.some((item) => location.pathname.startsWith(item.path))) {
          active.add(group.label);
        }
      }
      return active;
    },
  );

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  return (
    <aside
      className={`fixed top-0 left-0 z-40 h-screen bg-slate-900 text-white transition-all duration-300 flex flex-col ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-700/50 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-[#00a6fb] flex items-center justify-center shrink-0">
          <FlaskRound className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-white tracking-wide">LabWise</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">LIMS</p>
          </div>
        )}
        <button
          onClick={onToggle}
          className={`ml-auto p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${
            collapsed ? 'rotate-180' : ''
          }`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1 scrollbar-thin">
        {filteredNavigation.map((group) => (
          <div key={group.label || 'top'}>
            {/* Group header */}
            {group.label && !collapsed && (
              <button
                onClick={() => toggleGroup(group.label)}
                className="w-full flex items-center justify-between px-2 py-1.5 mt-3 mb-0.5"
              >
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  {group.label}
                </span>
                <ChevronDown
                  className={`h-3 w-3 text-slate-500 transition-transform ${
                    expandedGroups.has(group.label) ? '' : '-rotate-90'
                  }`}
                />
              </button>
            )}

            {/* Items */}
            {(collapsed || !group.label || expandedGroups.has(group.label)) &&
              group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors group ${
                        isActive
                          ? 'bg-[#00a6fb]/20 text-[#00a6fb]'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      } ${collapsed ? 'justify-center' : ''}`
                    }
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                );
              })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
