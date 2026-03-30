import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Printer,
  CheckCircle2,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { get, post } from '../../services/api';
import type { ApiResponse, PaginatedResponse } from '../../types';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import SearchInput from '../../components/ui/SearchInput';
import Pagination from '../../components/ui/Pagination';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate } from '../../utils/formatters';

// ─── Types ────────────────────────────────────────────────
interface PrintQueueItem {
  id: string;
  coaNumber: string;
  clientName: string;
  sampleCode: string;
  generatedAt: string;
  pages: number;
  isPrinted: boolean;
  printedAt?: string;
  printCount: number;
}

type FilterStatus = 'ALL' | 'NOT_PRINTED' | 'PRINTED';

export default function PrintingQueuePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('NOT_PRINTED');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const pageSize = 25;

  // ─── Fetch print queue ──────────────────────────────────
  const { data, isLoading, isError } = useQuery({
    queryKey: ['print-queue', page, search, filterStatus],
    queryFn: () =>
      get<PaginatedResponse<PrintQueueItem>>('/coa/print-queue', {
        params: {
          page,
          limit: pageSize,
          search,
          ...(filterStatus !== 'ALL' && {
            isPrinted: filterStatus === 'PRINTED',
          }),
        },
      }),
  });

  const items = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.total ?? 0;

  // ─── Derived state ─────────────────────────────────────
  const allSelected = useMemo(
    () => items.length > 0 && items.every((item) => selectedIds.has(item.id)),
    [items, selectedIds],
  );

  const selectedCount = selectedIds.size;

  // ─── Print mutation ─────────────────────────────────────
  const printMutation = useMutation({
    mutationFn: (coaIds: string[]) =>
      post<ApiResponse<null>>('/coa/print', { coaIds }),
    onSuccess: () => {
      toast.success(`${selectedCount} certificate(s) sent to print`);
      setSelectedIds(new Set());
    },
    onError: () => toast.error('Failed to print certificates'),
  });

  // ─── Mark as printed mutation ───────────────────────────
  const markPrintedMutation = useMutation({
    mutationFn: (coaIds: string[]) =>
      post<ApiResponse<null>>('/coa/mark-printed', { coaIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['print-queue'] });
      toast.success(`${selectedCount} certificate(s) marked as printed`);
      setSelectedIds(new Set());
    },
    onError: () => toast.error('Failed to update print status'),
  });

  // ─── Selection handlers ─────────────────────────────────
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((item) => item.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handlePrintSelected = () => {
    if (selectedCount === 0) {
      toast.error('Select at least one certificate to print');
      return;
    }
    printMutation.mutate(Array.from(selectedIds));
  };

  const handleMarkAsPrinted = () => {
    if (selectedCount === 0) {
      toast.error('Select at least one certificate');
      return;
    }
    markPrintedMutation.mutate(Array.from(selectedIds));
  };

  // ─── Filter tabs ────────────────────────────────────────
  const tabs: { key: FilterStatus; label: string }[] = [
    { key: 'NOT_PRINTED', label: 'Not Printed' },
    { key: 'PRINTED', label: 'Printed' },
    { key: 'ALL', label: 'All' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Printing Queue</h1>
          <p className="text-sm text-gray-500 mt-1">
            Batch print certificates of analysis
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedCount > 0 && (
            <span className="text-sm text-gray-600">
              {selectedCount} selected
            </span>
          )}
          <Button
            variant="outline"
            icon={<CheckCircle2 className="h-4 w-4" />}
            onClick={handleMarkAsPrinted}
            disabled={selectedCount === 0}
            loading={markPrintedMutation.isPending}
          >
            Mark as Printed
          </Button>
          <Button
            icon={<Printer className="h-4 w-4" />}
            onClick={handlePrintSelected}
            disabled={selectedCount === 0}
            loading={printMutation.isPending}
          >
            Print Selected
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card noPadding>
        <div className="flex items-center justify-between gap-4 p-4 border-b border-gray-100">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setFilterStatus(tab.key);
                  setPage(1);
                  setSelectedIds(new Set());
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  filterStatus === tab.key
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
          <Loader text="Loading print queue..." />
        ) : isError ? (
          <EmptyState
            title="Failed to load print queue"
            description="There was an error loading the printing queue. The API server may not be running."
            icon={<AlertTriangle className="h-8 w-8 text-gray-400" />}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="No certificates in queue"
            description={
              search
                ? 'Try adjusting your search criteria'
                : 'No certificates are waiting to be printed.'
            }
            icon={<FileText className="h-8 w-8 text-gray-400" />}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Report Number
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Sample Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Generated Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Pages
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Print Count
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        selectedIds.has(item.id)
                          ? 'bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={() => toggleSelect(item.id)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {item.coaNumber}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {item.clientName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {item.sampleCode}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {formatDate(item.generatedAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {item.pages || 1}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        {item.isPrinted ? (
                          <Badge variant="green">Printed</Badge>
                        ) : (
                          <Badge variant="yellow">Not Printed</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {item.printCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 border-t border-gray-100">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={(p) => {
                  setPage(p);
                  setSelectedIds(new Set());
                }}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
