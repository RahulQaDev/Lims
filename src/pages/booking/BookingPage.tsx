import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Eye,
  XCircle,
  ClipboardList,
  FlaskConical,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  IndianRupee,
  Calendar,
  FileText,
  User,
  Package,
  Beaker,
  Check,
  Search,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { get, post, put, del } from '../../services/api';
import type {
  Booking,
  BookingTest,
  Sample,
  Standard,
  TestMaster,
  BookingStatus,
  Priority,
  TestingType,
  PaginatedResponse,
  ApiResponse,
} from '../../types';
import {
  formatDate,
  formatCurrency,
  getStatusColor,
  getStatusBadge,
} from '../../utils/formatters';
import { PRIORITIES, TESTING_TYPES, DEFAULT_PAGE_SIZE } from '../../utils/constants';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Table, { type Column } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import SearchInput from '../../components/ui/SearchInput';
import Pagination from '../../components/ui/Pagination';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import Loader from '../../components/ui/Loader';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';

// ─── Types ──────────────────────────────────────────────

interface RateLookupResponse {
  rate: number;
  clientRate: number | null;
}

interface BookingFormData {
  sampleId: string;
  standardId: string;
  testingType: TestingType;
  priority: Priority;
  tests: string[];
  remarks: string;
  discount: number;
}

type BookingFilterTab = 'ALL' | BookingStatus;

interface SelectedTestInfo {
  testMasterId: string;
  name: string;
  departmentName: string;
  method: string;
  rate: number;
}

