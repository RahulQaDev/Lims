import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardCheck,
  Eye,
  CheckCircle2,
  XCircle,
  PauseCircle,
  AlertTriangle,
  FlaskConical,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { get, post } from '../../services/api';
import type {
  Result,
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
import { formatDate, getStatusColor, getStatusBadge } from '../../utils/formatters';

// ─── Extended type for the review list items ────────────
interface PendingReviewItem {
  id: string;
  resultId: string;
  sampleCode: string;
  clientName: string;
  testName: string;
  departmentName: string;
  analystName: string;
  completedAt: string;
  priority: string;
  status: string;
  bookingTestId: string;
}

interface ResultDetail {
  id: string;
  bookingTestId: string;
  testName: string;
  sampleCode: string;
  clientName?: string;
  departmentName: string;
  analystName: string;
  status: string;
  parameters: ResultParameter[];
  completedAt?: string;
  remarks?: string;
}

const PRIORITY_BADGE: Record<string, 'blue' | 'orange' | 'red'> = {
  NORMAL: 'blue',
  URGENT: 'orange',
  CRITICAL: 'red',
};

export default function ReviewPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<PendingReviewItem | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [remarksError, setRemarksError] = useState('');

  const pageSize = 25;

  // ─── Fetch pending review list ─────────────────────────
  const { data, isLoading, isError } = useQuery({
    queryKey: ['reviews-pending', page, search],
    queryFn: () =>
      get<PaginatedResponse<PendingReviewItem>>('/reviews/pending', {
        params: { page, limit: pageSize, search },
      }),
  });

  const items = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.total ?? 0;

  // ─── Fetch result detail when reviewing ────────────────
  const {
    data: resultDetail,
    isLoading: detailLoading,
  } = useQuery({
    queryKey: ['result-detail', selectedItem?.bookingTestId],
    queryFn: () =>
      get<ApiResponse<ResultDetail>>(
        `/results/booking-test/${selectedItem!.bookingTestId}`,
      ).then((res) => res.data),
    enabled: !!selectedItem?.bookingTestId && reviewModalOpen,
  });

  // ─── Review mutation ───────────────────────────────────
  const reviewMutation = useMutation({
    mutationFn: ({
      resultId,
      status,
      remarks: reviewRemarks,
    }: {
      resultId: string;
      status: 'approved' | 'rejected' | 'on_hold';
      remarks: string;
    }) =>
      post<ApiResponse<null>>(`/reviews/${resultId}/review`, {
        status,
        remarks: reviewRemarks,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews-pending'] });
      const msg =
        variables.status === 'approved'
          ? 'Result approved and sent for final approval'
          : variables.status === 'rejected'
            ? 'Result rejected and returned to analyst'
            : 'Result placed on hold';
      toast.success(msg);
      closeReviewModal();
    },
    onError: () => toast.error('Failed to submit review'),
  });

  const openReview = (item: PendingReviewItem) => {
    setSelectedItem(item);
    setRemarks('');
    setRemarksError('');
    setReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    setReviewModalOpen(false);
    setSelectedItem(null);
    setRemarks('');
    setRemarksError('');
  };

  const handleReviewAction = (status: 'approved' | 'rejected' | 'on_hold') => {
    if (status === 'rejected' && !remarks.trim()) {
      setRemarksError('Remarks are required when rejecting a result');
      return;
    }
    if (!selectedItem) return;
    reviewMutation.mutate({
      resultId: selectedItem.resultId,
      status,
      remarks: remarks.trim(),
    });
  };

  // ─── Table columns ─────────────────────────────────────
  const columns: Column<PendingReviewItem>[] = [
    {
      key: 'sampleCode',
      header: 'Sample Code',
      sortable: true,
      render: (row) => (
        <span className="font-medium text-gray-900">{row.sampleCode}</span>
      ),
    },
    { key: 'clientName', header: 'Client', sortable: true },
    { key: 'testName', header: 'Test Name', sortable: true },
    { key: 'departmentName', header: 'Department' },
    { key: 'analystName', header: 'Analyst' },
    {
      key: 'completedAt',
      header: 'Entered Date',
      sortable: true,
      render: (row) => formatDate(row.completedAt),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (row) => (
        <Badge variant={PRIORITY_BADGE[row.priority] ?? 'blue'}>
          {getStatusBadge(row.priority)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openReview(row);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            Review
          </button>
        </div>
      ),
    },
  ];

  // ─── Parameter table for the detail modal ──────────────
  const paramColumns: Column<ResultParameter>[] = [
    {
      key: 'parameterName',
      header: 'Parameter',
      render: (row) => (
        <span className={row.isCompliant === false ? 'font-semibold text-red-700' : 'text-gray-900'}>
          {row.parameterName}
        </span>
      ),
    },
    { key: 'method', header: 'Method', render: (row) => row.method || '—' },
    { key: 'unit', header: 'Unit', render: (row) => row.unit || '—' },
    {
      key: 'specification',
      header: 'Specification',
      render: (row) => row.specification || '—',
    },
    {
      key: 'result',
      header: 'Observed Value',
      render: (row) => (
        <span className={row.isCompliant === false ? 'font-semibold text-red-700' : ''}>
          {row.result || '—'}
        </span>
      ),
    },
    {
      key: 'isCompliant',
      header: 'Pass/Fail',
      render: (row) => {
        if (row.isCompliant === null || row.isCompliant === undefined) {
          return <span className="text-gray-400">—</span>;
        }
        return row.isCompliant ? (
          <Badge variant="green">Pass</Badge>
        ) : (
          <Badge variant="red">Fail</Badge>
        );
      },
    },
  ];

  const failedCount = resultDetail?.parameters?.filter((p) => p.isCompliant === false).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Review Results</h1>
            <p className="text-sm text-gray-500 mt-1">
              Level 2 review of completed test results
            </p>
          </div>
          {totalItems > 0 && (
            <Badge variant="orange">{totalItems} pending</Badge>
          )}
        </div>
      </div>

      {/* Results table */}
      <Card noPadding>
        <div className="flex items-center gap-4 p-4 border-b border-gray-100">
          <SearchInput
            onSearch={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Search by sample code, client, test..."
            className="w-96"
          />
        </div>

        {isLoading ? (
          <Loader text="Loading pending reviews..." />
        ) : isError ? (
          <EmptyState
            title="Failed to load reviews"
            description="There was an error loading the pending review list. The API server may not be running."
            icon={<AlertTriangle className="h-8 w-8 text-gray-400" />}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="No results pending review"
            description={
              search
                ? 'Try adjusting your search criteria'
                : 'All results have been reviewed. Check back later.'
            }
            icon={<ClipboardCheck className="h-8 w-8 text-gray-400" />}
          />
        ) : (
          <>
            <Table
              columns={columns}
              data={items}
              keyExtractor={(row) => row.id}
              onRowClick={openReview}
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

      {/* Review Detail Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={closeReviewModal}
        title="Review Result"
        size="xl"
      >
        {detailLoading ? (
          <Loader text="Loading result details..." />
        ) : !resultDetail ? (
          <EmptyState
            title="No data available"
            description="Unable to load result details."
            icon={<FlaskConical className="h-8 w-8 text-gray-400" />}
          />
        ) : (
          <div className="space-y-6">
            {/* Sample & Test Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Sample</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {resultDetail.sampleCode}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Test</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {resultDetail.testName}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Department</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {resultDetail.departmentName}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Analyst</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {resultDetail.analystName}
                </p>
              </div>
            </div>

            {/* Failed parameters warning */}
            {failedCount > 0 && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                <p className="text-sm text-red-700">
                  <span className="font-medium">{failedCount} parameter(s) failed</span>{' '}
                  compliance check. Please review carefully before approving.
                </p>
              </div>
            )}

            {/* Parameters table */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                Test Parameters
              </h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <Table
                  columns={paramColumns}
                  data={resultDetail.parameters}
                  keyExtractor={(row) => row.id}
                />
              </div>
            </div>

            {/* Analyst remarks */}
            {resultDetail.remarks && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">
                  Analyst Remarks
                </h4>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                  {resultDetail.remarks}
                </p>
              </div>
            )}

            {/* Reviewer remarks */}
            <div>
              <label
                htmlFor="reviewer-remarks"
                className="block text-sm font-semibold text-gray-900 mb-1"
              >
                Reviewer Remarks
              </label>
              <textarea
                id="reviewer-remarks"
                rows={3}
                className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  remarksError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter your review remarks..."
                value={remarks}
                onChange={(e) => {
                  setRemarks(e.target.value);
                  if (remarksError) setRemarksError('');
                }}
              />
              {remarksError && (
                <p className="text-xs text-red-600 mt-1">{remarksError}</p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200">
              <Button variant="ghost" onClick={closeReviewModal}>
                Cancel
              </Button>
              <Button
                className="bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-400 shadow-sm"
                icon={<PauseCircle className="h-4 w-4" />}
                onClick={() => handleReviewAction('on_hold')}
                loading={reviewMutation.isPending}
              >
                Hold
              </Button>
              <Button
                variant="danger"
                icon={<XCircle className="h-4 w-4" />}
                onClick={() => handleReviewAction('rejected')}
                loading={reviewMutation.isPending}
              >
                Reject
              </Button>
              <Button
                className="bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-sm"
                icon={<CheckCircle2 className="h-4 w-4" />}
                onClick={() => handleReviewAction('approved')}
                loading={reviewMutation.isPending}
              >
                Approve
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
