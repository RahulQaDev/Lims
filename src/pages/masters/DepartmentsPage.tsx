import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { get, post, put, del } from '../../services/api';
import type { Department, PaginatedResponse, ApiResponse } from '../../types';
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

interface DeptFormData {
  name: string;
  code: string;
  headName: string;
  description: string;
  isActive: boolean;
}

const emptyForm: DeptFormData = {
  name: '',
  code: '',
  headName: '',
  description: '',
  isActive: true,
};

export default function DepartmentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);
  const [form, setForm] = useState<DeptFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof DeptFormData, string>>>({});

  const pageSize = 25;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['departments', page, search],
    queryFn: () =>
      get<PaginatedResponse<Department>>('/departments', {
        params: { page, limit: pageSize, search },
      }),
  });

  const departments = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.total ?? 0;

  const createMutation = useMutation({
    mutationFn: (payload: DeptFormData) => post<ApiResponse<Department>>('/departments', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department created successfully');
      closeModal();
    },
    onError: () => toast.error('Failed to create department'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DeptFormData }) =>
      put<ApiResponse<Department>>(`/departments/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department updated successfully');
      closeModal();
    },
    onError: () => toast.error('Failed to update department'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => del<ApiResponse<null>>(`/departments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department deleted successfully');
      setDeleteOpen(false);
      setDeletingDept(null);
    },
    onError: () => toast.error('Failed to delete department'),
  });

  const openCreate = () => {
    setEditingDept(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (dept: Department) => {
    setEditingDept(dept);
    setForm({
      name: dept.name,
      code: dept.code,
      headName: dept.headName ?? '',
      description: dept.description ?? '',
      isActive: dept.isActive,
    });
    setErrors({});
    setModalOpen(true);
  };

  const openDelete = (dept: Department) => {
    setDeletingDept(dept);
    setDeleteOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingDept(null);
    setForm(emptyForm);
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof DeptFormData, string>> = {};
    if (!form.name.trim()) newErrors.name = 'Department name is required';
    if (!form.code.trim()) newErrors.code = 'Department code is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (editingDept) {
      updateMutation.mutate({ id: editingDept.id, payload: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const updateField = <K extends keyof DeptFormData>(field: K, value: DeptFormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const columns: Column<Department>[] = [
    { key: 'code', header: 'Code', sortable: true, render: (row) => <span className="font-medium text-gray-900">{row.code}</span> },
    { key: 'name', header: 'Name', sortable: true },
    { key: 'headName', header: 'Head', render: (row) => row.headName || '—' },
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
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="text-sm text-gray-500 mt-1">Manage laboratory departments</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add Department
        </Button>
      </div>

      <Card noPadding>
        <div className="flex items-center gap-4 p-4 border-b border-gray-100">
          <SearchInput
            onSearch={(val) => { setSearch(val); setPage(1); }}
            placeholder="Search departments..."
            className="w-80"
          />
        </div>

        {isLoading ? (
          <Loader text="Loading departments..." />
        ) : isError ? (
          <EmptyState
            title="Failed to load departments"
            description="There was an error loading departments. The API server may not be running."
            icon={<Layers className="h-8 w-8 text-gray-400" />}
          />
        ) : departments.length === 0 ? (
          <EmptyState
            title="No departments found"
            description={search ? 'Try adjusting your search criteria' : 'Get started by adding your first department'}
            icon={<Layers className="h-8 w-8 text-gray-400" />}
            action={
              !search ? (
                <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate} size="sm">
                  Add Department
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <Table columns={columns} data={departments} keyExtractor={(row) => row.id} />
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
        title={editingDept ? 'Edit Department' : 'Add New Department'}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSubmit} loading={createMutation.isPending || updateMutation.isPending}>
              {editingDept ? 'Update Department' : 'Create Department'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Department Name *"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            error={errors.name}
            placeholder="e.g., HPLC"
          />
          <Input
            label="Department Code *"
            value={form.code}
            onChange={(e) => updateField('code', e.target.value.toUpperCase())}
            error={errors.code}
            placeholder="e.g., HPLC"
            disabled={!!editingDept}
          />
          <Input
            label="Department Head"
            value={form.headName}
            onChange={(e) => updateField('headName', e.target.value)}
            placeholder="Head of department"
          />
          <Input
            label="Description"
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Brief description"
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="deptActive"
              checked={form.isActive}
              onChange={(e) => updateField('isActive', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="deptActive" className="text-sm text-gray-700">Active</label>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeletingDept(null); }}
        onConfirm={() => deletingDept && deleteMutation.mutate(deletingDept.id)}
        title="Delete Department"
        message={`Are you sure you want to delete "${deletingDept?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
