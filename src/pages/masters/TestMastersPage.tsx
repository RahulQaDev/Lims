import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, TestTube } from 'lucide-react';
import toast from 'react-hot-toast';
import { get, post, put, del } from '../../services/api';
import type { TestMaster, Department, PaginatedResponse, ApiResponse } from '../../types';
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
import { formatCurrency } from '../../utils/formatters';

interface TestFormData {
  name: string;
  code: string;
  departmentId: string;
  standardId: string;
  tat: number;
  rate: number;
  isActive: boolean;
}

const emptyForm: TestFormData = {
  name: '',
  code: '',
  departmentId: '',
  standardId: '',
  tat: 24,
  rate: 0,
  isActive: true,
};

export default function TestMastersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingTest, setEditingTest] = useState<TestMaster | null>(null);
  const [deletingTest, setDeletingTest] = useState<TestMaster | null>(null);
  const [form, setForm] = useState<TestFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof TestFormData, string>>>({});

  const pageSize = 25;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tests', page, search, departmentFilter],
    queryFn: () =>
      get<PaginatedResponse<TestMaster>>('/test-masters', {
        params: {
          page,
          limit: pageSize,
          search,
          departmentId: departmentFilter || undefined,
        },
      }),
  });

  const { data: departmentsData } = useQuery({
    queryKey: ['departments-list'],
    queryFn: () => get<PaginatedResponse<Department>>('/departments', { params: { limit: 100 } }),
  });

  const tests = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.total ?? 0;
  const departments = departmentsData?.data ?? [];

  const departmentOptions = [
    { value: '', label: 'All Departments' },
    ...departments.map((d) => ({ value: d.id, label: d.name })),
  ];

  const departmentFormOptions = departments.map((d) => ({ value: d.id, label: d.name }));

  const createMutation = useMutation({
    mutationFn: (payload: TestFormData) => post<ApiResponse<TestMaster>>('/test-masters', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tests'] });
      toast.success('Test created successfully');
      closeModal();
    },
    onError: () => toast.error('Failed to create test'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: TestFormData }) =>
      put<ApiResponse<TestMaster>>(`/test-masters/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tests'] });
      toast.success('Test updated successfully');
      closeModal();
    },
    onError: () => toast.error('Failed to update test'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => del<ApiResponse<null>>(`/test-masters/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tests'] });
      toast.success('Test deleted successfully');
      setDeleteOpen(false);
      setDeletingTest(null);
    },
    onError: () => toast.error('Failed to delete test'),
  });

  const openCreate = () => {
    setEditingTest(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (test: TestMaster) => {
    setEditingTest(test);
    setForm({
      name: test.name,
      code: test.code,
      departmentId: test.departmentId,
      standardId: test.standardId ?? '',
      tat: test.tat,
      rate: test.rate,
      isActive: test.isActive,
    });
    setErrors({});
    setModalOpen(true);
  };

  const openDelete = (test: TestMaster) => {
    setDeletingTest(test);
    setDeleteOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingTest(null);
    setForm(emptyForm);
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof TestFormData, string>> = {};
    if (!form.name.trim()) newErrors.name = 'Test name is required';
    if (!form.code.trim()) newErrors.code = 'Test code is required';
    if (!form.departmentId) newErrors.departmentId = 'Department is required';
    if (form.rate < 0) newErrors.rate = 'Rate must be non-negative';
    if (form.tat <= 0) newErrors.tat = 'TAT must be greater than 0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (editingTest) {
      updateMutation.mutate({ id: editingTest.id, payload: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const updateField = <K extends keyof TestFormData>(field: K, value: TestFormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const columns: Column<TestMaster>[] = [
    { key: 'code', header: 'Code', sortable: true, render: (row) => <span className="font-medium text-gray-900">{row.code}</span> },
    { key: 'name', header: 'Test Name', sortable: true },
    { key: 'departmentName', header: 'Department', sortable: true },
    { key: 'standardName', header: 'Standard', render: (row) => row.standardName || '—' },
    { key: 'tat', header: 'TAT (hrs)', sortable: true, render: (row) => <span>{row.tat}h</span> },
    { key: 'rate', header: 'Rate', sortable: true, render: (row) => formatCurrency(row.rate) },
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
          <h1 className="text-2xl font-bold text-gray-900">Test Masters</h1>
          <p className="text-sm text-gray-500 mt-1">Manage test definitions and parameters</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add Test
        </Button>
      </div>

      <Card noPadding>
        <div className="flex items-center gap-4 p-4 border-b border-gray-100">
          <SearchInput
            onSearch={(val) => { setSearch(val); setPage(1); }}
            placeholder="Search tests by name or code..."
            className="w-80"
          />
          <Select
            options={departmentOptions}
            value={departmentFilter}
            onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }}
            className="w-48"
          />
        </div>

        {isLoading ? (
          <Loader text="Loading tests..." />
        ) : isError ? (
          <EmptyState
            title="Failed to load tests"
            description="There was an error loading the test list. The API server may not be running."
            icon={<TestTube className="h-8 w-8 text-gray-400" />}
          />
        ) : tests.length === 0 ? (
          <EmptyState
            title="No tests found"
            description={search || departmentFilter ? 'Try adjusting your filters' : 'Get started by adding your first test'}
            icon={<TestTube className="h-8 w-8 text-gray-400" />}
            action={
              !search && !departmentFilter ? (
                <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate} size="sm">
                  Add Test
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <Table columns={columns} data={tests} keyExtractor={(row) => row.id} />
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
        title={editingTest ? 'Edit Test' : 'Add New Test'}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSubmit} loading={createMutation.isPending || updateMutation.isPending}>
              {editingTest ? 'Update Test' : 'Create Test'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Test Name *"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            error={errors.name}
            placeholder="e.g., Heavy Metals by ICPMS"
          />
          <Input
            label="Test Code *"
            value={form.code}
            onChange={(e) => updateField('code', e.target.value.toUpperCase())}
            error={errors.code}
            placeholder="e.g., HM-ICPMS"
            disabled={!!editingTest}
          />
          <Select
            label="Department *"
            options={departmentFormOptions}
            value={form.departmentId}
            onChange={(e) => updateField('departmentId', e.target.value)}
            error={errors.departmentId}
            placeholder="Select department"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="TAT (hours) *"
              type="number"
              value={String(form.tat)}
              onChange={(e) => updateField('tat', Number(e.target.value))}
              error={errors.tat}
              placeholder="24"
            />
            <Input
              label="Rate (INR) *"
              type="number"
              value={String(form.rate)}
              onChange={(e) => updateField('rate', Number(e.target.value))}
              error={errors.rate}
              placeholder="0.00"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="testActive"
              checked={form.isActive}
              onChange={(e) => updateField('isActive', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="testActive" className="text-sm text-gray-700">Active</label>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeletingTest(null); }}
        onConfirm={() => deletingTest && deleteMutation.mutate(deletingTest.id)}
        title="Delete Test"
        message={`Are you sure you want to delete "${deletingTest?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
