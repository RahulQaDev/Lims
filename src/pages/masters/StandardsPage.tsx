import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, BookCopy } from 'lucide-react';
import toast from 'react-hot-toast';
import { get, post, put, del } from '../../services/api';
import type { Standard, PaginatedResponse, ApiResponse } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Table, { type Column } from '../../components/ui/Table';
import SearchInput from '../../components/ui/SearchInput';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import Loader from '../../components/ui/Loader';

interface StandardFormData {
  name: string;
  code: string;
  organization: string;
  version: string;
  description: string;
  isActive: boolean;
}

const emptyForm: StandardFormData = {
  name: '',
  code: '',
  organization: '',
  version: '',
  description: '',
  isActive: true,
};

export default function StandardsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingStandard, setEditingStandard] = useState<Standard | null>(null);
  const [deletingStandard, setDeletingStandard] = useState<Standard | null>(null);
  const [form, setForm] = useState<StandardFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof StandardFormData, string>>>({});

  const pageSize = 25;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['standards', page, search],
    queryFn: () =>
      get<PaginatedResponse<Standard>>('/standards', {
        params: { page, limit: pageSize, search },
      }),
  });

  const standards = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.total ?? 0;

  const createMutation = useMutation({
    mutationFn: (payload: StandardFormData) => post<ApiResponse<Standard>>('/standards', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standards'] });
      toast.success('Standard created successfully');
      closeModal();
    },
    onError: () => toast.error('Failed to create standard'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: StandardFormData }) =>
      put<ApiResponse<Standard>>(`/standards/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standards'] });
      toast.success('Standard updated successfully');
      closeModal();
    },
    onError: () => toast.error('Failed to update standard'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => del<ApiResponse<null>>(`/standards/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['standards'] });
      toast.success('Standard deleted successfully');
      setDeleteOpen(false);
      setDeletingStandard(null);
    },
    onError: () => toast.error('Failed to delete standard'),
  });

  const openCreate = () => {
    setEditingStandard(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (std: Standard) => {
    setEditingStandard(std);
    setForm({
      name: std.name,
      code: std.code,
      organization: std.organization,
      version: std.version ?? '',
      description: std.description ?? '',
      isActive: std.isActive,
    });
    setErrors({});
    setModalOpen(true);
  };

  const openDelete = (std: Standard) => {
    setDeletingStandard(std);
    setDeleteOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingStandard(null);
    setForm(emptyForm);
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof StandardFormData, string>> = {};
    if (!form.name.trim()) newErrors.name = 'Standard name is required';
    if (!form.code.trim()) newErrors.code = 'Standard code is required';
    if (!form.organization.trim()) newErrors.organization = 'Organization is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (editingStandard) {
      updateMutation.mutate({ id: editingStandard.id, payload: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const updateField = <K extends keyof StandardFormData>(field: K, value: StandardFormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const columns: Column<Standard>[] = [
    { key: 'code', header: 'Code', sortable: true, render: (row) => <span className="font-medium text-gray-900">{row.code}</span> },
    { key: 'name', header: 'Standard Name', sortable: true },
    { key: 'organization', header: 'Organization', sortable: true },
    { key: 'version', header: 'Version', render: (row) => row.version || '—' },
    { key: 'description', header: 'Description', render: (row) => <span className="max-w-xs truncate block">{row.description || '—'}</span> },
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
          <h1 className="text-2xl font-bold text-gray-900">Standards</h1>
          <p className="text-sm text-gray-500 mt-1">Manage testing standards and methods</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add Standard
        </Button>
      </div>

      <Card noPadding>
        <div className="flex items-center gap-4 p-4 border-b border-gray-100">
          <SearchInput
            onSearch={(val) => { setSearch(val); setPage(1); }}
            placeholder="Search standards..."
            className="w-80"
          />
        </div>

        {isLoading ? (
          <Loader text="Loading standards..." />
        ) : isError ? (
          <EmptyState
            title="Failed to load standards"
            description="There was an error loading standards. The API server may not be running."
            icon={<BookCopy className="h-8 w-8 text-gray-400" />}
          />
        ) : standards.length === 0 ? (
          <EmptyState
            title="No standards found"
            description={search ? 'Try adjusting your search criteria' : 'Get started by adding your first standard'}
            icon={<BookCopy className="h-8 w-8 text-gray-400" />}
            action={
              !search ? (
                <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate} size="sm">
                  Add Standard
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <Table columns={columns} data={standards} keyExtractor={(row) => row.id} />
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

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingStandard ? 'Edit Standard' : 'Add New Standard'}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSubmit} loading={createMutation.isPending || updateMutation.isPending}>
              {editingStandard ? 'Update Standard' : 'Create Standard'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Standard Name *"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            error={errors.name}
            placeholder="e.g., IS 10500:2012"
          />
          <Input
            label="Standard Code *"
            value={form.code}
            onChange={(e) => updateField('code', e.target.value.toUpperCase())}
            error={errors.code}
            placeholder="e.g., IS10500"
            disabled={!!editingStandard}
          />
          <Input
            label="Organization *"
            value={form.organization}
            onChange={(e) => updateField('organization', e.target.value)}
            error={errors.organization}
            placeholder="e.g., BIS, WHO, USP, IP"
          />
          <Input
            label="Version"
            value={form.version}
            onChange={(e) => updateField('version', e.target.value)}
            placeholder="e.g., 2012, Rev 3"
          />
          <Input
            label="Description"
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Brief description of the standard"
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="stdActive"
              checked={form.isActive}
              onChange={(e) => updateField('isActive', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="stdActive" className="text-sm text-gray-700">Active</label>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeletingStandard(null); }}
        onConfirm={() => deletingStandard && deleteMutation.mutate(deletingStandard.id)}
        title="Delete Standard"
        message={`Are you sure you want to delete "${deletingStandard?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
