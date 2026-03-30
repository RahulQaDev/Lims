import type { ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ClientsPage from './pages/masters/ClientsPage';
import DepartmentsPage from './pages/masters/DepartmentsPage';
import TestMastersPage from './pages/masters/TestMastersPage';
import StandardsPage from './pages/masters/StandardsPage';
import ProductTypesPage from './pages/masters/ProductTypesPage';
import ReceptionPage from './pages/samples/ReceptionPage';
import TrackingPage from './pages/samples/TrackingPage';
import ReviewPage from './pages/review/ReviewPage';
import ApprovalPage from './pages/review/ApprovalPage';
import UsersPage from './pages/settings/UsersPage';
import RolesPage from './pages/settings/RolesPage';
import RoleFormPage from './pages/settings/RoleFormPage';
import PermissionMatrixPage from './pages/settings/PermissionMatrixPage';
import ModulesPage from './pages/settings/ModulesPage';
import EmployeeProfilePage from './pages/settings/EmployeeProfilePage';
import CoaManagementPage from './pages/coa/CoaManagementPage';
import CoaTemplatesPage from './pages/coa/CoaTemplatesPage';
import PrintingQueuePage from './pages/coa/PrintingQueuePage';
import InvoicePage from './pages/invoicing/InvoicePage';
import ClientPortalPage from './pages/clients/ClientPortalPage';
import OutsourcePage from './pages/outsource/OutsourcePage';
import BookingPage from './pages/booking/BookingPage';
import BookingDetailPage from './pages/booking/BookingDetailPage';
import DepartmentWorkPage from './pages/analysis/DepartmentWorkPage';
import ResultEntryPage from './pages/analysis/ResultEntryPage';
import ReportsPage from './pages/reports/ReportsPage';
import AnalyticsPage from './pages/reports/AnalyticsPage';
import AuditTrailPage from './pages/reports/AuditTrailPage';
import InventoryPage from './pages/inventory/InventoryPage';
import PurchaseOrdersPage from './pages/inventory/PurchaseOrdersPage';
import VendorsPage from './pages/inventory/VendorsPage';
import BudgetPage from './pages/inventory/BudgetPage';
import NotificationsPage from './pages/settings/NotificationsPage';
import InstrumentsPage from './pages/masters/InstrumentsPage';
import RateCardPage from './pages/masters/RateCardPage';
import OrganogramPage from './pages/settings/OrganogramPage';
import WorkforcePlanningPage from './pages/settings/WorkforcePlanningPage';
import SettingsPage from './pages/settings/SettingsPage';
import ProfilePage from './pages/settings/ProfilePage';
import LabPlannerPage from './pages/planning/LabPlannerPage';
import DepartmentPlannerPage from './pages/planning/DepartmentPlannerPage';
import HQDashboardPage from './pages/dashboard/HQDashboardPage';
import BookingDashboardPage from './pages/dashboard/BookingDashboardPage';
import SampleTransferPage from './pages/samples/SampleTransferPage';
import LocationsPage from './pages/settings/LocationsPage';
import Loader from './components/ui/Loader';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <Loader fullScreen text="Loading..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    const role = user?.role?.toUpperCase();
    if (role === 'BOOKING') return <Navigate to="/dashboard/booking" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route
        element={
          <PublicRoute>
            <AuthLayout />
          </PublicRoute>
        }
      >
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Protected app routes */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard/hq" element={<HQDashboardPage />} />
        <Route path="/dashboard/booking" element={<BookingDashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Sample Management */}
        <Route path="/samples/reception" element={<ReceptionPage />} />
        <Route path="/samples/tracking" element={<TrackingPage />} />
        <Route path="/samples/transfers" element={<SampleTransferPage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/booking/:id" element={<BookingDetailPage />} />

        {/* Analysis */}
        <Route path="/analysis/department" element={<DepartmentWorkPage />} />
        <Route path="/analysis/results" element={<ResultEntryPage />} />
        <Route path="/review/approval" element={<ApprovalPage />} />
        <Route path="/review" element={<ReviewPage />} />

        {/* Output */}
        <Route path="/coa/templates" element={<CoaTemplatesPage />} />
        <Route path="/coa/printing" element={<PrintingQueuePage />} />
        <Route path="/coa" element={<CoaManagementPage />} />

        {/* Business */}
        <Route path="/invoicing" element={<InvoicePage />} />
        <Route path="/clients" element={<ClientPortalPage />} />
        <Route path="/outsource" element={<OutsourcePage />} />

        {/* Reports */}
        <Route path="/reports/analytics" element={<AnalyticsPage />} />
        <Route path="/reports/audit" element={<AuditTrailPage />} />
        <Route path="/reports" element={<ReportsPage />} />

        {/* Planning */}
        <Route path="/planning/lab" element={<LabPlannerPage />} />
        <Route path="/planning/department" element={<DepartmentPlannerPage />} />

        {/* Masters */}
        <Route path="/masters/clients" element={<ClientsPage />} />
        <Route path="/masters/departments" element={<DepartmentsPage />} />
        <Route path="/masters/tests" element={<TestMastersPage />} />
        <Route path="/masters/standards" element={<StandardsPage />} />
        <Route path="/masters/products" element={<ProductTypesPage />} />
        <Route path="/masters/instruments" element={<InstrumentsPage />} />
        <Route path="/masters/rates" element={<RateCardPage />} />

        {/* Inventory */}
        <Route path="/inventory/purchase-orders" element={<PurchaseOrdersPage />} />
        <Route path="/inventory/vendors" element={<VendorsPage />} />
        <Route path="/inventory/budget" element={<BudgetPage />} />
        <Route path="/inventory" element={<InventoryPage />} />

        {/* Administration */}
        <Route path="/settings/users" element={<UsersPage />} />
        <Route path="/settings/roles" element={<RolesPage />} />
        <Route path="/settings/roles/create" element={<RoleFormPage />} />
        <Route path="/settings/roles/edit/:id" element={<RoleFormPage />} />
        <Route path="/settings/permissions" element={<PermissionMatrixPage />} />
        <Route path="/settings/modules" element={<ModulesPage />} />
        <Route path="/settings/employee-profile" element={<EmployeeProfilePage />} />
        <Route path="/settings/employee-profile/:id" element={<EmployeeProfilePage />} />
        <Route path="/settings/organogram" element={<OrganogramPage />} />
        <Route path="/settings/workforce" element={<WorkforcePlanningPage />} />
        <Route path="/settings/locations" element={<LocationsPage />} />
        <Route path="/settings/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