const FILTER_TABS: { value: BookingFilterTab; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'CONFIRMED', label: 'Booked' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const STEPS = ['Select Sample', 'Select Tests', 'Review & Confirm'] as const;

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

// ─── Main Component ─────────────────────────────────────

export default function BookingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // List state
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingFilterTab>('ALL');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);

  // New booking state
  const [newBookingOpen, setNewBookingOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [form, setForm] = useState<BookingFormData>({
    sampleId: '',
    standardId: '',
    testingType: 'IN_HOUSE',
    priority: 'NORMAL',
    tests: [],
    remarks: '',
    discount: 0,
  });
  const [selectedTests, setSelectedTests] = useState<SelectedTestInfo[]>([]);
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);

  // ─── Queries ────────────────────────────────────────────

  const bookingsQuery = useQuery({
    queryKey: ['bookings', page, search, statusFilter],
    queryFn: () =>
      get<PaginatedResponse<Booking>>('/bookings', {
        params: {
          page,
          limit: DEFAULT_PAGE_SIZE,
          ...(statusFilter !== 'ALL' && { status: statusFilter }),
          ...(search && { search }),
        },
      }),
  });

  const bookings = bookingsQuery.data?.data ?? [];
  const totalPages = bookingsQuery.data?.totalPages ?? 1;
  const totalItems = bookingsQuery.data?.total ?? 0;

  // Samples ready for booking
  const samplesQuery = useQuery({
    queryKey: ['samples-for-booking'],
    queryFn: () =>
      get<PaginatedResponse<Sample>>('/samples', {
        params: { status: 'received', limit: 500 },
      }),
    enabled: newBookingOpen,
  });

  const availableSamples = samplesQuery.data?.data ?? [];

  // Standards
  const standardsQuery = useQuery({
    queryKey: ['standards'],
    queryFn: () =>
      get<PaginatedResponse<Standard>>('/standards', {
        params: { limit: 500 },
      }),
    enabled: newBookingOpen && currentStep >= 1,
  });

  const standards = standardsQuery.data?.data ?? [];

  // Test masters filtered by standard
  const testMastersQuery = useQuery({
    queryKey: ['test-masters', form.standardId],
    queryFn: () =>
      get<PaginatedResponse<TestMaster>>('/test-masters', {
        params: {
          standardId: form.standardId,
          limit: 500,
        },
      }),
    enabled: newBookingOpen && currentStep >= 1 && !!form.standardId,
  });

  const testMasters = testMastersQuery.data?.data ?? [];

  // Booking detail query
  const bookingDetailQuery = useQuery({
    queryKey: ['booking-detail', selectedBooking?.id],
    queryFn: () =>
      get<ApiResponse<Booking>>(`/bookings/${selectedBooking!.id}`),
    enabled: !!selectedBooking?.id && detailModalOpen,
  });

  const bookingDetail = bookingDetailQuery.data?.data ?? selectedBooking;

  // ─── Mutations ──────────────────────────────────────────

  const createBookingMutation = useMutation({
    mutationFn: (payload: {
      sampleId: string;
      standardId: string;
      testingType: TestingType;
      priority: Priority;
      tests: string[];
      remarks: string;
    }) => post<ApiResponse<Booking>>('/bookings', payload),
    onSuccess: () => {
      toast.success('Booking created successfully');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['samples-for-booking'] });
      handleCloseNewBooking();
    },
    onError: () => {
      toast.error('Failed to create booking');
    },
  });

  const cancelBookingMutation = useMutation({
    mutationFn: (bookingId: string) =>
      put<ApiResponse<Booking>>(`/bookings/${bookingId}/cancel`),
    onSuccess: () => {
      toast.success('Booking cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setCancelDialogOpen(false);
      setBookingToCancel(null);
      if (detailModalOpen) {
        setDetailModalOpen(false);
        setSelectedBooking(null);
      }
    },
    onError: () => {
      toast.error('Failed to cancel booking');
    },
  });

  const addTestsMutation = useMutation({
    mutationFn: ({
      bookingId,
      tests,
    }: {
      bookingId: string;
      tests: string[];
    }) => post<ApiResponse<Booking>>(`/bookings/${bookingId}/tests`, { tests }),
    onSuccess: () => {
      toast.success('Tests added successfully');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({
        queryKey: ['booking-detail', selectedBooking?.id],
      });
    },
    onError: () => {
      toast.error('Failed to add tests');
    },
  });

  const removeTestMutation = useMutation({
    mutationFn: ({
      bookingId,
      testId,
    }: {
      bookingId: string;
      testId: string;
    }) => del<ApiResponse<null>>(`/bookings/${bookingId}/tests/${testId}`),
    onSuccess: () => {
      toast.success('Test removed');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({
        queryKey: ['booking-detail', selectedBooking?.id],
      });
    },
    onError: () => {
      toast.error('Failed to remove test');
    },
  });

  // ─── Computed values ────────────────────────────────────

  const totalAmount = useMemo(
    () => selectedTests.reduce((sum, t) => sum + t.rate, 0),
    [selectedTests],
  );

  const discountAmount = useMemo(
    () => (totalAmount * form.discount) / 100,
    [totalAmount, form.discount],
  );

  const netAmount = useMemo(
    () => totalAmount - discountAmount,
    [totalAmount, discountAmount],
  );

  // ─── Handlers ───────────────────────────────────────────

  const handleCloseNewBooking = useCallback(() => {
    setNewBookingOpen(false);
    setCurrentStep(0);
    setForm({
      sampleId: '',
      standardId: '',
      testingType: 'IN_HOUSE',
      priority: 'NORMAL',
      tests: [],
      remarks: '',
      discount: 0,
    });
    setSelectedTests([]);
    setSelectedSample(null);
  }, []);

  const handleSampleSelect = useCallback(
    (sampleId: string) => {
      const sample = availableSamples.find((s) => s.id === sampleId) ?? null;
      setSelectedSample(sample);
      setForm((prev) => ({ ...prev, sampleId }));
    },
    [availableSamples],
  );

  const handleTestToggle = useCallback(
    (test: TestMaster) => {
      setSelectedTests((prev) => {
        const exists = prev.find((t) => t.testMasterId === test.id);
        if (exists) {
          const updated = prev.filter((t) => t.testMasterId !== test.id);
          setForm((f) => ({
            ...f,
            tests: updated.map((t) => t.testMasterId),
          }));
          return updated;
        }
        const newTest: SelectedTestInfo = {
          testMasterId: test.id,
          name: test.name,
          departmentName: test.departmentName,
          method: test.parameters?.[0]?.method ?? '—',
          rate: test.rate,
        };
        const updated = [...prev, newTest];
        setForm((f) => ({
          ...f,
          tests: updated.map((t) => t.testMasterId),
        }));
        return updated;
      });
    },
    [],
  );

  const handleSelectAllTests = useCallback(() => {
    if (selectedTests.length === testMasters.length) {
      setSelectedTests([]);
      setForm((f) => ({ ...f, tests: [] }));
    } else {
      const all: SelectedTestInfo[] = testMasters.map((t) => ({
        testMasterId: t.id,
        name: t.name,
        departmentName: t.departmentName,
        method: t.parameters?.[0]?.method ?? '—',
        rate: t.rate,
      }));
      setSelectedTests(all);
      setForm((f) => ({ ...f, tests: all.map((t) => t.testMasterId) }));
    }
  }, [testMasters, selectedTests.length]);

  const handleNextStep = useCallback(() => {
    if (currentStep === 0 && !form.sampleId) {
      toast.error('Please select a sample');
      return;
    }
    if (currentStep === 1 && form.tests.length === 0) {
      toast.error('Please select at least one test');
      return;
    }
    if (currentStep === 1 && !form.standardId) {
      toast.error('Please select a standard');
      return;
    }
    setCurrentStep((s) => Math.min(s + 1, 2));
  }, [currentStep, form.sampleId, form.tests.length, form.standardId]);

  const handlePrevStep = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);

  const handleConfirmBooking = useCallback(() => {
    createBookingMutation.mutate({
      sampleId: form.sampleId,
      standardId: form.standardId,
      testingType: form.testingType,
      priority: form.priority,
      tests: form.tests,
      remarks: form.remarks,
    });
  }, [form, createBookingMutation]);

  const handleOpenDetail = useCallback((booking: Booking) => {
    setSelectedBooking(booking);
    setDetailModalOpen(true);
  }, []);

  const handleCancelBooking = useCallback((bookingId: string) => {
    setBookingToCancel(bookingId);
    setCancelDialogOpen(true);
  }, []);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleFilterChange = useCallback((tab: BookingFilterTab) => {
    setStatusFilter(tab);
    setPage(1);
  }, []);

  // ─── Table columns ─────────────────────────────────────

  const columns: Column<Booking>[] = useMemo(
    () => [
      {
        key: 'bookingCode',
        header: 'Report No.',
        sortable: true,
        render: (row) => (
          <span className="font-mono text-xs font-semibold text-blue-700">
            {row.bookingCode}
          </span>
        ),
      },
      {
        key: 'sampleCode',
        header: 'Sample Code',
        sortable: true,
        render: (row) => (
          <span className="font-mono text-xs">{row.sampleCode}</span>
        ),
      },
      {
        key: 'clientName',
        header: 'Client',
        sortable: true,
        render: (row) => (
          <span className="text-sm text-gray-900">{row.clientName}</span>
        ),
      },
      {
        key: 'testingType',
        header: 'Testing Type',
        render: (row) => (
          <span className="text-sm text-gray-600">
            {getStatusBadge(row.testingType)}
          </span>
        ),
      },
      {
        key: 'priority',
        header: 'Priority',
        render: (row) => (
          <Badge variant={getPriorityBadgeVariant(row.priority)}>
            {getStatusBadge(row.priority)}
          </Badge>
        ),
      },
      {
        key: 'tests',
        header: 'Tests',
        render: (row) => (
          <span className="inline-flex items-center justify-center w-8 h-6 rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
            {row.tests?.length ?? 0}
          </span>
        ),
      },
      {
        key: 'netAmount',
        header: 'Amount',
        sortable: true,
        render: (row) => (
          <span className="font-medium text-gray-900">
            {formatCurrency(row.netAmount)}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => (
          <Badge variant={getBookingStatusVariant(row.status)}>
            {getStatusBadge(row.status)}
          </Badge>
        ),
      },
      {
        key: 'bookedAt',
        header: 'Date',
        sortable: true,
        render: (row) => (
          <span className="text-sm text-gray-500">
            {formatDate(row.bookedAt || row.createdAt)}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        className: 'text-right',
        render: (row) => (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDetail(row);
              }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </button>
            {row.status !== 'CANCELLED' && row.status !== 'COMPLETED' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancelBooking(row.id);
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Cancel Booking"
              >
                <XCircle className="h-4 w-4" />
              </button>
            )}
          </div>
        ),
      },
    ],
    [handleOpenDetail, handleCancelBooking],
  );

  // ─── Render: New Booking Modal Content ──────────────────

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      {STEPS.map((step, idx) => (
        <div key={step} className="flex items-center">
          <div className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                idx < currentStep
                  ? 'bg-green-100 text-green-700'
                  : idx === currentStep
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-400'
              }`}
            >
              {idx < currentStep ? (
                <Check className="h-4 w-4" />
              ) : (
                idx + 1
              )}
            </div>
            <span
              className={`ml-2 text-sm font-medium ${
                idx === currentStep
                  ? 'text-gray-900'
                  : idx < currentStep
                    ? 'text-green-700'
                    : 'text-gray-400'
              }`}
            >
              {step}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div
              className={`w-12 h-0.5 mx-3 ${
                idx < currentStep ? 'bg-green-400' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep0 = () => (
    <div className="space-y-5">
      <Select
        label="Select Sample *"
        placeholder="Choose a received sample..."
        options={availableSamples.map((s) => ({
          value: s.id,
          label: `${s.sampleCode} — ${s.name} (${s.clientName})`,
        }))}
        value={form.sampleId}
        onChange={(e) => handleSampleSelect(e.target.value)}
      />
      {samplesQuery.isLoading && (
        <Loader size="sm" text="Loading samples..." />
      )}
      {availableSamples.length === 0 && !samplesQuery.isLoading && (
        <div className="text-center py-6 text-sm text-gray-500">
          <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          No samples with status &quot;Received&quot; are available for booking.
        </div>
      )}
      {selectedSample && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-3">
          <h4 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
            <Package className="h-4 w-4" />
            Selected Sample Details
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <InfoField label="Sample Code" value={selectedSample.sampleCode} />
            <InfoField label="Client" value={selectedSample.clientName} />
            <InfoField label="Name" value={selectedSample.name} />
            <InfoField
              label="Batch Number"
              value={selectedSample.batchNumber ?? '—'}
            />
            <InfoField
              label="Received Date"
              value={formatDate(selectedSample.receivedDate)}
            />
            <InfoField
              label="Priority"
              value={getStatusBadge(selectedSample.priority)}
            />
            <InfoField
              label="Description"
              value={selectedSample.description ?? '—'}
              className="col-span-2"
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-5">
      {/* Testing Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Testing Type *
        </label>
        <div className="flex gap-3">
          {TESTING_TYPES.map((tt) => (
            <label
              key={tt.value}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                form.testingType === tt.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="testingType"
                value={tt.value}
                checked={form.testingType === tt.value}
                onChange={() =>
                  setForm((prev) => ({
                    ...prev,
                    testingType: tt.value as TestingType,
                  }))
                }
                className="sr-only"
              />
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  form.testingType === tt.value
                    ? 'border-blue-600'
                    : 'border-gray-300'
                }`}
              >
                {form.testingType === tt.value && (
                  <div className="w-2 h-2 rounded-full bg-blue-600" />
                )}
              </div>
              <span className="text-sm font-medium">{tt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Standard */}
      <Select
        label="Standard *"
        placeholder="Select a standard..."
        options={standards
          .filter((s) => s.isActive)
          .map((s) => ({
            value: s.id,
            label: `${s.code} — ${s.name}`,
          }))}
        value={form.standardId}
        onChange={(e) => {
          setForm((prev) => ({ ...prev, standardId: e.target.value, tests: [] }));
          setSelectedTests([]);
        }}
      />

      {/* Test selection */}
      {form.standardId && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Select Tests *
            </label>
            <div className="flex items-center gap-3">
              {testMasters.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllTests}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  {selectedTests.length === testMasters.length
                    ? 'Deselect All'
                    : 'Select All'}
                </button>
              )}
              <span className="text-xs text-gray-500">
                {selectedTests.length} of {testMasters.length} selected
              </span>
            </div>
          </div>

          {testMastersQuery.isLoading ? (
            <Loader size="sm" text="Loading tests..." />
          ) : testMasters.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500 bg-gray-50 rounded-lg">
              No tests found for the selected standard.
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase w-10">
                      <input
                        type="checkbox"
                        checked={
                          testMasters.length > 0 &&
                          selectedTests.length === testMasters.length
                        }
                        onChange={handleSelectAllTests}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">
                      Test Name
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">
                      Department
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">
                      Method
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">
                      Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {testMasters.map((test) => {
                    const isSelected = selectedTests.some(
                      (t) => t.testMasterId === test.id,
                    );
                    return (
                      <tr
                        key={test.id}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleTestToggle(test)}
                      >
                        <td className="px-3 py-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleTestToggle(test)}
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
                        <td className="px-3 py-2.5 text-sm text-gray-500">
                          {test.parameters?.[0]?.method ?? '—'}
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
          )}

          {/* Running total */}
          {selectedTests.length > 0 && (
            <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
              <span className="text-sm font-medium text-gray-700">
                Running Total ({selectedTests.length}{' '}
                {selectedTests.length === 1 ? 'test' : 'tests'})
              </span>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderStep2 = () => {
    const selectedStandard = standards.find((s) => s.id === form.standardId);

    return (
      <div className="space-y-5">
        {/* Sample info summary */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Package className="h-4 w-4" />
            Sample Information
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <InfoField
              label="Sample"
              value={`${selectedSample?.sampleCode} — ${selectedSample?.name}`}
            />
            <InfoField
              label="Client"
              value={selectedSample?.clientName ?? '—'}
            />
            <InfoField
              label="Standard"
              value={
                selectedStandard
                  ? `${selectedStandard.code} — ${selectedStandard.name}`
                  : '—'
              }
            />
            <InfoField
              label="Testing Type"
              value={getStatusBadge(form.testingType)}
            />
          </div>
        </div>

        {/* Selected tests */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Beaker className="h-4 w-4" />
            Selected Tests ({selectedTests.length})
          </h4>
          <div className="border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">
                    Test
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">
                    Department
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">
                    Rate
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {selectedTests.map((test) => (
                  <tr key={test.testMasterId}>
                    <td className="px-3 py-2 text-sm text-gray-900">
                      {test.name}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600">
                      {test.departmentName}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900 text-right">
                      {formatCurrency(test.rate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Priority & Remarks */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Priority"
            options={PRIORITIES.map((p) => ({
              value: p.value,
              label: p.label,
            }))}
            value={form.priority}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                priority: e.target.value as Priority,
              }))
            }
          />
          <Input
            label="Discount %"
            type="number"
            value={String(form.discount)}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                discount: Math.min(
                  100,
                  Math.max(0, Number(e.target.value) || 0),
                ),
              }))
            }
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Remarks
          </label>
          <textarea
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            value={form.remarks}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, remarks: e.target.value }))
            }
            placeholder="Any special instructions or remarks..."
          />
        </div>

        {/* Pricing summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal ({selectedTests.length} tests)</span>
            <span>{formatCurrency(totalAmount)}</span>
          </div>
          {form.discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount ({form.discount}%)</span>
              <span>-{formatCurrency(discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-blue-200">
            <span>Net Amount</span>
            <span>{formatCurrency(netAmount)}</span>
          </div>
        </div>
      </div>
    );
  };

  // ─── Render: Booking Detail Modal ───────────────────────

  const renderBookingDetail = () => {
    if (!bookingDetail) return null;

    return (
      <div className="space-y-5">
        {/* Status header */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-bold text-gray-900">
              {bookingDetail.bookingCode}
            </h4>
            <p className="text-sm text-gray-500">
              Booked on {formatDate(bookingDetail.bookedAt || bookingDetail.createdAt)}
            </p>
          </div>
          <Badge variant={getBookingStatusVariant(bookingDetail.status)}>
            {getStatusBadge(bookingDetail.status)}
          </Badge>
        </div>

        {/* Sample & Client */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5" />
              Sample Details
            </h5>
            <InfoField label="Sample Code" value={bookingDetail.sampleCode} />
            <InfoField
              label="Priority"
              value={getStatusBadge(bookingDetail.priority)}
            />
            <InfoField
              label="Testing Type"
              value={getStatusBadge(bookingDetail.testingType)}
            />
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <h5 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              Client Details
            </h5>
            <InfoField label="Client" value={bookingDetail.clientName} />
            <InfoField
              label="Due Date"
              value={formatDate(bookingDetail.dueDate)}
            />
            {bookingDetail.remarks && (
              <InfoField label="Remarks" value={bookingDetail.remarks} />
            )}
          </div>
        </div>

        {/* Tests */}
        <div>
          <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Beaker className="h-4 w-4" />
            Tests ({bookingDetail.tests?.length ?? 0})
          </h5>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">
                    Test Name
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">
                    Department
                  </th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">
                    Rate
                  </th>
                  {bookingDetail.status !== 'CANCELLED' &&
                    bookingDetail.status !== 'COMPLETED' && (
                      <th className="px-3 py-2.5 w-10" />
                    )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(bookingDetail.tests ?? []).map((test: BookingTest) => (
                  <tr key={test.id}>
                    <td className="px-3 py-2.5 text-sm font-medium text-gray-900">
                      {test.testName}
                    </td>
                    <td className="px-3 py-2.5 text-sm text-gray-600">
                      {test.departmentName}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}
                      >
                        {getStatusBadge(test.status)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-sm text-gray-900 text-right">
                      {formatCurrency(test.rate)}
                    </td>
                    {bookingDetail.status !== 'CANCELLED' &&
                      bookingDetail.status !== 'COMPLETED' && (
                        <td className="px-3 py-2.5">
                          {test.status === 'PENDING' && (
                            <button
                              onClick={() =>
                                removeTestMutation.mutate({
                                  bookingId: bookingDetail.id,
                                  testId: test.id,
                                })
                              }
                              className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Remove test"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Total Amount</span>
            <span>{formatCurrency(bookingDetail.totalAmount)}</span>
          </div>
          {bookingDetail.discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-{formatCurrency(bookingDetail.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
            <span>Net Amount</span>
            <span>{formatCurrency(bookingDetail.netAmount)}</span>
          </div>
        </div>

        {/* Actions */}
        {bookingDetail.status !== 'CANCELLED' &&
          bookingDetail.status !== 'COMPLETED' && (
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(`/booking/${bookingDetail.id}`)
                }
                icon={<Eye className="h-4 w-4" />}
              >
                Full Details
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleCancelBooking(bookingDetail.id)}
                icon={<XCircle className="h-4 w-4" />}
              >
                Cancel Booking
              </Button>
            </div>
          )}
      </div>
    );
  };

  // ─── Main Render ────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sample Booking</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage sample test bookings and assignments
          </p>
        </div>
        <Button
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setNewBookingOpen(true)}
        >
          New Booking
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-6 border-b border-gray-200">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleFilterChange(tab.value)}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              statusFilter === tab.value
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search + Table */}
      <Card noPadding>
        <div className="px-6 py-4 border-b border-gray-100">
          <SearchInput
            value={search}
            onSearch={handleSearch}
            placeholder="Search by report number, sample code, client name..."
            className="max-w-md"
          />
        </div>

        {bookingsQuery.isLoading ? (
          <Loader text="Loading bookings..." />
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="h-8 w-8 text-gray-400" />}
            title="No bookings found"
            description={
              search
                ? 'Try adjusting your search or filter criteria.'
                : 'Create your first booking to get started.'
            }
            action={
              !search ? (
                <Button
                  size="sm"
                  icon={<Plus className="h-4 w-4" />}
                  onClick={() => setNewBookingOpen(true)}
                >
                  New Booking
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <Table
              columns={columns}
              data={bookings}
              keyExtractor={(row) => row.id}
              onRowClick={handleOpenDetail}
            />
            <div className="px-6 border-t border-gray-100">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={DEFAULT_PAGE_SIZE}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </Card>

      {/* ─── New Booking Modal ─────────────────────────────── */}
      <Modal
        isOpen={newBookingOpen}
        onClose={handleCloseNewBooking}
        title="New Sample Booking"
        size="xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div>
              {currentStep > 0 && (
                <Button
                  variant="ghost"
                  onClick={handlePrevStep}
                  icon={<ChevronLeft className="h-4 w-4" />}
                >
                  Back
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={handleCloseNewBooking}>
                Cancel
              </Button>
              {currentStep < 2 ? (
                <Button
                  onClick={handleNextStep}
                  icon={<ChevronRight className="h-4 w-4" />}
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleConfirmBooking}
                  loading={createBookingMutation.isPending}
                  icon={<CheckCircle2 className="h-4 w-4" />}
                >
                  Confirm Booking
                </Button>
              )}
            </div>
          </div>
        }
      >
        {renderStepIndicator()}
        {currentStep === 0 && renderStep0()}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
      </Modal>

      {/* ─── Booking Detail Modal ──────────────────────────── */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedBooking(null);
        }}
        title="Booking Details"
        size="xl"
      >
        {bookingDetailQuery.isLoading ? (
          <Loader text="Loading booking details..." />
        ) : (
          renderBookingDetail()
        )}
      </Modal>

      {/* ─── Cancel Confirmation ───────────────────────────── */}
      <ConfirmDialog
        isOpen={cancelDialogOpen}
        onClose={() => {
          setCancelDialogOpen(false);
          setBookingToCancel(null);
        }}
        onConfirm={() => {
          if (bookingToCancel) {
            cancelBookingMutation.mutate(bookingToCancel);
          }
        }}
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

// ─── Helper Component ───────────────────────────────────

function InfoField({
  label,
  value,
  className = '',
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <span className="text-xs text-gray-500">{label}</span>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}
