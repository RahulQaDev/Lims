import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Receipt,
  Plus,
  Eye,
  CreditCard,
  Mail,
  Printer,
  IndianRupee,
  AlertTriangle,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { get, post, put } from '../../services/api';
import type {
  Invoice,
  Booking,
  ApiResponse,
  PaginatedResponse,
} from '../../types';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Table, { type Column } from '../../components/ui/Table';
import SearchInput from '../../components/ui/SearchInput';
import Pagination from '../../components/ui/Pagination';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import StatCard from '../../components/ui/StatCard';
import { formatDate, formatCurrency, getStatusBadge } from '../../utils/formatters';

// ─── Local types ──────────────────────────────────────────

interface InvoiceItem {
  id: string;
  description: string;
  hsnCode?: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface InvoiceDetail extends Invoice {
  items: InvoiceItem[];
  clientAddress?: string;
  clientGstin?: string;
  clientState?: string;
  labName?: string;
  labAddress?: string;
  labGstin?: string;
  labNabl?: string;
  cgst: number;
  sgst: number;
  igst: number;
  roundOff: number;
  grandTotal: number;
  bankName?: string;
  bankAccount?: string;
  bankIfsc?: string;
  bankBranch?: string;
  payments?: PaymentRecord[];
}

interface PaymentRecord {
  id: string;
  amount: number;
  paymentMode: string;
  paymentReference?: string;
  paymentDate: string;
  createdAt: string;
}

interface InvoiceStats {
  totalRevenue: number;
  outstandingAmount: number;
  paidThisMonth: number;
  overdueCount: number;
}

interface CompletedBooking extends Booking {
  hasInvoice: boolean;
}

type InvoiceStatusTab = 'ALL' | 'DRAFT' | 'GENERATED' | 'SENT' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE';

const STATUS_TABS: { key: InvoiceStatusTab; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'DRAFT', label: 'Draft' },
  { key: 'GENERATED', label: 'Generated' },
  { key: 'SENT', label: 'Sent' },
  { key: 'PAID', label: 'Paid' },
  { key: 'PARTIALLY_PAID', label: 'Partially Paid' },
  { key: 'OVERDUE', label: 'Overdue' },
];

const STATUS_BADGE_MAP: Record<string, 'gray' | 'blue' | 'indigo' | 'green' | 'yellow' | 'red'> = {
  DRAFT: 'gray',
  GENERATED: 'blue',
  SENT: 'indigo',
  PAID: 'green',
  PARTIALLY_PAID: 'yellow',
  OVERDUE: 'red',
  CANCELLED: 'gray',
};

const PAYMENT_MODES = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'NEFT', label: 'NEFT / RTGS' },
  { value: 'UPI', label: 'UPI' },
  { value: 'CARD', label: 'Credit / Debit Card' },
];

const GST_TYPE_OPTIONS = [
  { value: 'CGST_SGST', label: 'CGST + SGST (Intra-State)' },
  { value: 'IGST', label: 'IGST (Inter-State)' },
];

// ─── Component ────────────────────────────────────────────

