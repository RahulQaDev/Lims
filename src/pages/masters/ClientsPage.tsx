import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { get, post, put, del } from '../../services/api';
import type { Client, PaginatedResponse, ApiResponse } from '../../types';
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

interface ClientFormData {
  name: string;
  code: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  pan: string;
  creditLimit: number;
  isActive: boolean;
}

const emptyForm: ClientFormData = {
  name: '',
  code: '',
  contactPerson: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  gstin: '',
  pan: '',
  creditLimit: 0,
  isActive: true,
};

const CLIENT_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export default function ClientsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof ClientFormData, string>>>({});

  const pageSize = 25;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['clients', page, search, typeFilter],
    queryFn: () =>
      get<PaginatedResponse<Client>>('/clients', {
        params: { page, limit: pageSize, search, status: typeFilter === 'all' ? undefined : typeFilter },
      }),
  });

  const clients = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.total ?? 0;

  const createMutation = useMutation({
    mutationFn: (payload: ClientFormData) => post<ApiResponse<Client>>('/clients', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client created successfully');
      closeModal();
    },
    onError: () => toast.error('Failed to create client'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ClientFormData }) =>
      put<ApiResponse<Client>>(`/clients/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client updated successfully');
      closeModal();
    },
    onError: () => toast.error('Failed to update client'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => del<ApiResponse<null>>(`/clients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Client deleted successfully');
      setDeleteOpen(false);
      setDeletingClient(null);
    },
    onError: () => toast.error('Failed to delete client'),
  });

  const openCreate = () => {
    setEditingClient(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setForm({
      name: client.name,
      code: client.code,
      contactPerson: client.contactPerson,
      email: client.email,
      phone: client.phone,
      address: client.address,
      city: client.city,
      state: client.state,
      pincode: client.pincode,
      gstin: client.gstin ?? '',
      pan: client.pan ?? '',
      creditLimit: client.creditLimit,
      isActive: client.isActive,
    });
    setErrors({});
    setModalOpen(true);
  };

  const openDelete = (client: Client) => {
    setDeletingClient(client);
    setDeleteOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingClient(null);
    setForm(emptyForm);
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ClientFormData, string>> = {};
    if (!form.name.trim()) newErrors.name = 'Client name is required';
    if (!form.code.trim()) newErrors.code = 'Client code is required';
    if (!form.contactPerson.trim()) newErrors.contactPerson = 'Contact person is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Invalid email format';
    if (!form.phone.trim()) newErrors.phone = 'Phone is required';
    if (!form.city.trim()) newErrors.city = 'City is required';
    if (!form.state.trim()) newErrors.state = 'State is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, payload: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const updateField = <K extends keyof ClientFormData>(field: K, value: ClientFormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const columns: Column<Client>[] = [
    { key: 'code', header: 'Code', sortable: true, render: (row) => <span className="font-medium text-gray-900">{row.code}</span> },
    { key: 'name', header: 'Name', sortable: true },
    { key: 'contactPerson', header: 'Contact Person' },
    { key: 'city', header: 'City', sortable: true },
    { key: 'phone', header: 'Phone' },
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
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your client database</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add Client
        </Button>
      </div>

      <Card noPadding>
        <div className="flex items-center gap-4 p-4 border-b border-gray-100">
          <SearchInput
            onSearch={(val) => { setSearch(val); setPage(1); }}
            placeholder="Search clients by name, code, city..."
            className="w-80"
          />
          <Select
            options={CLIENT_TYPES}
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="w-40"
          />
        </div>

        {isLoading ? (
          <Loader text="Loading clients..." />
        ) : isError ? (
          <EmptyState
            title="Failed to load clients"
            description="There was an error loading the client list. The API server may not be running."
            icon={<Building2 className="h-8 w-8 text-gray-400" />}
          />
        ) : clients.length === 0 ? (
          <EmptyState
            title="No clients found"
            description={search ? 'Try adjusting your search criteria' : 'Get started by adding your first client'}
            icon={<Building2 className="h-8 w-8 text-gray-400" />}
            action={
              !search ? (
                <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate} size="sm">
                  Add Client
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <Table columns={columns} data={clients} keyExtractor={(row) => row.id} />
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
        title={editingClient ? 'Edit Client' : 'Add New Client'}
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
              {editingClient ? 'Update Client' : 'Create Client'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Client Name *"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            error={errors.name}
            placeholder="Enter client name"
          />
          <Input
            label="Client Code *"
            value={form.code}
            onChange={(e) => updateField('code', e.target.value.toUpperCase())}
            error={errors.code}
            placeholder="e.g., CL001"
            disabled={!!editingClient}
          />
          <Input
            label="Contact Person *"
            value={form.contactPerson}
            onChange={(e) => updateField('contactPerson', e.target.value)}
            error={errors.contactPerson}
            placeholder="Contact person name"
          />
          <Input
            label="Email *"
            type="email"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            error={errors.email}
            placeholder="email@example.com"
          />
          <Input
            label="Phone *"
            value={form.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            error={errors.phone}
            placeholder="Phone number"
          />
          <Input
            label="GSTIN"
            value={form.gstin}
            onChange={(e) => updateField('gstin', e.target.value.toUpperCase())}
            placeholder="GST number"
          />
          <div className="md:col-span-2">
            <Input
              label="Address"
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="Full address"
            />
          </div>
          <Input
            label="City *"
            value={form.city}
            onChange={(e) => updateField('city', e.target.value)}
            error={errors.city}
            placeholder="City"
          />
          <Input
            label="State *"
            value={form.state}
            onChange={(e) => updateField('state', e.target.value)}
            error={errors.state}
            placeholder="State"
          />
          <Input
            label="Pincode"
            value={form.pincode}
            onChange={(e) => updateField('pincode', e.target.value)}
            placeholder="Pincode"
          />
          <Input
            label="PAN"
            value={form.pan}
            onChange={(e) => updateField('pan', e.target.value.toUpperCase())}
            placeholder="PAN number"
          />
          <Input
            label="Credit Limit"
            type="number"
            value={String(form.creditLimit)}
            onChange={(e) => updateField('creditLimit', Number(e.target.value))}
            placeholder="0.00"
          />
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => updateField('isActive', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Active
            </label>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeletingClient(null); }}
        onConfirm={() => deletingClient && deleteMutation.mutate(deletingClient.id)}
        title="Delete Client"
        message={`Are you sure you want to delete "${deletingClient?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
