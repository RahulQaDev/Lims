import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FlaskConical,
  MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { get, post } from '../../services/api';
import type {
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
import { formatDate, getStatusBadge } from '../../utils/formatters';

// ─── Types ───────────────────────────────────────────────
interface PendingApprovalItem {
  id: string;
  resultId: string;
  sampleCode: string;
  clientName: string;
  testName: string;
  departmentName: string;
  analystName: string;
  reviewerName: string;
  reviewedAt: string;
  reviewRemarks?: string;
  priority: string;
  status: string;
  bookingTestId: string;
}

interface ApprovalResultDetail {
  id: string;
  bookingTestId: string;
  testName: string;
  sampleCode: string;
  clientName?: string;
  departmentName: string;
  analystName: string;
  reviewerName?: string;
  reviewRemarks?: string;
  reviewedAt?: string;
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

export default function ApprovalPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<PendingApprovalItem | null>(null);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [remarksError, setRemarksError] = useState('');

  const pageSize = 25;

  // ─── Fetch pending approval list ───────────────────────
  const { data, isLoading, isError } = useQuery({
    queryKey: ['reviews-pending-approval', page, search],
    queryFn: () =>
      get<PaginatedResponse<PendingApprovalItem>>('/reviews/pending-approval', {
        params: { page, limit: pageSize, search },
      }),
  });

  const items = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.total ?? 0;

  // ─── Fetch result detail for approval ──────────────────
  const {
    data: resultDetail,
    isLoading: detailLoading,
  } = useQuery({
    queryKey: ['approval-detail', selectedItem?.bookingTestId],
    queryFn: () =>
      get<ApiResponse<ApprovalResultDetail>>(
        `/results/booking-test/${selectedItem!.bookingTestId}`,
      ).then((res) => res.data),
    enabled: !!selectedItem?.bookingTestId && approvalModalOpen,
  });

  // ─── Approval mutation ─────────────────────────────────
  const approvalMutation = useMutation({
    mutationFn: ({
      resultId,
      status,
      remarks: approvalRemarks,
    }: {
      resultId: string;
      status: 'approved' | 'rejected';
      remarks: string;
    }) =>
      post<ApiResponse<null>>(`/reviews/${resultId}/approve`, {
        status,
        remarks: approvalRemarks,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews-pending-approval'] });
      const msg =
        variables.status === 'approved'
          ? 'Result approved and signed off successfully'
          : 'Result rejected and returned for re-analysis';
      toast.success(msg);
      closeApprovalModal();
    },
    onError: () => toast.error('Failed to submit approval'),
  });

  const openApproval = (item: PendingApprovalItem) => {
    setSelectedItem(item);
    setRemarks('');
    setRemarksError('');
    setApprovalModalOpen(true);
  };

  const closeApprovalModal = () => {
    setApprovalModalOpen(false);
    setSelectedItem(null);
    setRemarks('');
    setRemarksError('');
  };

  const handleApprovalAction = (status: 'approved' | 'rejected') => {
    if (status === 'rejected' && !remarks.trim()) {
      setRemarksError('Remarks are required when rejecting a result');
      return;
    }
    if (!selectedItem) return;
    approvalMutation.mutate({
      resultId: selectedItem.resultId,
      status,
      remarks: remarks.trim(),
    });
  };

  // ─── Table columns ─────────────────────────────────────
  const columns: Column<PendingApprovalItem>[] = [
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
    { key: 'reviewerName', header: 'Reviewed By' },
    {
      key: 'reviewedAt',
      header: 'Reviewed Date',
      sortable: true,
      render: (row) => formatDate(row.reviewedAt),
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
              openApproval(row);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            Approve
          </button>
        </div>
      ),
    },
  ];

  // ─── Parameter columns ─────────────────────────────────
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

  const failedCount =
    resultDetail?.parameters?.filter((p) => p.isCompliant === false).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Final Approval</h1>
            <p className="text-sm text-gray-500 mt-1">
              Level 3 final sign-off for reviewed results
            </p>
          </div>
          {totalItems > 0 && (
            <Badge variant="green">{totalItems} pending</Badge>
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
          <Loader text="Loading pending approvals..." />
        ) : isError ? (
          <EmptyState
            title="Failed to load approvals"
            description="There was an error loading the pending approval list. The API server may not be running."
            icon={<AlertTriangle className="h-8 w-8 text-gray-400" />}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="No results pending approval"
            description={
              search
                ? 'Try adjusting your search criteria'
                : 'All reviewed results have been approved. Check back later.'
            }
            icon={<ShieldCheck className="h-8 w-8 text-gray-400" />}
          />
        ) : (
          <>
            <Table
              columns={columns}
              data={items}
              keyExtractor={(row) => row.id}
              onRowClick={openApproval}
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

      {/* Approval Detail Modal */}
      <Modal
        isOpen={approvalModalOpen}
        onClose={closeApprovalModal}
        title="Final Approval"
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
                  compliance check. Please review carefully before final approval.
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

            {/* Reviewer remarks from Level 2 */}
            {(selectedItem?.reviewRemarks || resultDetail.reviewRemarks) && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  <h4 className="text-sm font-semibold text-blue-900">
                    Reviewer Remarks (Level 2)
                  </h4>
                  {(selectedItem?.reviewerName || resultDetail.reviewerName) && (
                    <span className="text-xs text-blue-600">
                      by {selectedItem?.reviewerName || resultDetail.reviewerName}
                      {(selectedItem?.reviewedAt || resultDetail.reviewedAt) &&
                        ` on ${formatDate(selectedItem?.reviewedAt || resultDetail.reviewedAt)}`}
                    </span>
                  )}
                </div>
                <p className="text-sm text-blue-800">
                  {selectedItem?.reviewRemarks || resultDetail.reviewRemarks}
                </p>
              </div>
            )}

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

            {/* Approver remarks */}
            <div>
              <label
                htmlFor="approver-remarks"
                className="block text-sm font-semibold text-gray-900 mb-1"
              >
                Approver Remarks
              </label>
              <textarea
                id="approver-remarks"
                rows={3}
                className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  remarksError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter your approval remarks..."
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
              <Button variant="ghost" onClick={closeApprovalModal}>
                Cancel
              </Button>
              <Button
                variant="danger"
                icon={<XCircle className="h-4 w-4" />}
                onClick={() => handleApprovalAction('rejected')}
                loading={approvalMutation.isPending}
              >
                Reject
              </Button>
              <Button
                className="bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-sm"
                icon={<CheckCircle2 className="h-4 w-4" />}
                onClick={() => handleApprovalAction('approved')}
                loading={approvalMutation.isPending}
              >
                Approve &amp; Sign
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
