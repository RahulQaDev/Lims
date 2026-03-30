import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  FlaskConical,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { get, put } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import type {
  Department,
  BookingTest,
  User,
  PaginatedResponse,
  ApiResponse,
} from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import StatCard from '../../components/ui/StatCard';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import SearchInput from '../../components/ui/SearchInput';
import { formatDate, getStatusBadge } from '../../utils/formatters';

// ─── Types ──────────────────────────────────────────────

interface DepartmentWorkItem {
  id: string;
  bookingTestId: string;
  bookingId: string;
  sampleId: string;
  sampleCode: string;
  clientName: string;
  testId: string;
  testName: string;
  departmentId: string;
  departmentName: string;
  assignedTo?: string;
  assignedToName?: string;
  priority: 'NORMAL' | 'URGENT' | 'CRITICAL';
  dueDate: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED' | 'REJECTED';
  createdAt: string;
}

type StatusFilter = 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
];

const PRIORITY_BADGE_VARIANT: Record<string, 'blue' | 'orange' | 'red'> = {
  NORMAL: 'blue',
  URGENT: 'orange',
  CRITICAL: 'red',
};

const STATUS_BADGE_VARIANT: Record<string, 'yellow' | 'blue' | 'green' | 'emerald' | 'red' | 'gray'> = {
  PENDING: 'yellow',
  IN_PROGRESS: 'blue',
  COMPLETED: 'green',
  VERIFIED: 'emerald',
  REJECTED: 'red',
};

// ─── Helpers ────────────────────────────────────────────

function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date(new Date().toDateString());
}

function isDueToday(dueDate: string): boolean {
  const today = new Date().toDateString();
  return new Date(dueDate).toDateString() === today;
}

function getRowClassName(dueDate: string, status: string): string {
  if (status === 'COMPLETED' || status === 'VERIFIED') return '';
  if (isOverdue(dueDate)) return 'bg-red-50 hover:bg-red-100';
  if (isDueToday(dueDate)) return 'bg-yellow-50 hover:bg-yellow-100';
  return '';
}

// ─── Component ──────────────────────────────────────────

