import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Download,
  Mail,
  Printer,
  Eye,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  CalendarDays,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { get, post, put } from '../../services/api';
import type {
  Coa,
  Booking,
  BookingTest,
  ResultParameter,
  ApiResponse,
  PaginatedResponse,
} from '../../types';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Table, { type Column } from '../../components/ui/Table';
import SearchInput from '../../components/ui/SearchInput';
import Pagination from '../../components/ui/Pagination';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import StatCard from '../../components/ui/StatCard';
import { formatDate, getStatusBadge } from '../../utils/formatters';

// ─── Extended types for this page ─────────────────────────
interface CoaListItem extends Coa {
  sampleDescription?: string;
  bookingCode?: string;
  verificationCode?: string;
}

interface CompletedBooking extends Booking {
  sampleDescription?: string;
  sampleName?: string;
  hasCoa?: boolean;
}

interface CoaDetail extends Coa {
  sampleName?: string;
  sampleDescription?: string;
  sampleCode: string;
  clientName: string;
  clientAddress?: string;
  clientEmail?: string;
  bookingCode?: string;
  verificationCode?: string;
  testResults: CoaTestResult[];
  generatedByName?: string;
  dispatchedAt?: string;
  remarks?: string;
}

interface CoaTestResult {
  testName: string;
  departmentName: string;
  parameters: ResultParameter[];
}

interface CoaStats {
  total: number;
  dispatched: number;
  pendingDispatch: number;
  thisMonth: number;
}

type FilterTab = 'ALL' | 'GENERATED' | 'DISPATCHED' | 'CANCELLED';

const STATUS_BADGE: Record<string, 'green' | 'blue' | 'teal' | 'gray' | 'red'> = {
  GENERATED: 'teal',
  DISPATCHED: 'green',
  CANCELLED: 'gray',
  PRINTED: 'blue',
};

