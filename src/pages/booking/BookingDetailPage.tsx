import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  XCircle,
  Plus,
  Printer,
  Package,
  User,
  Beaker,
  Calendar,
  IndianRupee,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { get, post, put, del } from '../../services/api';
import type {
  Booking,
  BookingTest,
  Standard,
  TestMaster,
  BookingStatus,
  Priority,
  ResultStatus,
  ApiResponse,
  PaginatedResponse,
} from '../../types';
import {
  formatDate,
  formatCurrency,
  getStatusColor,
  getStatusBadge,
} from '../../utils/formatters';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Loader from '../../components/ui/Loader';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Select from '../../components/ui/Select';

// ─── Helpers ────────────────────────────────────────────

function getPriorityBadgeVariant(priority: Priority): 'blue' | 'orange' | 'red' {
  const map: Record<Priority, 'blue' | 'orange' | 'red'> = {
    NORMAL: 'blue',
    URGENT: 'orange',
    CRITICAL: 'red',
  };
  return map[priority];
}

function getBookingStatusVariant(
  status: BookingStatus,
): 'gray' | 'purple' | 'blue' | 'green' {
  const map: Record<BookingStatus, 'gray' | 'purple' | 'blue' | 'green'> = {
    DRAFT: 'gray',
    CONFIRMED: 'purple',
    IN_PROGRESS: 'blue',
    COMPLETED: 'green',
    CANCELLED: 'gray',
  };
  return map[status];
}

function getTestStatusIcon(status: ResultStatus) {
  switch (status) {
    case 'PENDING':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'IN_PROGRESS':
      return <Beaker className="h-4 w-4 text-blue-500" />;
    case 'COMPLETED':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'VERIFIED':
      return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    case 'REJECTED':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <AlertCircle className="h-4 w-4 text-gray-400" />;
  }
}

