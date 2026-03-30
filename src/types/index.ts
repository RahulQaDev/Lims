// ─── Enums (as string union types for erasableSyntaxOnly) ─

export type UserRole =
  | 'ADMIN'
  | 'LAB_DIRECTOR'
  | 'QUALITY_MANAGER'
  | 'DEPARTMENT_HEAD'
  | 'ANALYST'
  | 'REVIEWER'
  | 'RECEPTIONIST'
  | 'ACCOUNTS'
  | 'MARKETING'
  | 'CLIENT';

export type SampleStatus =
  | 'RECEIVED'
  | 'REGISTERED'
  | 'BOOKED'
  | 'IN_TESTING'
  | 'PENDING_REVIEW'
  | 'REVIEWED'
  | 'APPROVED'
  | 'COA_GENERATED'
  | 'COA_PRINTED'
  | 'DISPATCHED'
  | 'INVOICED'
  | 'REJECTED'
  | 'ON_HOLD';

export type BookingStatus =
  | 'DRAFT'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type ResultStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'VERIFIED'
  | 'REJECTED';

export type ReviewStatus =
  | 'PENDING'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'RETURNED';

export type Priority = 'NORMAL' | 'URGENT' | 'CRITICAL';

export type TestingType = 'IN_HOUSE' | 'OUTSOURCED' | 'BOTH';

export type NotificationType =
  | 'INFO'
  | 'WARNING'
  | 'ERROR'
  | 'SUCCESS'
  | 'TASK'
  | 'REMINDER'
  | 'ESCALATION';

export type NotificationCategory =
  | 'sample'
  | 'booking'
  | 'result'
  | 'review'
  | 'coa'
  | 'invoice'
  | 'inventory'
  | 'system';

export type InvoiceStatus =
  | 'DRAFT'
  | 'SENT'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED'
  | 'PARTIALLY_PAID';