export default function CoaManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<CompletedBooking | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedCoa, setSelectedCoa] = useState<CoaListItem | null>(null);

  const pageSize = 25;

  // ─── Fetch CoA list ─────────────────────────────────────
  const { data, isLoading, isError } = useQuery({
    queryKey: ['coa-list', page, search, activeTab],
    queryFn: () =>
      get<PaginatedResponse<CoaListItem>>('/coa', {
        params: {
          page,
          limit: pageSize,
          search,
          ...(activeTab !== 'ALL' && { status: activeTab }),
        },
      }),
  });

  const items = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.total ?? 0;

  // ─── Stats ──────────────────────────────────────────────
  const { data: stats } = useQuery({
    queryKey: ['coa-stats'],
    queryFn: () => get<ApiResponse<CoaStats>>('/coa/stats').then((r) => r.data),
  });

  // ─── Fetch completed bookings without CoA ───────────────
  const { data: completedBookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings-for-coa'],
    queryFn: () =>
      get<PaginatedResponse<CompletedBooking>>('/bookings', {
        params: { status: 'COMPLETED', hasCoa: false, limit: 100 },
      }),
    enabled: generateModalOpen,
  });

  const availableBookings = completedBookings?.data ?? [];

  // ─── Fetch CoA detail ───────────────────────────────────
  const { data: coaDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['coa-detail', selectedCoa?.id],
    queryFn: () =>
      get<ApiResponse<CoaDetail>>(`/coa/${selectedCoa!.id}`).then((r) => r.data),
    enabled: !!selectedCoa?.id && viewModalOpen,
  });

  // ─── Generate CoA mutation ──────────────────────────────
  const generateMutation = useMutation({
    mutationFn: (bookingId: string) =>
      post<ApiResponse<Coa>>(`/coa/generate/${bookingId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coa-list'] });
      queryClient.invalidateQueries({ queryKey: ['coa-stats'] });
      queryClient.invalidateQueries({ queryKey: ['bookings-for-coa'] });
      toast.success('Certificate of Analysis generated successfully');
      setGenerateModalOpen(false);
      setSelectedBooking(null);
    },
    onError: () => toast.error('Failed to generate CoA'),
  });

  // ─── Dispatch mutation ──────────────────────────────────
  const dispatchMutation = useMutation({
    mutationFn: (coaId: string) =>
      put<ApiResponse<null>>(`/coa/${coaId}/dispatch`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coa-list'] });
      queryClient.invalidateQueries({ queryKey: ['coa-stats'] });
      toast.success('CoA marked as dispatched');
    },
    onError: () => toast.error('Failed to update dispatch status'),
  });

  // ─── Email mutation ─────────────────────────────────────
  const emailMutation = useMutation({
    mutationFn: (coaId: string) =>
      post<ApiResponse<null>>(`/coa/${coaId}/email`),
    onSuccess: () => toast.success('CoA emailed to client'),
    onError: () => toast.error('Failed to email CoA'),
  });

  const openViewModal = (coa: CoaListItem) => {
    setSelectedCoa(coa);
    setViewModalOpen(true);
  };

  const closeViewModal = () => {
    setViewModalOpen(false);
    setSelectedCoa(null);
  };

  // ─── Filter tabs ────────────────────────────────────────
  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'ALL', label: 'All' },
    { key: 'GENERATED', label: 'Generated' },
    { key: 'DISPATCHED', label: 'Dispatched' },
    { key: 'CANCELLED', label: 'Cancelled' },
  ];

  // ─── Table columns ─────────────────────────────────────
  const columns: Column<CoaListItem>[] = [
    {
      key: 'coaNumber',
      header: 'Report Number',
      sortable: true,
      render: (row) => (
        <span className="font-medium text-gray-900">{row.coaNumber}</span>
      ),
    },
    { key: 'clientName', header: 'Client', sortable: true },
    {
      key: 'sampleDescription',
      header: 'Sample Description',
      render: (row) => (
        <span className="text-gray-700">
          {row.sampleDescription || row.sampleCode || '—'}
        </span>
      ),
    },
    {
      key: 'generatedAt',
      header: 'Generated Date',
      sortable: true,
      render: (row) => formatDate(row.generatedAt),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={STATUS_BADGE[row.status] ?? 'gray'}>
          {getStatusBadge(row.status)}
        </Badge>
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
              openViewModal(row);
            }}
            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
            title="View"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(`/api/coa/${row.id}/download`, '_blank');
            }}
            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
            title="Download"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              emailMutation.mutate(row.id);
            }}
            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
            title="Email to Client"
          >
            <Mail className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(`/api/coa/${row.id}/print`, '_blank');
            }}
            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg text-orange-700 bg-orange-50 hover:bg-orange-100 transition-colors"
            title="Print"
          >
            <Printer className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // ─── Booking selection columns ──────────────────────────
  const bookingColumns: Column<CompletedBooking>[] = [
    {
      key: 'bookingCode',
      header: 'Booking Code',
      sortable: true,
      render: (row) => (
        <span className="font-medium text-gray-900">{row.bookingCode}</span>
      ),
    },
    { key: 'clientName', header: 'Client', sortable: true },
    { key: 'sampleCode', header: 'Sample Code' },
    {
      key: 'sampleName',
      header: 'Sample',
      render: (row) => row.sampleName || row.sampleDescription || '—',
    },
    {
      key: 'tests',
      header: 'Tests',
      render: (row) => (
        <Badge variant="blue">{row.tests?.length ?? 0} tests</Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'text-right',
      render: (row) => (
        <Button
          size="sm"
          variant={selectedBooking?.id === row.id ? 'primary' : 'outline'}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedBooking(row);
          }}
        >
          {selectedBooking?.id === row.id ? 'Selected' : 'Select'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certificate of Analysis</h1>
          <p className="text-sm text-gray-500 mt-1">
            Generate, manage, and dispatch certificates of analysis
          </p>
        </div>
        <Button
          icon={<Plus className="h-4 w-4" />}
          onClick={() => {
            setSelectedBooking(null);
            setGenerateModalOpen(true);
          }}
        >
          Generate CoA
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          label="Total Generated"
          value={stats?.total ?? 0}
          color="blue"
        />
        <StatCard
          icon={<Send className="h-5 w-5" />}
          label="Dispatched"
          value={stats?.dispatched ?? 0}
          color="green"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Pending Dispatch"
          value={stats?.pendingDispatch ?? 0}
          color="orange"
        />
        <StatCard
          icon={<CalendarDays className="h-5 w-5" />}
          label="This Month"
          value={stats?.thisMonth ?? 0}
          color="purple"
        />
      </div>

      {/* Filter tabs + search + table */}
      <Card noPadding>
        <div className="flex items-center justify-between gap-4 p-4 border-b border-gray-100">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <SearchInput
            onSearch={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Search by report number, client..."
            className="w-80"
          />
        </div>

        {isLoading ? (
          <Loader text="Loading certificates..." />
        ) : isError ? (
          <EmptyState
            title="Failed to load certificates"
            description="There was an error loading the CoA list. The API server may not be running."
            icon={<AlertTriangle className="h-8 w-8 text-gray-400" />}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="No certificates found"
            description={
              search
                ? 'Try adjusting your search criteria'
                : 'No certificates of analysis have been generated yet.'
            }
            icon={<FileText className="h-8 w-8 text-gray-400" />}
          />
        ) : (
          <>
            <Table
              columns={columns}
              data={items}
              keyExtractor={(row) => row.id}
              onRowClick={openViewModal}
            />
            <div className="px-4 border-t border-gray-100">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </Card>

      {/* ─── Generate CoA Modal ──────────────────────────── */}
      <Modal
        isOpen={generateModalOpen}
        onClose={() => {
          setGenerateModalOpen(false);
          setSelectedBooking(null);
        }}
        title="Generate Certificate of Analysis"
        size="xl"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Select a completed booking to generate a Certificate of Analysis. Only bookings
            with all tests completed and approved are shown.
          </p>

          {bookingsLoading ? (
            <Loader text="Loading completed bookings..." />
          ) : availableBookings.length === 0 ? (
            <EmptyState
              title="No bookings available"
              description="There are no completed bookings without a CoA. Complete and approve test results first."
              icon={<FileText className="h-8 w-8 text-gray-400" />}
            />
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <Table
                columns={bookingColumns}
                data={availableBookings}
                keyExtractor={(row) => row.id}
                onRowClick={(row) => setSelectedBooking(row)}
              />
            </div>
          )}

          {/* Selected booking preview */}
          {selectedBooking && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
              <h4 className="text-sm font-semibold text-blue-900">
                Selected: {selectedBooking.bookingCode}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <p className="text-xs text-blue-700 uppercase tracking-wider">Client</p>
                  <p className="text-sm font-medium text-blue-900 mt-0.5">
                    {selectedBooking.clientName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-700 uppercase tracking-wider">Sample</p>
                  <p className="text-sm font-medium text-blue-900 mt-0.5">
                    {selectedBooking.sampleCode}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-700 uppercase tracking-wider">Tests</p>
                  <p className="text-sm font-medium text-blue-900 mt-0.5">
                    {selectedBooking.tests?.length ?? 0} test(s)
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-700 uppercase tracking-wider">Priority</p>
                  <p className="text-sm font-medium text-blue-900 mt-0.5">
                    {getStatusBadge(selectedBooking.priority)}
                  </p>
                </div>
              </div>

              {/* Test list preview */}
              {selectedBooking.tests && selectedBooking.tests.length > 0 && (
                <div>
                  <p className="text-xs text-blue-700 uppercase tracking-wider mb-1">
                    Test Results Preview
                  </p>
                  <div className="bg-white rounded-md border border-blue-200 divide-y divide-blue-100">
                    {selectedBooking.tests.map((test: BookingTest) => (
                      <div
                        key={test.id}
                        className="px-3 py-2 flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-900">{test.testName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-xs">
                            {test.departmentName}
                          </span>
                          <Badge
                            variant={test.status === 'VERIFIED' ? 'green' : 'yellow'}
                          >
                            {getStatusBadge(test.status)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200">
            <Button
              variant="ghost"
              onClick={() => {
                setGenerateModalOpen(false);
                setSelectedBooking(null);
              }}
            >
              Cancel
            </Button>
            <Button
              icon={<CheckCircle2 className="h-4 w-4" />}
              onClick={() => {
                if (selectedBooking) {
                  generateMutation.mutate(selectedBooking.id);
                }
              }}
              disabled={!selectedBooking}
              loading={generateMutation.isPending}
            >
              Generate CoA
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── View CoA Modal ──────────────────────────────── */}
      <Modal
        isOpen={viewModalOpen}
        onClose={closeViewModal}
        title="Certificate of Analysis"
        size="xl"
      >
        {detailLoading ? (
          <Loader text="Loading certificate details..." />
        ) : !coaDetail ? (
          <EmptyState
            title="No data available"
            description="Unable to load certificate details."
            icon={<FileText className="h-8 w-8 text-gray-400" />}
          />
        ) : (
          <div className="space-y-6">
            {/* Report header info */}
            <div className="text-center border-b border-gray-200 pb-4">
              <h2 className="text-lg font-bold text-gray-900">
                CERTIFICATE OF ANALYSIS
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Report No: <span className="font-semibold">{coaDetail.coaNumber}</span>
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Date: {formatDate(coaDetail.generatedAt)}
              </p>
            </div>

            {/* Client & sample info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Client Information
                </h4>
                <div className="p-3 bg-gray-50 rounded-lg space-y-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {coaDetail.clientName}
                  </p>
                  {coaDetail.clientAddress && (
                    <p className="text-xs text-gray-600">{coaDetail.clientAddress}</p>
                  )}
                  {coaDetail.clientEmail && (
                    <p className="text-xs text-gray-600">{coaDetail.clientEmail}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Sample Information
                </h4>
                <div className="p-3 bg-gray-50 rounded-lg space-y-1">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Code:</span> {coaDetail.sampleCode}
                  </p>
                  {coaDetail.sampleName && (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Name:</span> {coaDetail.sampleName}
                    </p>
                  )}
                  {coaDetail.sampleDescription && (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Description:</span>{' '}
                      {coaDetail.sampleDescription}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Test results */}
            {coaDetail.testResults &&
              coaDetail.testResults.map((testResult, idx) => (
                <div key={idx}>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    {testResult.testName}
                    <span className="text-xs font-normal text-gray-500 ml-2">
                      ({testResult.departmentName})
                    </span>
                  </h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">
                            Parameter
                          </th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">
                            Method
                          </th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">
                            Unit
                          </th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">
                            Specification
                          </th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">
                            Result
                          </th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">
                            Compliance
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {testResult.parameters.map((param) => (
                          <tr key={param.id}>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {param.parameterName}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {param.method || '—'}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {param.unit || '—'}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {param.specification || '—'}
                            </td>
                            <td className="px-4 py-2 text-sm font-medium text-gray-900">
                              {param.result || '—'}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {param.isCompliant === null ||
                              param.isCompliant === undefined ? (
                                <span className="text-gray-400">—</span>
                              ) : param.isCompliant ? (
                                <Badge variant="green">Pass</Badge>
                              ) : (
                                <Badge variant="red">Fail</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

            {/* Verification code placeholder */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    Verification Code
                  </p>
                  <p className="text-sm font-mono font-semibold text-gray-900">
                    {coaDetail.verificationCode || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <span className="text-xs text-green-700 font-medium">
                  Digitally Verified
                </span>
              </div>
            </div>

            {/* Status & dispatch info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Status</p>
                <Badge
                  variant={STATUS_BADGE[coaDetail.status] ?? 'gray'}
                  className="mt-1"
                >
                  {getStatusBadge(coaDetail.status)}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Generated By
                </p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {coaDetail.generatedByName || coaDetail.generatedBy || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Print Count
                </p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {coaDetail.printCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Dispatched At
                </p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {formatDate(coaDetail.dispatchedAt) || '—'}
                </p>
              </div>
            </div>

            {/* Remarks */}
            {coaDetail.remarks && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">Remarks</h4>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                  {coaDetail.remarks}
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200">
              <Button variant="ghost" onClick={closeViewModal}>
                Close
              </Button>
              <Button
                variant="outline"
                icon={<Mail className="h-4 w-4" />}
                onClick={() => emailMutation.mutate(coaDetail.id)}
                loading={emailMutation.isPending}
              >
                Email to Client
              </Button>
              {coaDetail.status !== 'DISPATCHED' && (
                <Button
                  className="bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-sm"
                  icon={<Send className="h-4 w-4" />}
                  onClick={() => {
                    dispatchMutation.mutate(coaDetail.id);
                    closeViewModal();
                  }}
                  loading={dispatchMutation.isPending}
                >
                  Mark as Dispatched
                </Button>
              )}
              <Button
                variant="outline"
                icon={<Printer className="h-4 w-4" />}
                onClick={() => window.open(`/api/coa/${coaDetail.id}/print`, '_blank')}
              >
                Print
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
