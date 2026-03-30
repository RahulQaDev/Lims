import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, DollarSign, Search, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { get, post, put, del } from '../../services/api';
import type { RateMaster, TestMaster, Client, Standard, PaginatedResponse, ApiResponse } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Table, { type Column } from '../../components/ui/Table';
import SearchInput from '../../components/ui/SearchInput';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import Loader from '../../components/ui/Loader';
import { formatDate, formatCurrency } from '../../utils/formatters';

interface RateFormData {
  testId: string;
  clientId: string;
  standardId: string;
  rate: number;
  effectiveFrom: string;
  effectiveTo: string;
}

const emptyForm: RateFormData = {
  testId: '',
  clientId: '',
  standardId: '',
  rate: 0,
  effectiveFrom: '',
  effectiveTo: '',
};

interface RateLookupResult {
  rate: number;
  source: 'client' | 'standard' | 'default';
  rateMaster?: RateMaster;
}

export default function RateCardPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [testFilter, setTestFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [lookupModalOpen, setLookupModalOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<RateMaster | null>(null);
  const [deletingRate, setDeletingRate] = useState<RateMaster | null>(null);
  const [form, setForm] = useState<RateFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof RateFormData, string>>>({});

  // Bulk update state
  const [selectedRates, setSelectedRates] = useState<Set<string>>(new Set());
  const [bulkPrice, setBulkPrice] = useState('');

  // Lookup state
  const [lookupTestId, setLookupTestId] = useState('');
  const [lookupClientId, setLookupClientId] = useState('');
  const [lookupResult, setLookupResult] = useState<RateLookupResult | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const pageSize = 25;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['rate-masters', page, search, testFilter, clientFilter],
    queryFn: () =>
      get<PaginatedResponse<RateMaster>>('/rate-masters', {
        params: {
          page,
          limit: pageSize,
          search: search || undefined,
          testMasterId: testFilter || undefined,
          clientId: clientFilter || undefined,
        },
      }),
  });

  const { data: testsData } = useQuery({
    queryKey: ['test-masters-all'],
    queryFn: () => get<PaginatedResponse<TestMaster>>('/test-masters', { params: { limit: 500 } }),
  });

  const { data: clientsData } = useQuery({
    queryKey: ['clients-all'],
    queryFn: () => get<PaginatedResponse<Client>>('/clients', { params: { limit: 500 } }),
  });

  const { data: standardsData } = useQuery({
    queryKey: ['standards-all'],
    queryFn: () => get<PaginatedResponse<Standard>>('/standards', { params: { limit: 500 } }),
  });

  const rates = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.total ?? 0;
  const tests = testsData?.data ?? [];
  const clients = clientsData?.data ?? [];
  const standards = standardsData?.data ?? [];

  const testOptions = [
    { value: '', label: 'All Tests' },
    ...tests.map((t) => ({ value: t.id, label: `${t.code} - ${t.name}` })),
  ];

  const clientOptions = [
    { value: '', label: 'All Clients' },
    ...clients.map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` })),
  ];

  const formTestOptions = [
    { value: '', label: 'Select Test' },
    ...tests.map((t) => ({ value: t.id, label: `${t.code} - ${t.name}` })),
  ];

  const formClientOptions = [
    { value: '', label: 'Default (No Client)' },
    ...clients.map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` })),
  ];

  const formStandardOptions = [
    { value: '', label: 'No Standard' },
    ...standards.map((s) => ({ value: s.id, label: `${s.code} - ${s.name}` })),
  ];

  const createMutation = useMutation({
    mutationFn: (payload: RateFormData) => post<ApiResponse<RateMaster>>('/rate-masters', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-masters'] });
      toast.success('Rate created successfully');
      closeModal();
    },
    onError: () => toast.error('Failed to create rate'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RateFormData }) =>
      put<ApiResponse<RateMaster>>(`/rate-masters/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-masters'] });
      toast.success('Rate updated successfully');
      closeModal();
    },
    onError: () => toast.error('Failed to update rate'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => del<ApiResponse<null>>(`/rate-masters/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-masters'] });
      toast.success('Rate deleted successfully');
      setDeleteOpen(false);
      setDeletingRate(null);
    },
    onError: () => toast.error('Failed to delete rate'),
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: (payload: { ids: string[]; rate: number }) =>
      Promise.all(payload.ids.map((id) => put<ApiResponse<RateMaster>>(`/rate-masters/${id}`, { rate: payload.rate }))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rate-masters'] });
      toast.success(`${selectedRates.size} rates updated successfully`);
      setBulkModalOpen(false);
      setSelectedRates(new Set());
      setBulkPrice('');
    },
    onError: () => toast.error('Failed to update rates'),
  });

  const openCreate = () => {
    setEditingRate(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (rate: RateMaster) => {
    setEditingRate(rate);
    setForm({
      testId: rate.testId,
      clientId: rate.clientId || '',
      standardId: '',
      rate: rate.rate,
      effectiveFrom: rate.effectiveFrom ? rate.effectiveFrom.split('T')[0] : '',
      effectiveTo: rate.effectiveTo ? rate.effectiveTo.split('T')[0] : '',
    });
    setErrors({});
    setModalOpen(true);
  };

  const openDelete = (rate: RateMaster) => {
    setDeletingRate(rate);
    setDeleteOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingRate(null);
    setForm(emptyForm);
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof RateFormData, string>> = {};
    if (!form.testId) newErrors.testId = 'Test is required';
    if (form.rate <= 0) newErrors.rate = 'Price must be greater than 0';
    if (!form.effectiveFrom) newErrors.effectiveFrom = 'Effective from date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (editingRate) {
      updateMutation.mutate({ id: editingRate.id, payload: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const updateField = <K extends keyof RateFormData>(field: K, value: RateFormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const toggleRateSelection = (id: string) => {
    setSelectedRates((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllRates = () => {
    if (selectedRates.size === rates.length) {
      setSelectedRates(new Set());
    } else {
      setSelectedRates(new Set(rates.map((r) => r.id)));
    }
  };

  const handleBulkUpdate = () => {
    const price = parseFloat(bulkPrice);
    if (isNaN(price) || price <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    bulkUpdateMutation.mutate({ ids: Array.from(selectedRates), rate: price });
  };

  const handleLookup = async () => {
    if (!lookupTestId) {
      toast.error('Please select a test');
      return;
    }
    setLookupLoading(true);
    setLookupResult(null);
    try {
      const result = await get<ApiResponse<RateLookupResult>>('/rate-masters/lookup', {
        params: {
          testMasterId: lookupTestId,
          clientId: lookupClientId || undefined,
        },
      });
      setLookupResult(result.data);
    } catch {
      // If no specific lookup API, try to determine from existing rates
      const clientRate = rates.find((r) => r.testId === lookupTestId && r.clientId === lookupClientId);
      const defaultRate = rates.find((r) => r.testId === lookupTestId && !r.clientId);
      const test = tests.find((t) => t.id === lookupTestId);

      if (clientRate) {
        setLookupResult({ rate: clientRate.rate, source: 'client', rateMaster: clientRate });
      } else if (defaultRate) {
        setLookupResult({ rate: defaultRate.rate, source: 'default', rateMaster: defaultRate });
      } else if (test) {
        setLookupResult({ rate: test.rate, source: 'default' });
      } else {
        toast.error('No rate found for this combination');
      }
    } finally {
      setLookupLoading(false);
    }
  };

  const columns: Column<RateMaster>[] = [
    {
      key: 'select',
      header: '',
      className: 'w-10',
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedRates.has(row.id)}
          onChange={() => toggleRateSelection(row.id)}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
    },
    {
      key: 'testName',
      header: 'Test Name',
      sortable: true,
      render: (row) => <span className="font-medium text-gray-900">{row.testName}</span>,
    },
    {
      key: 'clientName',
      header: 'Client',
      sortable: true,
      render: (row) =>
        row.clientId && row.clientName ? (
          <span>{row.clientName}</span>
        ) : (
          <Badge variant="purple">Default</Badge>
        ),
    },
    {
      key: 'standard',
      header: 'Standard',
      render: () => '—',
    },
    {
      key: 'rate',
      header: 'Price (INR)',
      sortable: true,
      render: (row) => <span className="font-medium">{formatCurrency(row.rate)}</span>,
    },
    {
      key: 'effectiveFrom',
      header: 'Effective From',
      render: (row) => formatDate(row.effectiveFrom),
    },
    {
      key: 'effectiveTo',
      header: 'Effective To',
      render: (row) => formatDate(row.effectiveTo),
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
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(row); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Edit"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); openDelete(row); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rate Card</h1>
          <p className="text-sm text-gray-500 mt-1">Manage test pricing and client-specific rates</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" icon={<Search className="h-4 w-4" />} onClick={() => setLookupModalOpen(true)}>
            Rate Lookup
          </Button>
          <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            Add Rate
          </Button>
        </div>
      </div>

      <Card noPadding>
        <div className="flex items-center gap-4 p-4 border-b border-gray-100">
          <SearchInput
            onSearch={(val) => { setSearch(val); setPage(1); }}
            placeholder="Search rates..."
            className="w-80"
          />
          <Select
            options={testOptions}
            value={testFilter}
            onChange={(e) => { setTestFilter(e.target.value); setPage(1); }}
            className="w-56"
          />
          <Select
            options={clientOptions}
            value={clientFilter}
            onChange={(e) => { setClientFilter(e.target.value); setPage(1); }}
            className="w-56"
          />
          {selectedRates.size > 0 && (
            <Button
              variant="secondary"
              size="sm"
              icon={<CheckSquare className="h-4 w-4" />}
              onClick={() => setBulkModalOpen(true)}
            >
              Update {selectedRates.size} Selected
            </Button>
          )}
        </div>

        {/* Select all toggle */}
        {rates.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100">
            <input
              type="checkbox"
              checked={selectedRates.size === rates.length && rates.length > 0}
              onChange={toggleAllRates}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-500">
              {selectedRates.size > 0 ? `${selectedRates.size} selected` : 'Select all'}
            </span>
          </div>
        )}

        {isLoading ? (
          <Loader text="Loading rates..." />
        ) : isError ? (
          <EmptyState
            title="Failed to load rates"
            description="There was an error loading the rate list. The API server may not be running."
            icon={<DollarSign className="h-8 w-8 text-gray-400" />}
          />
        ) : rates.length === 0 ? (
          <EmptyState
            title="No rates found"
            description={search ? 'Try adjusting your search criteria' : 'Get started by adding your first rate'}
            icon={<DollarSign className="h-8 w-8 text-gray-400" />}
            action={
              !search ? (
                <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate} size="sm">
                  Add Rate
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <Table columns={columns} data={rates} keyExtractor={(row) => row.id} />
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingRate ? 'Edit Rate' : 'Add New Rate'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editingRate ? 'Update Rate' : 'Create Rate'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Test *"
            options={formTestOptions}
            value={form.testId}
            onChange={(e) => updateField('testId', e.target.value)}
            error={errors.testId}
          />
          <Select
            label="Client (leave empty for default)"
            options={formClientOptions}
            value={form.clientId}
            onChange={(e) => updateField('clientId', e.target.value)}
          />
          <Select
            label="Standard"
            options={formStandardOptions}
            value={form.standardId}
            onChange={(e) => updateField('standardId', e.target.value)}
          />
          <Input
            label="Price (INR) *"
            type="number"
            value={form.rate === 0 ? '' : String(form.rate)}
            onChange={(e) => updateField('rate', Number(e.target.value))}
            error={errors.rate}
            placeholder="0.00"
          />
          <Input
            label="Effective From *"
            type="date"
            value={form.effectiveFrom}
            onChange={(e) => updateField('effectiveFrom', e.target.value)}
            error={errors.effectiveFrom}
          />
          <Input
            label="Effective To"
            type="date"
            value={form.effectiveTo}
            onChange={(e) => updateField('effectiveTo', e.target.value)}
          />
        </div>
      </Modal>

      {/* Bulk Update Modal */}
      <Modal
        isOpen={bulkModalOpen}
        onClose={() => { setBulkModalOpen(false); setBulkPrice(''); }}
        title="Bulk Rate Update"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setBulkModalOpen(false); setBulkPrice(''); }}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkUpdate}
              loading={bulkUpdateMutation.isPending}
            >
              Update {selectedRates.size} Rates
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Set a new price for {selectedRates.size} selected rate{selectedRates.size !== 1 ? 's' : ''}.
          </p>
          <Input
            label="New Price (INR)"
            type="number"
            value={bulkPrice}
            onChange={(e) => setBulkPrice(e.target.value)}
            placeholder="Enter new price"
          />
        </div>
      </Modal>

      {/* Rate Lookup Modal */}
      <Modal
        isOpen={lookupModalOpen}
        onClose={() => { setLookupModalOpen(false); setLookupResult(null); setLookupTestId(''); setLookupClientId(''); }}
        title="Rate Lookup"
        size="md"
        footer={
          <Button variant="ghost" onClick={() => { setLookupModalOpen(false); setLookupResult(null); }}>
            Close
          </Button>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Find which rate applies for a specific test and client combination.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Test *"
              options={formTestOptions}
              value={lookupTestId}
              onChange={(e) => { setLookupTestId(e.target.value); setLookupResult(null); }}
            />
            <Select
              label="Client"
              options={formClientOptions}
              value={lookupClientId}
              onChange={(e) => { setLookupClientId(e.target.value); setLookupResult(null); }}
            />
          </div>
          <Button onClick={handleLookup} loading={lookupLoading} className="w-full">
            Look Up Rate
          </Button>

          {lookupResult && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Applicable Rate</span>
                <span className="text-lg font-bold text-gray-900">{formatCurrency(lookupResult.rate)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Source:</span>
                <Badge
                  variant={
                    lookupResult.source === 'client'
                      ? 'blue'
                      : lookupResult.source === 'standard'
                        ? 'purple'
                        : 'gray'
                  }
                >
                  {lookupResult.source === 'client'
                    ? 'Client-specific Rate'
                    : lookupResult.source === 'standard'
                      ? 'Standard Rate'
                      : 'Default Rate'}
                </Badge>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeletingRate(null); }}
        onConfirm={() => deletingRate && deleteMutation.mutate(deletingRate.id)}
        title="Delete Rate"
        message={`Are you sure you want to delete the rate for "${deletingRate?.testName}"${deletingRate?.clientName ? ` (${deletingRate.clientName})` : ''}? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