export default function InvoicePage() {
  const queryClient = useQueryClient();

  // List state
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatusTab>('ALL');
  const pageSize = 25;

  // Modal state
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetail | null>(null);

  // Generate invoice form
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [gstType, setGstType] = useState('CGST_SGST');
  const [discountAmount, setDiscountAmount] = useState(0);

  // Payment form
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('NEFT');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  // ─── Queries ──────────────────────────────────────────────

  const { data: invoicesData, isLoading, isError } = useQuery({
    queryKey: ['invoices', page, search, statusFilter],
    queryFn: () =>
      get<PaginatedResponse<Invoice>>('/invoices', {
        params: {
          page,
          limit: pageSize,
          search: search || undefined,
          status: statusFilter === 'ALL' ? undefined : statusFilter,
        },
      }),
  });

  const invoices = invoicesData?.data ?? [];
  const totalPages = invoicesData?.totalPages ?? 1;
  const totalItems = invoicesData?.total ?? 0;

  const { data: statsData } = useQuery({
    queryKey: ['invoice-stats'],
    queryFn: () => get<ApiResponse<InvoiceStats>>('/invoices/stats'),
  });

  const stats = statsData?.data ?? {
    totalRevenue: 0,
    outstandingAmount: 0,
    paidThisMonth: 0,
    overdueCount: 0,
  };

  const { data: completedBookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['completed-bookings-for-invoice'],
    queryFn: () =>
      get<PaginatedResponse<CompletedBooking>>('/bookings', {
        params: { status: 'COMPLETED', limit: 100 },
      }),
    enabled: generateModalOpen,
  });

  const availableBookings = (completedBookings?.data ?? []).filter((b) => !b.hasInvoice);

  // ─── Fetch invoice detail ─────────────────────────────────

  const { data: invoiceDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['invoice-detail', selectedInvoice?.id],
    queryFn: () =>
      get<ApiResponse<InvoiceDetail>>(`/invoices/${selectedInvoice!.id}`).then(
        (res) => res.data,
      ),
    enabled: !!selectedInvoice?.id && viewModalOpen,
  });

  // ─── Mutations ────────────────────────────────────────────

  const generateMutation = useMutation({
    mutationFn: (bookingId: string) =>
      post<ApiResponse<Invoice>>(`/invoices/generate/${bookingId}`, {
        gstType,
        discount: discountAmount,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      queryClient.invalidateQueries({ queryKey: ['completed-bookings-for-invoice'] });
      toast.success('Invoice generated successfully');
      closeGenerateModal();
    },
    onError: () => toast.error('Failed to generate invoice'),
  });

  const paymentMutation = useMutation({
    mutationFn: ({
      invoiceId,
      data,
    }: {
      invoiceId: string;
      data: { amount: number; paymentMode: string; paymentReference: string; paymentDate: string };
    }) => put<ApiResponse<Invoice>>(`/invoices/${invoiceId}/payment`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-detail'] });
      toast.success('Payment recorded successfully');
      closePaymentModal();
    },
    onError: () => toast.error('Failed to record payment'),
  });

  const emailMutation = useMutation({
    mutationFn: (invoiceId: string) =>
      post<ApiResponse<null>>(`/invoices/${invoiceId}/email`),
    onSuccess: () => toast.success('Invoice emailed to client'),
    onError: () => toast.error('Failed to send email'),
  });

  // ─── Handlers ─────────────────────────────────────────────

  const openGenerateModal = () => {
    setSelectedBookingId('');
    setGstType('CGST_SGST');
    setDiscountAmount(0);
    setGenerateModalOpen(true);
  };

  const closeGenerateModal = () => {
    setGenerateModalOpen(false);
    setSelectedBookingId('');
  };

  const openViewModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice as InvoiceDetail);
    setViewModalOpen(true);
  };

  const closeViewModal = () => {
    setViewModalOpen(false);
    setSelectedInvoice(null);
  };

  const openPaymentModal = () => {
    const balance = (invoiceDetail?.totalAmount ?? 0) - (invoiceDetail?.paidAmount ?? 0);
    setPaymentAmount(balance.toFixed(2));
    setPaymentMode('NEFT');
    setPaymentReference('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentModalOpen(true);
  };

  const closePaymentModal = () => {
    setPaymentModalOpen(false);
  };

  const handleGenerate = () => {
    if (!selectedBookingId) {
      toast.error('Please select a booking');
      return;
    }
    generateMutation.mutate(selectedBookingId);
  };

  const handleRecordPayment = () => {
    if (!selectedInvoice) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }
    paymentMutation.mutate({
      invoiceId: selectedInvoice.id,
      data: {
        amount,
        paymentMode,
        paymentReference,
        paymentDate,
      },
    });
  };

  const handlePrint = () => {
    window.print();
  };

  // ─── Selected booking info for generate modal ─────────────

  const selectedBooking = availableBookings.find((b) => b.id === selectedBookingId);
  const bookingSubtotal = selectedBooking?.tests?.reduce((sum, t) => sum + t.rate, 0) ?? 0;
  const discountedSubtotal = Math.max(0, bookingSubtotal - discountAmount);
  const gstRate = 0.18;
  const taxAmount = discountedSubtotal * gstRate;
  const grandTotalPreview = discountedSubtotal + taxAmount;

  // ─── Table columns ────────────────────────────────────────

  const columns: Column<Invoice>[] = [
    {
      key: 'invoiceNumber',
      header: 'Invoice No',
      sortable: true,
      render: (row) => (
        <span className="font-medium text-blue-700">{row.invoiceNumber}</span>
      ),
    },
    { key: 'clientName', header: 'Client', sortable: true },
    {
      key: 'bookingIds',
      header: 'Booking / Report',
      render: (row) => (
        <span className="text-gray-600 text-xs">
          {row.bookingIds?.length ? row.bookingIds.join(', ') : '--'}
        </span>
      ),
    },
    {
      key: 'issuedDate',
      header: 'Invoice Date',
      sortable: true,
      render: (row) => formatDate(row.issuedDate),
    },
    {
      key: 'subtotal',
      header: 'Amount',
      sortable: true,
      render: (row) => formatCurrency(row.subtotal),
    },
    {
      key: 'taxAmount',
      header: 'Tax',
      render: (row) => formatCurrency(row.taxAmount),
    },
    {
      key: 'totalAmount',
      header: 'Grand Total',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-gray-900">{formatCurrency(row.totalAmount)}</span>
      ),
    },
    {
      key: 'paidAmount',
      header: 'Paid',
      render: (row) => (
        <span className={row.paidAmount > 0 ? 'text-green-700 font-medium' : 'text-gray-500'}>
          {formatCurrency(row.paidAmount)}
        </span>
      ),
    },
    {
      key: 'balance',
      header: 'Balance',
      render: (row) => {
        const balance = row.totalAmount - row.paidAmount;
        return (
          <span className={balance > 0 ? 'text-red-600 font-medium' : 'text-green-700'}>
            {formatCurrency(balance)}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={STATUS_BADGE_MAP[row.status] ?? 'gray'}>
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
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </button>
        </div>
      ),
    },
  ];

  // ─── Render ───────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoicing & Billing</h1>
          <p className="text-sm text-gray-500 mt-1">
            Generate invoices, record payments and track outstanding amounts
          </p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={openGenerateModal}>
          Generate Invoice
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Total Revenue (This Month)"
          value={formatCurrency(stats.totalRevenue)}
          color="green"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Outstanding Amount"
          value={formatCurrency(stats.outstandingAmount)}
          color="orange"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Paid This Month"
          value={formatCurrency(stats.paidThisMonth)}
          color="blue"
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Overdue Invoices"
          value={stats.overdueCount}
          color="red"
        />
      </div>

      {/* Filter Tabs & Table */}
      <Card noPadding>
        {/* Tabs */}
        <div className="flex items-center gap-1 px-4 pt-4 pb-2 overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setStatusFilter(tab.key);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                statusFilter === tab.key
                  ? 'bg-blue-100 text-blue-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100">
          <SearchInput
            onSearch={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Search by invoice number, client name..."
            className="w-96"
          />
        </div>

        {isLoading ? (
          <Loader text="Loading invoices..." />
        ) : isError ? (
          <EmptyState
            title="Failed to load invoices"
            description="There was an error loading the invoice list. The API server may not be running."
            icon={<AlertTriangle className="h-8 w-8 text-gray-400" />}
          />
        ) : invoices.length === 0 ? (
          <EmptyState
            title="No invoices found"
            description={
              search || statusFilter !== 'ALL'
                ? 'Try adjusting your search or filter criteria.'
                : 'No invoices have been generated yet. Click "Generate Invoice" to create one.'
            }
            icon={<Receipt className="h-8 w-8 text-gray-400" />}
          />
        ) : (
          <>
            <Table
              columns={columns}
              data={invoices}
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

      {/* ─── Generate Invoice Modal ──────────────────────────── */}
      <Modal
        isOpen={generateModalOpen}
        onClose={closeGenerateModal}
        title="Generate Invoice"
        size="lg"
      >
        <div className="space-y-5">
          {/* Booking selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Completed Booking
            </label>
            {bookingsLoading ? (
              <Loader text="Loading bookings..." />
            ) : availableBookings.length === 0 ? (
              <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                No completed bookings without invoices found.
              </p>
            ) : (
              <Select
                options={availableBookings.map((b) => ({
                  value: b.id,
                  label: `${b.bookingCode} - ${b.clientName} (${formatCurrency(b.netAmount)})`,
                }))}
                value={selectedBookingId}
                onChange={(e) => setSelectedBookingId(e.target.value)}
                placeholder="Select a booking..."
              />
            )}
          </div>

          {/* Test-wise breakdown */}
          {selectedBooking && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Test-wise Pricing</h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Test Name</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Department</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Rate (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedBooking.tests.map((t) => (
                      <tr key={t.id}>
                        <td className="px-4 py-2 text-sm text-gray-900">{t.testName}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{t.departmentName}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(t.rate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* GST Type */}
          <Select
            label="GST Type"
            options={GST_TYPE_OPTIONS}
            value={gstType}
            onChange={(e) => setGstType(e.target.value)}
          />

          {/* Discount */}
          <Input
            label="Discount (INR)"
            type="number"
            min={0}
            value={discountAmount || ''}
            onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
            placeholder="0.00"
          />

          {/* Totals Preview */}
          {selectedBooking && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(bookingSubtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-medium text-red-600">- {formatCurrency(discountAmount)}</span>
                </div>
              )}
              {gstType === 'CGST_SGST' ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">CGST (9%)</span>
                    <span>{formatCurrency(taxAmount / 2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">SGST (9%)</span>
                    <span>{formatCurrency(taxAmount / 2)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IGST (18%)</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-semibold pt-2 border-t border-gray-200">
                <span>Grand Total</span>
                <span>{formatCurrency(grandTotalPreview)}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={closeGenerateModal}>
              Cancel
            </Button>
            <Button
              icon={<FileText className="h-4 w-4" />}
              onClick={handleGenerate}
              loading={generateMutation.isPending}
              disabled={!selectedBookingId}
            >
              Generate Invoice
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── View Invoice Modal ──────────────────────────────── */}
      <Modal
        isOpen={viewModalOpen}
        onClose={closeViewModal}
        title="Invoice Details"
        size="xl"
      >
        {detailLoading ? (
          <Loader text="Loading invoice..." />
        ) : !invoiceDetail && !selectedInvoice ? (
          <EmptyState
            title="No data available"
            description="Unable to load invoice details."
            icon={<Receipt className="h-8 w-8 text-gray-400" />}
          />
        ) : (
          <div className="space-y-6 print:space-y-4" id="invoice-print-area">
            {/* Lab Header */}
            <div className="border-b border-gray-200 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {invoiceDetail?.labName ?? 'Laboratory Name'}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {invoiceDetail?.labAddress ?? 'Lab Address'}
                  </p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    {invoiceDetail?.labGstin && <span>GSTIN: {invoiceDetail.labGstin}</span>}
                    {invoiceDetail?.labNabl && <span>NABL: {invoiceDetail.labNabl}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <h3 className="text-lg font-bold text-blue-700">TAX INVOICE</h3>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {selectedInvoice?.invoiceNumber}
                  </p>
                </div>
              </div>
            </div>

            {/* Client + Invoice meta */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Bill To</h4>
                <p className="text-sm font-semibold text-gray-900">
                  {selectedInvoice?.clientName}
                </p>
                {invoiceDetail?.clientAddress && (
                  <p className="text-sm text-gray-600">{invoiceDetail.clientAddress}</p>
                )}
                {invoiceDetail?.clientGstin && (
                  <p className="text-xs text-gray-500 mt-1">GSTIN: {invoiceDetail.clientGstin}</p>
                )}
              </div>
              <div className="text-right space-y-1">
                <div className="text-sm">
                  <span className="text-gray-500">Invoice Date: </span>
                  <span className="font-medium">{formatDate(selectedInvoice?.issuedDate)}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Due Date: </span>
                  <span className="font-medium">{formatDate(selectedInvoice?.dueDate)}</span>
                </div>
                <div className="mt-2">
                  <Badge variant={STATUS_BADGE_MAP[selectedInvoice?.status ?? 'DRAFT'] ?? 'gray'}>
                    {getStatusBadge(selectedInvoice?.status ?? 'DRAFT')}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Items table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase w-12">Sr</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">HSN</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Rate</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(invoiceDetail?.items ?? []).map((item, idx) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 text-sm text-gray-600">{idx + 1}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{item.description}</td>
                      <td className="px-4 py-2 text-sm text-gray-600">{item.hsnCode || '--'}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-right">{item.quantity}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-right">{formatCurrency(item.rate)}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                  {(invoiceDetail?.items ?? []).length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                        No items
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-72 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatCurrency(selectedInvoice?.subtotal)}</span>
                </div>
                {(invoiceDetail?.discount ?? selectedInvoice?.discount ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount</span>
                    <span className="text-red-600">- {formatCurrency(invoiceDetail?.discount ?? selectedInvoice?.discount)}</span>
                  </div>
                )}
                {(invoiceDetail?.cgst ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">CGST (9%)</span>
                    <span>{formatCurrency(invoiceDetail?.cgst)}</span>
                  </div>
                )}
                {(invoiceDetail?.sgst ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">SGST (9%)</span>
                    <span>{formatCurrency(invoiceDetail?.sgst)}</span>
                  </div>
                )}
                {(invoiceDetail?.igst ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">IGST (18%)</span>
                    <span>{formatCurrency(invoiceDetail?.igst)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Tax</span>
                  <span>{formatCurrency(selectedInvoice?.taxAmount)}</span>
                </div>
                {(invoiceDetail?.roundOff ?? 0) !== 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Round Off</span>
                    <span>{formatCurrency(invoiceDetail?.roundOff)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-300">
                  <span>Grand Total</span>
                  <span>{formatCurrency(invoiceDetail?.grandTotal ?? selectedInvoice?.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Payment status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Payment Status</p>
                  <div className="flex gap-6 mt-1">
                    <span className="text-sm text-gray-600">
                      Paid: <span className="font-medium text-green-700">{formatCurrency(selectedInvoice?.paidAmount)}</span>
                    </span>
                    <span className="text-sm text-gray-600">
                      Balance:{' '}
                      <span className="font-medium text-red-600">
                        {formatCurrency((selectedInvoice?.totalAmount ?? 0) - (selectedInvoice?.paidAmount ?? 0))}
                      </span>
                    </span>
                  </div>
                </div>
                <Badge variant={STATUS_BADGE_MAP[selectedInvoice?.status ?? 'DRAFT'] ?? 'gray'}>
                  {getStatusBadge(selectedInvoice?.status ?? 'DRAFT')}
                </Badge>
              </div>

              {/* Payment history */}
              {invoiceDetail?.payments && invoiceDetail.payments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Payment History</p>
                  <div className="space-y-1.5">
                    {invoiceDetail.payments.map((p) => (
                      <div key={p.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {formatDate(p.paymentDate)} - {p.paymentMode}
                          {p.paymentReference ? ` (${p.paymentReference})` : ''}
                        </span>
                        <span className="font-medium text-green-700">{formatCurrency(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bank details */}
            {invoiceDetail?.bankName && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Bank Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Bank: </span>
                    <span className="text-gray-900">{invoiceDetail.bankName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">A/C No: </span>
                    <span className="text-gray-900">{invoiceDetail.bankAccount}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">IFSC: </span>
                    <span className="text-gray-900">{invoiceDetail.bankIfsc}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Branch: </span>
                    <span className="text-gray-900">{invoiceDetail.bankBranch}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200 print:hidden">
              <Button variant="ghost" onClick={closeViewModal}>
                Close
              </Button>
              {selectedInvoice?.status !== 'PAID' && selectedInvoice?.status !== 'CANCELLED' && (
                <Button
                  variant="outline"
                  icon={<CreditCard className="h-4 w-4" />}
                  onClick={openPaymentModal}
                >
                  Record Payment
                </Button>
              )}
              <Button
                variant="outline"
                icon={<Mail className="h-4 w-4" />}
                onClick={() => selectedInvoice && emailMutation.mutate(selectedInvoice.id)}
                loading={emailMutation.isPending}
              >
                Email Invoice
              </Button>
              <Button
                variant="outline"
                icon={<Printer className="h-4 w-4" />}
                onClick={handlePrint}
              >
                Print
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Record Payment Modal ────────────────────────────── */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={closePaymentModal}
        title="Record Payment"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Invoice</span>
              <span className="font-medium">{selectedInvoice?.invoiceNumber}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600">Outstanding Balance</span>
              <span className="font-semibold text-red-600">
                {formatCurrency((selectedInvoice?.totalAmount ?? 0) - (selectedInvoice?.paidAmount ?? 0))}
              </span>
            </div>
          </div>

          <Input
            label="Payment Amount (INR)"
            type="number"
            min={0}
            step="0.01"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            icon={<IndianRupee className="h-4 w-4" />}
          />

          <Select
            label="Payment Mode"
            options={PAYMENT_MODES}
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
          />

          <Input
            label="Payment Reference"
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
            placeholder="Transaction ID, Cheque No, etc."
          />

          <Input
            label="Payment Date"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={closePaymentModal}>
              Cancel
            </Button>
            <Button
              icon={<CreditCard className="h-4 w-4" />}
              onClick={handleRecordPayment}
              loading={paymentMutation.isPending}
            >
              Record Payment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