// ─── Core Entities ───────────────────────────────────────

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  departmentId: string;
  departmentName: string;
  isActive: boolean;
  phone?: string;
  avatar?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  headId?: string;
  headName?: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  code: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin?: string;
  pan?: string;
  creditLimit: number;
  outstandingAmount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Sample {
  id: string;
  sampleCode: string;
  name: string;
  description?: string;
  clientId: string;
  clientName: string;
  productTypeId?: string;
  productTypeName?: string;
  batchNumber?: string;
  batchSize?: string;
  manufacturingDate?: string;
  expiryDate?: string;
  receivedDate: string;
  receivedBy: string;
  condition: string;
  quantity: string;
  storageCondition?: string;
  status: SampleStatus;
  priority: Priority;
  dueDate: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  bookingCode: string;
  sampleId: string;
  sampleCode: string;
  clientId: string;
  clientName: string;
  status: BookingStatus;
  priority: Priority;
  testingType: TestingType;
  tests: BookingTest[];
  totalAmount: number;
  discount: number;
  netAmount: number;
  dueDate: string;
  remarks?: string;
  bookedBy: string;
  bookedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingTest {
  id: string;
  bookingId: string;
  testId: string;
  testName: string;
  departmentId: string;
  departmentName: string;
  rate: number;
  testingType: TestingType;
  assignedTo?: string;
  status: ResultStatus;
}

export interface Result {
  id: string;
  bookingTestId: string;
  testName: string;
  sampleCode: string;
  departmentId: string;
  departmentName: string;
  analystId: string;
  analystName: string;
  status: ResultStatus;
  parameters: ResultParameter[];
  startedAt?: string;
  completedAt?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResultParameter {
  id: string;
  resultId: string;
  parameterId: string;
  parameterName: string;
  unit: string;
  specification?: string;
  result?: string;
  isCompliant?: boolean;
  method?: string;
  remarks?: string;
}

export interface Review {
  id: string;
  resultId: string;
  reviewerId: string;
  reviewerName: string;
  status: ReviewStatus;
  comments?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CoaTemplate {
  id: string;
  name: string;
  code: string;
  departmentId?: string;
  headerHtml?: string;
  footerHtml?: string;
  bodyTemplate: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Coa {
  id: string;
  coaNumber: string;
  sampleId: string;
  sampleCode: string;
  clientId: string;
  clientName: string;
  templateId: string;
  generatedBy: string;
  generatedAt: string;
  printCount: number;
  lastPrintedAt?: string;
  status: string;
  pdfUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  bookingIds: string[];
  subtotal: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  status: InvoiceStatus;
  dueDate: string;
  issuedDate: string;
  paidDate?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  link?: string;
  category: NotificationCategory;
  createdAt: string;
}

export interface NotificationPreferences {
  sample: { inApp: boolean; email: boolean };
  booking: { inApp: boolean; email: boolean };
  result: { inApp: boolean; email: boolean };
  review: { inApp: boolean; email: boolean };
  coa: { inApp: boolean; email: boolean };
  invoice: { inApp: boolean; email: boolean };
  inventory: { inApp: boolean; email: boolean };
  system: { inApp: boolean; email: boolean };
}

export interface NotificationStats {
  totalUnread: number;
  totalCount: number;
  byCategory: Record<NotificationCategory, number>;
}

// ─── Master Entities ─────────────────────────────────────

export interface TestMaster {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  departmentName: string;
  parameters: TestParameter[];
  standardId?: string;
  standardName?: string;
  tat: number; // turnaround time in hours
  rate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TestParameter {
  id: string;
  testId: string;
  name: string;
  unit: string;
  method?: string;
  specification?: string;
  minValue?: number;
  maxValue?: number;
  isRequired: boolean;
  sortOrder: number;
}

export interface Standard {
  id: string;
  name: string;
  code: string;
  organization: string;
  version?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductType {
  id: string;
  name: string;
  code: string;
  category: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Instrument {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  departmentName: string;
  model?: string;
  manufacturer?: string;
  serialNumber?: string;
  calibrationDueDate?: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RateMaster {
  id: string;
  clientId: string;
  clientName: string;
  testId: string;
  testName: string;
  rate: number;
  effectiveFrom: string;
  effectiveTo?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Specification {
  id: string;
  name: string;
  productTypeId: string;
  productTypeName: string;
  standardId?: string;
  standardName?: string;
  parameters: TestParameter[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Inventory & Procurement ─────────────────────────────

export interface Vendor {
  id: string;
  name: string;
  code: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  gstin?: string;
  rating?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: string;
  orderedBy: string;
  orderedAt: string;
  expectedDelivery?: string;
  receivedAt?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  poId: string;
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  code: string;
  category: string;
  departmentId?: string;
  departmentName?: string;
  currentStock: number;
  minimumStock: number;
  unit: string;
  location?: string;
  expiryDate?: string;
  lastRestockedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  departmentId: string;
  departmentName: string;
  financialYear: string;
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  category: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── HR & Admin ──────────────────────────────────────────

export interface Employee {
  id: string;
  userId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  departmentId: string;
  departmentName: string;
  designation: string;
  dateOfJoining: string;
  qualifications?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  timestamp: string;
}

// ─── RBAC Types ─────────────────────────────────────────

export type PermissionType = 'view' | 'edit' | 'approve';

export interface SubModuleDefinition {
  key: string;
  label: string;
}

export interface ModuleDefinition {
  key: string;
  label: string;
  subModules?: SubModuleDefinition[];
}

export interface KRAItem {
  id: string;
  label: string;
  target: number;       // target percentage (e.g., 98)
  weightage: number;    // weightage out of 100
}

export interface KPIBenchmark {
  id: string;
  label: string;
  unit: string;         // '%', 'hrs', 'count'
  target: number;
  greenThreshold: number;  // ≥ this = green
  yellowThreshold: number; // ≥ this = yellow, below = red
}

export interface EmployeeKRA {
  kraId: string;
  actual: number;
  remarks?: string;
}

export interface EmployeeKPI {
  kpiId: string;
  actual: number;
}

export interface EmployeeProfile {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roleId: string;
  departmentName: string;
  designation: string;
  dateOfJoining: string;
  avatar?: string;
  kras: EmployeeKRA[];
  kpis: EmployeeKPI[];
}

export interface RoleDefinition {
  id: string;
  label: string;
  description: string;
  permissions: Record<string, PermissionType[]>;
  kras?: KRAItem[];
  kpiBenchmarks?: KPIBenchmark[];
  isSystem?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── API Types ───────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
