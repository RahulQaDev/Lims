import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ExternalLink,
  Plus,
  Send,
  ClipboardCheck,
  Building2,
  AlertTriangle,
  Calendar,
  IndianRupee,
  XCircle,
  Phone,
  Mail,
  Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { get, post, put } from '../../services/api';
import type { ApiResponse, PaginatedResponse } from '../../types';
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
import { formatDate, formatCurrency, getStatusBadge } from '../../utils/formatters';

// ─── Local types ──────────────────────────────────────────

interface OutsourceRecord {
  id: string;
  sampleCode: string;
  sampleName?: string;
  testName: string;
  bookingTestId: string;
  externalLabId: string;
  externalLabName: string;
  sentDate: string;
  receivedDate?: string;
  expectedCost: number;
  actualCost?: number;
  status: 'SENT' | 'RECEIVED' | 'CANCELLED';
  resultValue?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

interface ExternalLab {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  nablNumber?: string;
  specializations?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PendingBookingTest {
  id: string;
  bookingId: string;
  bookingCode: string;
  sampleCode: string;
  testName: string;
  clientName: string;
  testingType: string;
}

const STATUS_BADGE_MAP: Record<string, 'blue' | 'green' | 'gray' | 'red'> = {
  SENT: 'blue',
  RECEIVED: 'green',
  CANCELLED: 'gray',
};

// ─── Component ────────────────────────────────────────────

export default function OutsourcePage() {
  const queryClient = useQueryClient();

  // List state
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SENT' | 'RECEIVED' | 'CANCELLED'>('ALL');
  const pageSize = 25;

  // View mode
  const [viewMode, setViewMode] = useState<'records' | 'labs'>('records');

  // Send modal
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState('');
  const [selectedLabId, setSelectedLabId] = useState('');
  const [expectedCost, setExpectedCost] = useState('');
  const [sentDate, setSentDate] = useState(new Date().toISOString().split('T')[0]);
  const [sendRemarks, setSendRemarks] = useState('');

  // Add lab modal
  const [addLabModalOpen, setAddLabModalOpen] = useState(false);
  const [newLabName, setNewLabName] = useState('');
  const [newLabContact, setNewLabContact] = useState('');
  const [newLabEmail, setNewLabEmail] = useState('');
  const [newLabPhone, setNewLabPhone] = useState('');
  const [newLabAddress, setNewLabAddress] = useState('');
  const [newLabNabl, setNewLabNabl] = useState('');

  // Record results modal
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<OutsourceRecord | null>(null);
  const [resultValue, setResultValue] = useState('');
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [actualCost, setActualCost] = useState('');
  const [resultRemarks, setResultRemarks] = useState('');

  // ─── Queries ──────────────────────────────────────────────

  const { data: recordsData, isLoading, isError } = useQuery({
    queryKey: ['outsource-records', page, search, statusFilter],
    queryFn: () =>
      get<PaginatedResponse<OutsourceRecord>>('/outsource', {
        params: {
          page,
          limit: pageSize,
          search: search || undefined,
          status: statusFilter === 'ALL' ? undefined : statusFilter,
        },
      }),
  });

  const records = recordsData?.data ?? [];
  const totalPages = recordsData?.totalPages ?? 1;
  const totalItems = recordsData?.total ?? 0;

  const { data: labsData, isLoading: labsLoading } = useQuery({
    queryKey: ['external-labs'],
    queryFn: () =>
      get<PaginatedResponse<ExternalLab>>('/outsource/labs', {
        params: { limit: 200 },
      }),
  });

  const labs = labsData?.data ?? [];

  const { data: pendingTestsData, isLoading: testsLoading } = useQuery({
    queryKey: ['pending-outsource-tests'],
    queryFn: () =>
      get<ApiResponse<PendingBookingTest[]>>('/outsource/pending-tests').then(
        (res) => res.data,
      ),
    enabled: sendModalOpen,
  });

  const pendingTests = pendingTestsData ?? [];

  // ─── Mutations ────────────────────────────────────────────

  const sendMutation = useMutation({
    mutationFn: (data: {
      bookingTestId: string;
      externalLabId: string;
      expectedCost: number;
      sentDate: string;
      remarks?: string;
    }) => post<ApiResponse<OutsourceRecord>>('/outsource/send', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outsource-records'] });
      queryClient.invalidateQueries({ queryKey: ['pending-outsource-tests'] });
      toast.success('Sample sent to external lab');
      closeSendModal();
    },
    onError: () => toast.error('Failed to send to external lab'),
  });

  const addLabMutation = useMutation({
    mutationFn: (data: {
      name: string;
      contactPerson: string;
      email: string;
      phone: string;
      address: string;
      nablNumber?: string;
    }) => post<ApiResponse<ExternalLab>>('/outsource/labs', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external-labs'] });
      toast.success('External lab added successfully');
      closeAddLabModal();
    },
    onError: () => toast.error('Failed to add external lab'),
  });

  const recordResultMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        resultValue: string;
        receivedDate: string;
        actualCost?: number;
        remarks?: string;
      };
    }) => put<ApiResponse<OutsourceRecord>>(`/outsource/${id}/results`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outsource-records'] });
      toast.success('Results recorded successfully');
      closeResultModal();
    },
    onError: () => toast.error('Failed to record results'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) =>
      put<ApiResponse<OutsourceRecord>>(`/outsource/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outsource-records'] });
      toast.success('Outsource record cancelled');
    },
    onError: () => toast.error('Failed to cancel'),
  });

  // ─── Handlers ─────────────────────────────────────────────

  const openSendModal = () => {
    setSelectedTestId('');
    setSelectedLabId('');
    setExpectedCost('');
    setSentDate(new Date().toISOString().split('T')[0]);
    setSendRemarks('');
    setSendModalOpen(true);
  };

  const closeSendModal = () => {
    setSendModalOpen(false);
  };

  const openAddLabModal = () => {
    setNewLabName('');
    setNewLabContact('');
    setNewLabEmail('');
    setNewLabPhone('');
    setNewLabAddress('');
    setNewLabNabl('');
    setAddLabModalOpen(true);
  };

  const closeAddLabModal = () => {
    setAddLabModalOpen(false);
  };

  const openResultModal = (record: OutsourceRecord) => {
    setSelectedRecord(record);
    setResultValue(record.resultValue ?? '');
    setReceivedDate(record.receivedDate ?? new Date().toISOString().split('T')[0]);
    setActualCost(record.actualCost?.toString() ?? record.expectedCost.toString());
    setResultRemarks(record.remarks ?? '');
    setResultModalOpen(true);
  };

  const closeResultModal = () => {
    setResultModalOpen(false);
    setSelectedRecord(null);
  };

  const handleSend = () => {
    if (!selectedTestId) {
      toast.error('Please select a test');
      return;
    }
    if (!selectedLabId) {
      toast.error('Please select an external lab');
      return;
    }
    const cost = parseFloat(expectedCost);
    if (isNaN(cost) || cost < 0) {
      toast.error('Please enter a valid cost');
      return;
    }
    sendMutation.mutate({
      bookingTestId: selectedTestId,
      externalLabId: selectedLabId,
      expectedCost: cost,
      sentDate,
      remarks: sendRemarks || undefined,
    });
  };

  const handleAddLab = () => {
    if (!newLabName.trim()) {
      toast.error('Lab name is required');
      return;
    }
    if (!newLabContact.trim()) {
      toast.error('Contact person is required');
      return;
    }
    addLabMutation.mutate({
      name: newLabName.trim(),
      contactPerson: newLabContact.trim(),
      email: newLabEmail.trim(),
      phone: newLabPhone.trim(),
      address: newLabAddress.trim(),
      nablNumber: newLabNabl.trim() || undefined,
    });
  };

  const handleRecordResult = () => {
    if (!selectedRecord) return;
    if (!resultValue.trim()) {
      toast.error('Please enter the result value');
      return;
    }
    recordResultMutation.mutate({
      id: selectedRecord.id,
      data: {
        resultValue: resultValue.trim(),
        receivedDate,
        actualCost: actualCost ? parseFloat(actualCost) : undefined,
        remarks: resultRemarks || undefined,
      },
    });
  };

  // ─── Table columns ───────────────────────────────────────

  const recordColumns: Column<OutsourceRecord>[] = [
    {
      key: 'sampleCode',
      header: 'Sample Code',
      sortable: true,
      render: (row) => (
        <span className="font-medium text-gray-900">{row.sampleCode}</span>
      ),
    },
    { key: 'testName', header: 'Test Name', sortable: true },
    { key: 'externalLabName', header: 'External Lab', sortable: true },
    {
      key: 'sentDate',
      header: 'Sent Date',
      sortable: true,
      render: (row) => formatDate(row.sentDate),
    },
    {
      key: 'receivedDate',
      header: 'Received Date',
      render: (row) => formatDate(row.receivedDate),
    },
    {
      key: 'expectedCost',
      header: 'Cost',
      render: (row) => (
        <span>
          {formatCurrency(row.actualCost ?? row.expectedCost)}
          {row.actualCost && row.actualCost !== row.expectedCost && (
            <span className="text-xs text-gray-400 ml-1 line-through">
              {formatCurrency(row.expectedCost)}
            </span>
          )}
        </span>
      ),
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
          {row.status === 'SENT' && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openResultModal(row);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
              >
                <ClipboardCheck className="h-3.5 w-3.5" />
                Record Results
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  cancelMutation.mutate(row.id);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
              >
                <XCircle className="h-3.5 w-3.5" />
                Cancel
              </button>
            </>
          )}
          {row.status === 'RECEIVED' && row.resultValue && (
            <span className="text-xs text-gray-500">Result: {row.resultValue}</span>
          )}
        </div>
      ),
    },
  ];

  const labColumns: Column<ExternalLab>[] = [
    {
      key: 'name',
      header: 'Lab Name',
      sortable: true,
      render: (row) => (
        <span className="font-medium text-gray-900">{row.name}</span>
      ),
    },
    { key: 'contactPerson', header: 'Contact Person' },
    {
      key: 'phone',
      header: 'Phone',
      render: (row) => (
        <span className="flex items-center gap-1 text-gray-600">
          <Phone className="h-3.5 w-3.5" />
          {row.phone || '--'}
        </span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (row) => (
        <span className="flex items-center gap-1 text-gray-600">
          <Mail className="h-3.5 w-3.5" />
          {row.email || '--'}
        </span>
      ),
    },
    {
      key: 'nablNumber',
      header: 'NABL No',
      render: (row) =>
        row.nablNumber ? (
          <span className="flex items-center gap-1 text-teal-700">
            <Shield className="h-3.5 w-3.5" />
            {row.nablNumber}
          </span>
        ) : (
          <span className="text-gray-400">--</span>
        ),
    },
    {
      key: 'specializations',
      header: 'Specializations',
      render: (row) => (
        <span className="text-sm text-gray-600">{row.specializations || '--'}</span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row) => (
        <Badge variant={row.isActive ? 'green' : 'gray'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  // ─── Render ───────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Outsource Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage outsourced tests to external laboratories
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" icon={<Building2 className="h-4 w-4" />} onClick={openAddLabModal}>
            Add External Lab
          </Button>
          <Button icon={<Send className="h-4 w-4" />} onClick={openSendModal}>
            Send to External Lab
          </Button>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex gap-1">
        <button
          onClick={() => setViewMode('records')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            viewMode === 'records'
              ? 'bg-blue-100 text-blue-800'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Outsource Records
          </span>
        </button>
        <button
          onClick={() => setViewMode('labs')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            viewMode === 'labs'
              ? 'bg-blue-100 text-blue-800'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <span className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Lab Directory
          </span>
        </button>
      </div>

      {/* ─── Records View ──────────────────────────────────── */}
      {viewMode === 'records' && (
        <Card noPadding>
          {/* Status filter tabs */}
          <div className="flex items-center gap-1 px-4 pt-4 pb-2">
            {(['ALL', 'SENT', 'RECEIVED', 'CANCELLED'] as const).map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(s);
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                  statusFilter === s
                    ? 'bg-blue-100 text-blue-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {s === 'ALL' ? 'All' : getStatusBadge(s)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100">
            <SearchInput
              onSearch={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder="Search by sample code, test, lab name..."
              className="w-96"
            />
          </div>

          {isLoading ? (
            <Loader text="Loading outsource records..." />
          ) : isError ? (
            <EmptyState
              title="Failed to load records"
              description="There was an error loading the outsource records. The API server may not be running."
              icon={<AlertTriangle className="h-8 w-8 text-gray-400" />}
            />
          ) : records.length === 0 ? (
            <EmptyState
              title="No outsource records found"
              description={
                search || statusFilter !== 'ALL'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No tests have been sent to external labs yet.'
              }
              icon={<ExternalLink className="h-8 w-8 text-gray-400" />}
            />
          ) : (
            <>
              <Table
                columns={recordColumns}
                data={records}
                keyExtractor={(row) => row.id}
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
      )}

      {/* ─── Lab Directory View ────────────────────────────── */}
      {viewMode === 'labs' && (
        <Card noPadding>
          {labsLoading ? (
            <Loader text="Loading external labs..." />
          ) : labs.length === 0 ? (
            <EmptyState
              title="No external labs"
              description="No external labs have been added yet. Click 'Add External Lab' to add one."
              icon={<Building2 className="h-8 w-8 text-gray-400" />}
              action={
                <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={openAddLabModal}>
                  Add Lab
                </Button>
              }
            />
          ) : (
            <Table
              columns={labColumns}
              data={labs}
              keyExtractor={(row) => row.id}
            />
          )}
        </Card>
      )}

      {/* ─── Send to External Lab Modal ──────────────────────── */}
      <Modal
        isOpen={sendModalOpen}
        onClose={closeSendModal}
        title="Send to External Lab"
        size="lg"
      >
        <div className="space-y-4">
          {/* Test selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Test to Outsource
            </label>
            {testsLoading ? (
              <Loader text="Loading pending tests..." />
            ) : pendingTests.length === 0 ? (
              <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                No pending tests available for outsourcing.
              </p>
            ) : (
              <Select
                options={pendingTests.map((t) => ({
                  value: t.id,
                  label: `${t.sampleCode} - ${t.testName} (${t.clientName})`,
                }))}
                value={selectedTestId}
                onChange={(e) => setSelectedTestId(e.target.value)}
                placeholder="Select a test..."
              />
            )}
          </div>

          {/* Lab selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                External Lab
              </label>
              <button
                onClick={() => {
                  closeSendModal();
                  openAddLabModal();
                }}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add New Lab
              </button>
            </div>
            <Select
              options={labs.filter((l) => l.isActive).map((l) => ({
                value: l.id,
                label: `${l.name}${l.nablNumber ? ` (NABL: ${l.nablNumber})` : ''}`,
              }))}
              value={selectedLabId}
              onChange={(e) => setSelectedLabId(e.target.value)}
              placeholder="Select an external lab..."
            />
          </div>

          {/* Cost */}
          <Input
            label="Expected Cost (INR)"
            type="number"
            min={0}
            step="0.01"
            value={expectedCost}
            onChange={(e) => setExpectedCost(e.target.value)}
            icon={<IndianRupee className="h-4 w-4" />}
            placeholder="0.00"
          />

          {/* Sent date */}
          <Input
            label="Sent Date"
            type="date"
            value={sentDate}
            onChange={(e) => setSentDate(e.target.value)}
            icon={<Calendar className="h-4 w-4" />}
          />

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remarks
            </label>
            <textarea
              rows={3}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Any special instructions or notes..."
              value={sendRemarks}
              onChange={(e) => setSendRemarks(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={closeSendModal}>
              Cancel
            </Button>
            <Button
              icon={<Send className="h-4 w-4" />}
              onClick={handleSend}
              loading={sendMutation.isPending}
              disabled={!selectedTestId || !selectedLabId}
            >
              Send to Lab
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Add External Lab Modal ──────────────────────────── */}
      <Modal
        isOpen={addLabModalOpen}
        onClose={closeAddLabModal}
        title="Add External Lab"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Lab Name *"
              value={newLabName}
              onChange={(e) => setNewLabName(e.target.value)}
              placeholder="Laboratory name"
            />
            <Input
              label="Contact Person *"
              value={newLabContact}
              onChange={(e) => setNewLabContact(e.target.value)}
              placeholder="Contact name"
            />
            <Input
              label="Email"
              type="email"
              value={newLabEmail}
              onChange={(e) => setNewLabEmail(e.target.value)}
              placeholder="lab@example.com"
              icon={<Mail className="h-4 w-4" />}
            />
            <Input
              label="Phone"
              value={newLabPhone}
              onChange={(e) => setNewLabPhone(e.target.value)}
              placeholder="+91 XXXXXXXXXX"
              icon={<Phone className="h-4 w-4" />}
            />
          </div>

          <Input
            label="Address"
            value={newLabAddress}
            onChange={(e) => setNewLabAddress(e.target.value)}
            placeholder="Full address"
          />

          <Input
            label="NABL Accreditation Number"
            value={newLabNabl}
            onChange={(e) => setNewLabNabl(e.target.value)}
            placeholder="e.g. T-1234"
            icon={<Shield className="h-4 w-4" />}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={closeAddLabModal}>
              Cancel
            </Button>
            <Button
              icon={<Building2 className="h-4 w-4" />}
              onClick={handleAddLab}
              loading={addLabMutation.isPending}
            >
              Add Lab
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Record Results Modal ────────────────────────────── */}
      <Modal
        isOpen={resultModalOpen}
        onClose={closeResultModal}
        title="Record External Lab Results"
        size="md"
      >
        {selectedRecord && (
          <div className="space-y-4">
            {/* Record info */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sample</span>
                <span className="font-medium">{selectedRecord.sampleCode}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Test</span>
                <span className="font-medium">{selectedRecord.testName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">External Lab</span>
                <span className="font-medium">{selectedRecord.externalLabName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sent Date</span>
                <span>{formatDate(selectedRecord.sentDate)}</span>
              </div>
            </div>

            <Input
              label="Result / Observed Value *"
              value={resultValue}
              onChange={(e) => setResultValue(e.target.value)}
              placeholder="Enter the result from external lab"
            />

            <Input
              label="Received Date"
              type="date"
              value={receivedDate}
              onChange={(e) => setReceivedDate(e.target.value)}
            />

            <Input
              label="Actual Cost (INR)"
              type="number"
              min={0}
              step="0.01"
              value={actualCost}
              onChange={(e) => setActualCost(e.target.value)}
              icon={<IndianRupee className="h-4 w-4" />}
              helperText={`Expected cost: ${formatCurrency(selectedRecord.expectedCost)}`}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks
              </label>
              <textarea
                rows={3}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any observations or notes..."
                value={resultRemarks}
                onChange={(e) => setResultRemarks(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={closeResultModal}>
                Cancel
              </Button>
              <Button
                icon={<ClipboardCheck className="h-4 w-4" />}
                onClick={handleRecordResult}
                loading={recordResultMutation.isPending}
              >
                Save Results
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
