import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  FlaskConical,
  Receipt,
  FileDown,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Download,
  Clock,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { get } from '../../services/api';
import type {
  Client,
  Invoice,
  Sample,
  ApiResponse,
  PaginatedResponse,
} from '../../types';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Table, { type Column } from '../../components/ui/Table';
import SearchInput from '../../components/ui/SearchInput';
import Pagination from '../../components/ui/Pagination';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate, formatCurrency, getStatusBadge } from '../../utils/formatters';

// ─── Local types ──────────────────────────────────────────

interface ClientSample extends Sample {
  testNames?: string[];
  currentStage?: string;
  stages?: SampleStage[];
}

interface SampleStage {
  name: string;
  status: 'completed' | 'current' | 'pending';
  date?: string;
  remarks?: string;
}

interface ClientInvoice extends Invoice {
  balance: number;
}

interface CoaDownload {
  id: string;
  coaNumber: string;
  sampleCode: string;
  sampleName: string;
  generatedAt: string;
  pdfUrl?: string;
}

type PortalTab = 'samples' | 'invoices' | 'coa';

const TABS: { key: PortalTab; label: string; icon: typeof FlaskConical }[] = [
  { key: 'samples', label: 'Samples', icon: FlaskConical },
  { key: 'invoices', label: 'Invoices', icon: Receipt },
  { key: 'coa', label: 'CoA Downloads', icon: FileDown },
];

const SAMPLE_STATUS_BADGE: Record<string, 'gray' | 'blue' | 'purple' | 'yellow' | 'orange' | 'cyan' | 'green' | 'emerald' | 'teal' | 'lime' | 'red'> = {
  RECEIVED: 'blue',
  REGISTERED: 'purple',
  BOOKED: 'purple',
  IN_TESTING: 'yellow',
  PENDING_REVIEW: 'orange',
  REVIEWED: 'cyan',
  APPROVED: 'green',
  COA_GENERATED: 'teal',
  COA_PRINTED: 'emerald',
  DISPATCHED: 'lime',
  INVOICED: 'green',
  REJECTED: 'red',
  ON_HOLD: 'gray',
};

const INVOICE_STATUS_BADGE: Record<string, 'gray' | 'blue' | 'green' | 'yellow' | 'red'> = {
  DRAFT: 'gray',
  SENT: 'blue',
  PAID: 'green',
  PARTIALLY_PAID: 'yellow',
  OVERDUE: 'red',
  CANCELLED: 'gray',
};

const WORKFLOW_STAGES = [
  'Received',
  'Registered',
  'Booked',
  'In Testing',
  'Pending Review',
  'Reviewed',
  'Approved',
  'CoA Generated',
  'Dispatched',
];

function getStageIndex(status: string): number {
  const map: Record<string, number> = {
    RECEIVED: 0,
    REGISTERED: 1,
    BOOKED: 2,
    IN_TESTING: 3,
    PENDING_REVIEW: 4,
    REVIEWED: 5,
    APPROVED: 6,
    COA_GENERATED: 7,
    COA_PRINTED: 7,
    DISPATCHED: 8,
    INVOICED: 8,
  };
  return map[status] ?? 0;
}

// ─── Component ────────────────────────────────────────────