export default function DepartmentWorkPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedDeptId, setSelectedDeptId] = useState<string>(user?.departmentId ?? '');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedWorkItem, setSelectedWorkItem] = useState<DepartmentWorkItem | null>(null);
  const [selectedAnalystId, setSelectedAnalystId] = useState('');

  // Fetch departments
  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => get<PaginatedResponse<Department>>('/departments', { params: { limit: 500, status: 'active' } }),
  });

  const departments = departmentsData?.data ?? [];
  const departmentOptions = departments.map((d) => ({ value: d.id, label: `${d.code} - ${d.name}` }));

  // Fetch pending work for selected department
  const {
    data: workData,
    isLoading: workLoading,
    isError: workError,
  } = useQuery({
    queryKey: ['department-work', selectedDeptId],
    queryFn: () => get<ApiResponse<DepartmentWorkItem[]>>(`/results/department/${selectedDeptId}`),
    enabled: !!selectedDeptId,
  });

  const workItems = workData?.data ?? [];

  // Fetch department members for assignment
  const { data: membersData } = useQuery({
    queryKey: ['department-members', selectedDeptId],
    queryFn: () =>
      get<PaginatedResponse<User>>('/users', {
        params: { departmentId: selectedDeptId, limit: 500, status: 'active' },
      }),
    enabled: !!selectedDeptId,
  });

  const members = membersData?.data ?? [];
  const analystOptions = members
    .filter((m) => m.role === 'ANALYST' || m.role === 'DEPARTMENT_HEAD' || m.role === 'REVIEWER')
    .map((m) => ({ value: m.id, label: `${m.firstName} ${m.lastName}` }));

  // Assign mutation
  const assignMutation = useMutation({
    mutationFn: (payload: { bookingTestId: string; assignedTo: string }) =>
      put<ApiResponse<BookingTest>>(`/results/booking-test/${payload.bookingTestId}/assign`, {
        assignedTo: payload.assignedTo,
      }),
    onSuccess: () => {
      toast.success('Test assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['department-work', selectedDeptId] });
      closeAssignModal();
    },
    onError: () => toast.error('Failed to assign test'),
  });

  // Computed stats
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    return {
      total: workItems.length,
      pending: workItems.filter((w) => w.status === 'PENDING').length,
      inProgress: workItems.filter((w) => w.status === 'IN_PROGRESS').length,
      completedToday: workItems.filter(
        (w) => w.status === 'COMPLETED' && new Date(w.createdAt).toDateString() === today,
      ).length,
      overdue: workItems.filter(
        (w) => w.status !== 'COMPLETED' && w.status !== 'VERIFIED' && isOverdue(w.dueDate),
      ).length,
    };
  }, [workItems]);

  // Filtered data
  const filteredItems = useMemo(() => {
    let items = workItems;

    if (statusFilter !== 'ALL') {
      items = items.filter((w) => w.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (w) =>
          w.sampleCode.toLowerCase().includes(q) ||
          w.clientName.toLowerCase().includes(q) ||
          w.testName.toLowerCase().includes(q) ||
          (w.assignedToName && w.assignedToName.toLowerCase().includes(q)),
      );
    }

    return items;
  }, [workItems, statusFilter, search]);

  // Modal handlers
  const openAssignModal = (item: DepartmentWorkItem) => {
    setSelectedWorkItem(item);
    setSelectedAnalystId(item.assignedTo ?? '');
    setAssignModalOpen(true);
  };

  const closeAssignModal = () => {
    setAssignModalOpen(false);
    setSelectedWorkItem(null);
    setSelectedAnalystId('');
  };

  const handleAssign = () => {
    if (!selectedWorkItem || !selectedAnalystId) {
      toast.error('Please select an analyst');
      return;
    }
    assignMutation.mutate({
      bookingTestId: selectedWorkItem.bookingTestId || selectedWorkItem.id,
      assignedTo: selectedAnalystId,
    });
  };

  const navigateToResult = (item: DepartmentWorkItem) => {
    const bookingTestId = item.bookingTestId || item.id;
    window.location.href = `/analysis/results?bookingTestId=${bookingTestId}`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Department Work Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and monitor pending tests for your department
          </p>
        </div>
        <div className="w-full sm:w-72">
          <Select
            options={departmentOptions}
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            placeholder="Select department"
          />
        </div>
      </div>

      {/* Stats Row */}
      {selectedDeptId && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<ClipboardList className="h-5 w-5" />}
            label="Total Pending"
            value={stats.pending}
            color="yellow"
          />
          <StatCard
            icon={<Clock className="h-5 w-5" />}
            label="In Progress"
            value={stats.inProgress}
            color="blue"
          />
          <StatCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            label="Completed Today"
            value={stats.completedToday}
            color="green"
          />
          <StatCard
            icon={<AlertTriangle className="h-5 w-5" />}
            label="Overdue"
            value={stats.overdue}
            color="red"
          />
        </div>
      )}

      {/* Work Queue */}
      {!selectedDeptId ? (
        <Card>
          <EmptyState
            icon={<FlaskConical className="h-8 w-8 text-gray-400" />}
            title="Select a Department"
            description="Choose a department from the dropdown above to view the work queue."
          />
        </Card>
      ) : workLoading ? (
        <Loader text="Loading work queue..." />
      ) : workError ? (
        <Card>
          <EmptyState
            icon={<AlertTriangle className="h-8 w-8 text-red-400" />}
            title="Failed to Load Work Queue"
            description="An error occurred while fetching data. Please try again."
            action={
              <Button
                variant="outline"
                onClick={() =>
                  queryClient.invalidateQueries({ queryKey: ['department-work', selectedDeptId] })
                }
              >
                Retry
              </Button>
            }
          />
        </Card>
      ) : (
        <Card noPadding>
          {/* Filters Bar */}
          <div className="px-4 py-3 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setStatusFilter(f.value)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                      statusFilter === f.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="sm:ml-auto w-full sm:w-64">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search by sample, client, test..."
              />
            </div>
          </div>

          {/* Table */}
          {filteredItems.length === 0 ? (
            <EmptyState
              title="No Tests Found"
              description={
                statusFilter !== 'ALL'
                  ? `No tests with status "${getStatusBadge(statusFilter)}" found.`
                  : 'No pending tests for this department.'
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Sample Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Test Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className={`transition-colors cursor-pointer ${getRowClassName(item.dueDate, item.status) || 'hover:bg-gray-50'}`}
                      onClick={() => navigateToResult(item)}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-blue-600 whitespace-nowrap">
                        {item.sampleCode}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {item.clientName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {item.testName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {item.assignedToName ? (
                          item.assignedToName
                        ) : (
                          <span className="text-gray-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={PRIORITY_BADGE_VARIANT[item.priority] ?? 'gray'}>
                          {item.priority}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <span
                          className={
                            isOverdue(item.dueDate) && item.status !== 'COMPLETED' && item.status !== 'VERIFIED'
                              ? 'text-red-600 font-medium'
                              : isDueToday(item.dueDate)
                                ? 'text-yellow-600 font-medium'
                                : 'text-gray-700'
                          }
                        >
                          {formatDate(item.dueDate)}
                          {isOverdue(item.dueDate) && item.status !== 'COMPLETED' && item.status !== 'VERIFIED' && (
                            <span className="ml-1 text-xs text-red-500">(Overdue)</span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={STATUS_BADGE_VARIANT[item.status] ?? 'gray'}>
                          {getStatusBadge(item.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            icon={<UserPlus className="h-3.5 w-3.5" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              openAssignModal(item);
                            }}
                          >
                            Assign
                          </Button>
                          <Button
                            size="sm"
                            icon={<FlaskConical className="h-3.5 w-3.5" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateToResult(item);
                            }}
                          >
                            Enter Results
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Assign Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={closeAssignModal}
        title="Assign Test to Analyst"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={closeAssignModal}>
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              loading={assignMutation.isPending}
              icon={<UserPlus className="h-4 w-4" />}
            >
              Assign
            </Button>
          </>
        }
      >
        {selectedWorkItem && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Sample</span>
                <span className="font-medium text-gray-900">{selectedWorkItem.sampleCode}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Test</span>
                <span className="font-medium text-gray-900">{selectedWorkItem.testName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Client</span>
                <span className="font-medium text-gray-900">{selectedWorkItem.clientName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Priority</span>
                <Badge variant={PRIORITY_BADGE_VARIANT[selectedWorkItem.priority] ?? 'gray'}>
                  {selectedWorkItem.priority}
                </Badge>
              </div>
            </div>

            <Select
              label="Select Analyst"
              options={analystOptions}
              value={selectedAnalystId}
              onChange={(e) => setSelectedAnalystId(e.target.value)}
              placeholder="Choose an analyst..."
            />

            {analystOptions.length === 0 && (
              <p className="text-xs text-yellow-600">
                No analysts found for this department. Please ensure users are assigned to this department.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