// ─── Main Component ─────────────────────────────────────

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [addTestsModalOpen, setAddTestsModalOpen] = useState(false);
  const [addTestStandardId, setAddTestStandardId] = useState('');
  const [addTestSelectedIds, setAddTestSelectedIds] = useState<string[]>([]);

  // ─── Queries ────────────────────────────────────────────

  const bookingQuery = useQuery({
    queryKey: ['booking-detail', id],
    queryFn: () => get<ApiResponse<Booking>>(`/bookings/${id}`),
    enabled: !!id,
  });

  const booking = bookingQuery.data?.data ?? null;

  const standardsQuery = useQuery({
    queryKey: ['standards'],
    queryFn: () =>
      get<PaginatedResponse<Standard>>('/standards', {
        params: { limit: 500 },
      }),
    enabled: addTestsModalOpen,
  });

  const standards = standardsQuery.data?.data ?? [];

  const addTestMastersQuery = useQuery({
    queryKey: ['test-masters-add', addTestStandardId],
    queryFn: () =>
      get<PaginatedResponse<TestMaster>>('/test-masters', {
        params: { standardId: addTestStandardId, limit: 500 },
      }),
    enabled: addTestsModalOpen && !!addTestStandardId,
  });

  const addTestMasters = addTestMastersQuery.data?.data ?? [];

  // Filter out tests already in the booking
  const availableTestMasters = useMemo(() => {
    if (!booking) return addTestMasters;
    const existingTestIds = new Set(booking.tests.map((t) => t.testId));
    return addTestMasters.filter((t) => !existingTestIds.has(t.id));
  }, [addTestMasters, booking]);

  // ─── Mutations ──────────────────────────────────────────

  const cancelBookingMutation = useMutation({
    mutationFn: () => put<ApiResponse<Booking>>(`/bookings/${id}/cancel`),
    onSuccess: () => {
      toast.success('Booking cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['booking-detail', id] });
      setCancelDialogOpen(false);
    },
    onError: () => {
      toast.error('Failed to cancel booking');
    },
  });

  const addTestsMutation = useMutation({
    mutationFn: (tests: string[]) =>
      post<ApiResponse<Booking>>(`/bookings/${id}/tests`, { tests }),
    onSuccess: () => {
      toast.success('Tests added successfully');
      queryClient.invalidateQueries({ queryKey: ['booking-detail', id] });
      setAddTestsModalOpen(false);
      setAddTestStandardId('');
      setAddTestSelectedIds([]);
    },
    onError: () => {
      toast.error('Failed to add tests');
    },
  });

  const removeTestMutation = useMutation({
    mutationFn: (testId: string) =>
      del<ApiResponse<null>>(`/bookings/${id}/tests/${testId}`),
    onSuccess: () => {
      toast.success('Test removed');
      queryClient.invalidateQueries({ queryKey: ['booking-detail', id] });
    },
    onError: () => {
      toast.error('Failed to remove test');
    },
  });

  // ─── Computed ───────────────────────────────────────────

  const testStatusSummary = useMemo(() => {
    if (!booking) return { pending: 0, inProgress: 0, completed: 0, total: 0 };
    const tests = booking.tests ?? [];
    return {
      pending: tests.filter((t) => t.status === 'PENDING').length,
      inProgress: tests.filter((t) => t.status === 'IN_PROGRESS').length,
      completed: tests.filter(
        (t) => t.status === 'COMPLETED' || t.status === 'VERIFIED',
      ).length,
      total: tests.length,
    };
  }, [booking]);

  const isEditable =
    booking?.status !== 'CANCELLED' && booking?.status !== 'COMPLETED';

  // ─── Loading / Error states ─────────────────────────────

  if (bookingQuery.isLoading) {
    return <Loader text="Loading booking details..." />;
  }

  if (bookingQuery.isError || !booking) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/booking')}
          icon={<ArrowLeft className="h-4 w-4" />}
        >
          Back to Bookings
        </Button>
        <div className="text-center py-16">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Booking Not Found
          </h2>
          <p className="text-sm text-gray-500">
            The booking you are looking for does not exist or could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/booking')}
          icon={<ArrowLeft className="h-4 w-4" />}
        >
          Back
        </Button>
        <ChevronRight className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-500">Bookings</span>
        <ChevronRight className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-900">
          {booking.bookingCode}
        </span>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {booking.bookingCode}
            </h1>
            <Badge variant={getBookingStatusVariant(booking.status)}>
              {getStatusBadge(booking.status)}
            </Badge>
            <Badge variant={getPriorityBadgeVariant(booking.priority)}>
              {getStatusBadge(booking.priority)}
            </Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Created on {formatDate(booking.bookedAt || booking.createdAt)}
            {booking.bookedBy ? ` by ${booking.bookedBy}` : ''}
          </p>
        </div>
        {isEditable && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddTestsModalOpen(true)}
              icon={<Plus className="h-4 w-4" />}
            >
              Add Tests
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setCancelDialogOpen(true)}
              icon={<XCircle className="h-4 w-4" />}
            >
              Cancel Booking
            </Button>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {testStatusSummary.total > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">
              Test Progress
            </h3>
            <span className="text-sm text-gray-500">
              {testStatusSummary.completed} of {testStatusSummary.total} completed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-green-500 h-2.5 rounded-full transition-all"
              style={{
                width: `${
                  testStatusSummary.total > 0
                    ? (testStatusSummary.completed / testStatusSummary.total) *
                      100
                    : 0
                }%`,
              }}
            />
          </div>
          <div className="flex items-center gap-6 mt-3">
            <StatusIndicator
              color="bg-yellow-400"
              label="Pending"
              count={testStatusSummary.pending}
            />
            <StatusIndicator
              color="bg-blue-500"
              label="In Progress"
              count={testStatusSummary.inProgress}
            />
            <StatusIndicator
              color="bg-green-500"
              label="Completed"
              count={testStatusSummary.completed}
            />
          </div>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sample Information */}
        <Card title="Sample Information" className="lg:col-span-1">
          <div className="space-y-3">
            <DetailRow
              icon={<FileText className="h-4 w-4" />}
              label="Sample Code"
              value={booking.sampleCode}
            />
            <DetailRow
              icon={<Package className="h-4 w-4" />}
              label="Testing Type"
              value={getStatusBadge(booking.testingType)}
            />
            <DetailRow
              icon={<Calendar className="h-4 w-4" />}
              label="Due Date"
              value={formatDate(booking.dueDate)}
            />
            {booking.remarks && (
              <DetailRow
                icon={<FileText className="h-4 w-4" />}
                label="Remarks"
                value={booking.remarks}
              />
            )}
          </div>
        </Card>

        {/* Client Information */}
        <Card title="Client Information" className="lg:col-span-1">
          <div className="space-y-3">
            <DetailRow
              icon={<User className="h-4 w-4" />}
              label="Client Name"
              value={booking.clientName}
            />
            <DetailRow
              icon={<FileText className="h-4 w-4" />}
              label="Client ID"
              value={booking.clientId}
            />
          </div>
        </Card>

        {/* Pricing */}
        <Card title="Pricing Breakdown" className="lg:col-span-1">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Amount</span>
              <span className="text-gray-900 font-medium">
                {formatCurrency(booking.totalAmount)}
              </span>
            </div>
            {booking.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Discount</span>
                <span className="text-green-600 font-medium">
                  -{formatCurrency(booking.discount)}
                </span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-3 flex justify-between">
              <span className="text-sm font-semibold text-gray-900">
                Net Amount
              </span>
              <span className="text-lg font-bold text-blue-700">
                {formatCurrency(booking.netAmount)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Tests Table */}
      <Card
        title={`Tests (${booking.tests?.length ?? 0})`}
        noPadding
        actions={
          isEditable ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddTestsModalOpen(true)}
              icon={<Plus className="h-4 w-4" />}
            >
              Add Tests
            </Button>
          ) : undefined
        }
      >
        {(booking.tests?.length ?? 0) === 0 ? (
          <div className="text-center py-12 text-sm text-gray-500">
            No tests assigned to this booking.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Test Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Rate
                  </th>
                  {isEditable && (
                    <th className="px-6 py-3 w-12" />
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {(booking.tests ?? []).map((test: BookingTest) => (
                  <tr key={test.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getTestStatusIcon(test.status)}
                        <span className="text-sm font-medium text-gray-900">
                          {test.testName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {test.departmentName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {test.assignedTo ?? '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}
                      >
                        {getStatusBadge(test.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                      {formatCurrency(test.rate)}
                    </td>
                    {isEditable && (
                      <td className="px-6 py-4">
                        {test.status === 'PENDING' && (
                          <button
                            onClick={() =>
                              removeTestMutation.mutate(test.id)
                            }
                            disabled={removeTestMutation.isPending}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                            title="Remove test"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ─── Add Tests Modal ───────────────────────────────── */}
      <Modal
        isOpen={addTestsModalOpen}
        onClose={() => {
          setAddTestsModalOpen(false);
          setAddTestStandardId('');
          setAddTestSelectedIds([]);
        }}
        title="Add Tests to Booking"
        size="lg"
        footer={
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setAddTestsModalOpen(false);
                setAddTestStandardId('');
                setAddTestSelectedIds([]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => addTestsMutation.mutate(addTestSelectedIds)}
              loading={addTestsMutation.isPending}
              disabled={addTestSelectedIds.length === 0}
              icon={<Plus className="h-4 w-4" />}
            >
              Add {addTestSelectedIds.length}{' '}
              {addTestSelectedIds.length === 1 ? 'Test' : 'Tests'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Select
            label="Standard"
            placeholder="Select a standard to view available tests..."
            options={standards
              .filter((s) => s.isActive)
              .map((s) => ({
                value: s.id,
                label: `${s.code} — ${s.name}`,
              }))}
            value={addTestStandardId}
            onChange={(e) => {
              setAddTestStandardId(e.target.value);
              setAddTestSelectedIds([]);
            }}
          />

          {addTestStandardId && (
            <>
              {addTestMastersQuery.isLoading ? (
                <Loader size="sm" text="Loading tests..." />
              ) : availableTestMasters.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-500 bg-gray-50 rounded-lg">
                  No additional tests available for this standard.
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {addTestSelectedIds.length} of{' '}
                      {availableTestMasters.length} selected
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          addTestSelectedIds.length ===
                          availableTestMasters.length
                        ) {
                          setAddTestSelectedIds([]);
                        } else {
                          setAddTestSelectedIds(
                            availableTestMasters.map((t) => t.id),
                          );
                        }
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {addTestSelectedIds.length ===
                      availableTestMasters.length
                        ? 'Deselect All'
                        : 'Select All'}
                    </button>
                  </div>
                  <div className="border border-gray-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-3 py-2.5 w-10">
                            <input
                              type="checkbox"
                              checked={
                                availableTestMasters.length > 0 &&
                                addTestSelectedIds.length ===
                                  availableTestMasters.length
                              }
                              onChange={() => {
                                if (
                                  addTestSelectedIds.length ===
                                  availableTestMasters.length
                                ) {
                                  setAddTestSelectedIds([]);
                                } else {
                                  setAddTestSelectedIds(
                                    availableTestMasters.map((t) => t.id),
                                  );
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">
                            Test Name
                          </th>
                          <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">
                            Department
                          </th>
                          <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">
                            Rate
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {availableTestMasters.map((test) => {
                          const isSelected = addTestSelectedIds.includes(
                            test.id,
                          );
                          return (
                            <tr
                              key={test.id}
                              className={`cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-blue-50'
                                  : 'hover:bg-gray-50'
                              }`}
                              onClick={() => {
                                setAddTestSelectedIds((prev) =>
                                  isSelected
                                    ? prev.filter((tid) => tid !== test.id)
                                    : [...prev, test.id],
                                );
                              }}
                            >
                              <td className="px-3 py-2.5">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    setAddTestSelectedIds((prev) =>
                                      isSelected
                                        ? prev.filter(
                                            (tid) => tid !== test.id,
                                          )
                                        : [...prev, test.id],
                                    );
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-3 py-2.5 text-sm font-medium text-gray-900">
                                {test.name}
                              </td>
                              <td className="px-3 py-2.5 text-sm text-gray-600">
                                {test.departmentName}
                              </td>
                              <td className="px-3 py-2.5 text-sm text-gray-900 text-right font-medium">
                                {formatCurrency(test.rate)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </Modal>

      {/* ─── Cancel Confirmation ───────────────────────────── */}
      <ConfirmDialog
        isOpen={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        onConfirm={() => cancelBookingMutation.mutate()}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking? This action cannot be undone. All pending tests will be cancelled."
        confirmText="Cancel Booking"
        cancelText="Keep Booking"
        variant="danger"
        loading={cancelBookingMutation.isPending}
      />
    </div>
  );
}

// ─── Helper Components ──────────────────────────────────

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-gray-400">{icon}</div>
      <div>
        <span className="text-xs text-gray-500">{label}</span>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function StatusIndicator({
  color,
  label,
  count,
}: {
  color: string;
  label: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-xs text-gray-600">
        {label}: {count}
      </span>
    </div>
  );
}