export default function ClientPortalPage() {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [activeTab, setActiveTab] = useState<PortalTab>('samples');
  const [expandedSampleId, setExpandedSampleId] = useState<string | null>(null);

  // Samples state
  const [samplesPage, setSamplesPage] = useState(1);
  const [samplesSearch, setSamplesSearch] = useState('');

  // Invoices state
  const [invoicesPage, setInvoicesPage] = useState(1);

  const pageSize = 25;

  // ─── Queries ──────────────────────────────────────────────

  const { data: clientsData, isLoading: clientsLoading } = useQuery({
    queryKey: ['clients-list'],
    queryFn: () =>
      get<PaginatedResponse<Client>>('/clients', {
        params: { limit: 500, isActive: true },
      }),
  });

  const clients = clientsData?.data ?? [];

  const { data: samplesData, isLoading: samplesLoading, isError: samplesError } = useQuery({
    queryKey: ['client-samples', selectedClientId, samplesPage, samplesSearch],
    queryFn: () =>
      get<PaginatedResponse<ClientSample>>(`/clients/${selectedClientId}/samples`, {
        params: { page: samplesPage, limit: pageSize, search: samplesSearch || undefined },
      }),
    enabled: !!selectedClientId && activeTab === 'samples',
  });

  const samples = samplesData?.data ?? [];
  const samplesTotalPages = samplesData?.totalPages ?? 1;
  const samplesTotalItems = samplesData?.total ?? 0;

  const { data: invoicesData, isLoading: invoicesLoading, isError: invoicesError } = useQuery({
    queryKey: ['client-invoices', selectedClientId, invoicesPage],
    queryFn: () =>
      get<PaginatedResponse<ClientInvoice>>(`/clients/${selectedClientId}/invoices`, {
        params: { page: invoicesPage, limit: pageSize },
      }),
    enabled: !!selectedClientId && activeTab === 'invoices',
  });

  const invoices = invoicesData?.data ?? [];
  const invoicesTotalPages = invoicesData?.totalPages ?? 1;
  const invoicesTotalItems = invoicesData?.total ?? 0;

  const { data: coaData, isLoading: coaLoading, isError: coaError } = useQuery({
    queryKey: ['client-coa', selectedClientId],
    queryFn: () =>
      get<ApiResponse<CoaDownload[]>>(`/clients/${selectedClientId}/coa`).then(
        (res) => res.data,
      ),
    enabled: !!selectedClientId && activeTab === 'coa',
  });

  const coaList = coaData ?? [];

  // ─── Handlers ─────────────────────────────────────────────

  const handleClientChange = (id: string) => {
    setSelectedClientId(id);
    setSamplesPage(1);
    setInvoicesPage(1);
    setSamplesSearch('');
    setExpandedSampleId(null);
  };

  const toggleSampleExpand = (sampleId: string) => {
    setExpandedSampleId(expandedSampleId === sampleId ? null : sampleId);
  };

  // ─── Table columns ───────────────────────────────────────

  const sampleColumns: Column<ClientSample>[] = [
    {
      key: 'expand',
      header: '',
      className: 'w-10',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleSampleExpand(row.id);
          }}
          className="p-1 text-gray-400 hover:text-gray-700 transition-colors"
        >
          {expandedSampleId === row.id ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      ),
    },
    {
      key: 'sampleCode',
      header: 'Sample Code',
      sortable: true,
      render: (row) => (
        <span className="font-medium text-gray-900">{row.sampleCode}</span>
      ),
    },
    { key: 'name', header: 'Sample Name', sortable: true },
    {
      key: 'receivedDate',
      header: 'Received Date',
      sortable: true,
      render: (row) => formatDate(row.receivedDate),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      render: (row) => formatDate(row.dueDate),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={SAMPLE_STATUS_BADGE[row.status] ?? 'gray'}>
          {getStatusBadge(row.status)}
        </Badge>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (row) => (
        <Badge variant={row.priority === 'CRITICAL' ? 'red' : row.priority === 'URGENT' ? 'orange' : 'blue'}>
          {getStatusBadge(row.priority)}
        </Badge>
      ),
    },
  ];

  const invoiceColumns: Column<ClientInvoice>[] = [
    {
      key: 'invoiceNumber',
      header: 'Invoice No',
      sortable: true,
      render: (row) => (
        <span className="font-medium text-blue-700">{row.invoiceNumber}</span>
      ),
    },
    {
      key: 'issuedDate',
      header: 'Date',
      sortable: true,
      render: (row) => formatDate(row.issuedDate),
    },
    {
      key: 'totalAmount',
      header: 'Amount',
      sortable: true,
      render: (row) => (
        <span className="font-semibold">{formatCurrency(row.totalAmount)}</span>
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
      key: 'dueDate',
      header: 'Due Date',
      render: (row) => formatDate(row.dueDate),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={INVOICE_STATUS_BADGE[row.status] ?? 'gray'}>
          {getStatusBadge(row.status)}
        </Badge>
      ),
    },
  ];

  // ─── Workflow timeline ────────────────────────────────────

  const renderTimeline = (sample: ClientSample) => {
    const currentIdx = getStageIndex(sample.status);
    const isRejected = sample.status === 'REJECTED';
    const isOnHold = sample.status === 'ON_HOLD';

    return (
      <tr>
        <td colSpan={sampleColumns.length} className="px-4 py-4 bg-gray-50">
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase">Sample Workflow Progress</h4>

            {(isRejected || isOnHold) && (
              <div className={`flex items-center gap-2 p-2 rounded-lg text-sm ${isRejected ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'}`}>
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {isRejected ? 'This sample has been rejected.' : 'This sample is currently on hold.'}
              </div>
            )}

            <div className="flex items-center gap-0 overflow-x-auto pb-2">
              {WORKFLOW_STAGES.map((stage, idx) => {
                const isCompleted = idx < currentIdx;
                const isCurrent = idx === currentIdx;
                return (
                  <div key={stage} className="flex items-center">
                    <div className="flex flex-col items-center min-w-[80px]">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                          isCompleted
                            ? 'bg-green-500 text-white'
                            : isCurrent
                              ? 'bg-blue-500 text-white ring-4 ring-blue-100'
                              : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <span
                        className={`text-[10px] mt-1 text-center leading-tight ${
                          isCurrent ? 'font-semibold text-blue-700' : isCompleted ? 'text-green-700' : 'text-gray-400'
                        }`}
                      >
                        {stage}
                      </span>
                    </div>
                    {idx < WORKFLOW_STAGES.length - 1 && (
                      <div
                        className={`h-0.5 w-6 mt-[-16px] ${
                          idx < currentIdx ? 'bg-green-400' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Stage details */}
            {sample.stages && sample.stages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {sample.stages.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="font-medium">{s.name}:</span>
                    <span>{s.date ? formatDate(s.date) : '--'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </td>
      </tr>
    );
  };

  // ─── Render ───────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Portal</h1>
          <p className="text-sm text-gray-500 mt-1">
            View samples, invoices and certificates for each client
          </p>
        </div>
      </div>

      {/* Client Selector */}
      <Card>
        <div className="max-w-md">
          {clientsLoading ? (
            <Loader text="Loading clients..." />
          ) : (
            <Select
              label="Select Client"
              options={clients.map((c) => ({
                value: c.id,
                label: `${c.code} - ${c.name}`,
              }))}
              value={selectedClientId}
              onChange={(e) => handleClientChange(e.target.value)}
              placeholder="Choose a client to view their portal..."
            />
          )}
        </div>
      </Card>

      {/* Tabs */}
      {selectedClientId && (
        <>
          <div className="flex gap-1 border-b border-gray-200">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-600 text-blue-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ─── Samples Tab ──────────────────────────────────── */}
          {activeTab === 'samples' && (
            <Card noPadding>
              <div className="flex items-center gap-4 p-4 border-b border-gray-100">
                <SearchInput
                  onSearch={(val) => {
                    setSamplesSearch(val);
                    setSamplesPage(1);
                  }}
                  placeholder="Search by sample code, name..."
                  className="w-96"
                />
              </div>

              {samplesLoading ? (
                <Loader text="Loading samples..." />
              ) : samplesError ? (
                <EmptyState
                  title="Failed to load samples"
                  description="There was an error loading the client's samples."
                  icon={<AlertTriangle className="h-8 w-8 text-gray-400" />}
                />
              ) : samples.length === 0 ? (
                <EmptyState
                  title="No samples found"
                  description={samplesSearch ? 'Try adjusting your search criteria.' : 'This client has no samples yet.'}
                  icon={<FlaskConical className="h-8 w-8 text-gray-400" />}
                />
              ) : (
                <>
                  {/* Custom table to support expandable rows */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {sampleColumns.map((col) => (
                            <th
                              key={col.key}
                              className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${col.className || ''}`}
                            >
                              {col.header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {samples.map((sample) => (
                          <>
                            <tr
                              key={sample.id}
                              className="cursor-pointer hover:bg-blue-50 transition-colors"
                              onClick={() => toggleSampleExpand(sample.id)}
                            >
                              {sampleColumns.map((col) => (
                                <td
                                  key={col.key}
                                  className={`px-4 py-3 text-sm text-gray-700 whitespace-nowrap ${col.className || ''}`}
                                >
                                  {col.render
                                    ? col.render(sample)
                                    : String((sample as Record<string, unknown>)[col.key] ?? '--')}
                                </td>
                              ))}
                            </tr>
                            {expandedSampleId === sample.id && renderTimeline(sample)}
                          </>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 border-t border-gray-100">
                    <Pagination
                      currentPage={samplesPage}
                      totalPages={samplesTotalPages}
                      totalItems={samplesTotalItems}
                      pageSize={pageSize}
                      onPageChange={setSamplesPage}
                    />
                  </div>
                </>
              )}
            </Card>
          )}

          {/* ─── Invoices Tab ─────────────────────────────────── */}
          {activeTab === 'invoices' && (
            <Card noPadding>
              {invoicesLoading ? (
                <Loader text="Loading invoices..." />
              ) : invoicesError ? (
                <EmptyState
                  title="Failed to load invoices"
                  description="There was an error loading the client's invoices."
                  icon={<AlertTriangle className="h-8 w-8 text-gray-400" />}
                />
              ) : invoices.length === 0 ? (
                <EmptyState
                  title="No invoices found"
                  description="This client has no invoices yet."
                  icon={<Receipt className="h-8 w-8 text-gray-400" />}
                />
              ) : (
                <>
                  <Table
                    columns={invoiceColumns}
                    data={invoices}
                    keyExtractor={(row) => row.id}
                  />
                  <div className="px-4 border-t border-gray-100">
                    <Pagination
                      currentPage={invoicesPage}
                      totalPages={invoicesTotalPages}
                      totalItems={invoicesTotalItems}
                      pageSize={pageSize}
                      onPageChange={setInvoicesPage}
                    />
                  </div>
                </>
              )}
            </Card>
          )}

          {/* ─── CoA Downloads Tab ────────────────────────────── */}
          {activeTab === 'coa' && (
            <Card noPadding>
              {coaLoading ? (
                <Loader text="Loading certificates..." />
              ) : coaError ? (
                <EmptyState
                  title="Failed to load certificates"
                  description="There was an error loading the certificates."
                  icon={<AlertTriangle className="h-8 w-8 text-gray-400" />}
                />
              ) : coaList.length === 0 ? (
                <EmptyState
                  title="No certificates available"
                  description="No Certificates of Analysis have been generated for this client yet."
                  icon={<FileDown className="h-8 w-8 text-gray-400" />}
                />
              ) : (
                <div className="divide-y divide-gray-100">
                  {coaList.map((coa) => (
                    <div
                      key={coa.id}
                      className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                          <FileDown className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{coa.coaNumber}</p>
                          <p className="text-xs text-gray-500">
                            {coa.sampleCode} - {coa.sampleName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">{formatDate(coa.generatedAt)}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          icon={<Download className="h-3.5 w-3.5" />}
                          onClick={() => {
                            if (coa.pdfUrl) {
                              window.open(coa.pdfUrl, '_blank');
                            }
                          }}
                          disabled={!coa.pdfUrl}
                        >
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </>
      )}

      {/* No client selected */}
      {!selectedClientId && !clientsLoading && (
        <Card>
          <EmptyState
            title="Select a Client"
            description="Choose a client from the dropdown above to view their samples, invoices and certificates."
            icon={<Users className="h-8 w-8 text-gray-400" />}
          />
        </Card>
      )}
    </div>
  );
}
