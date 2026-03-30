import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Gauge, AlertTriangle, CheckCircle2, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';
import { get, post, put, del } from '../../services/api';
import type { Instrument, Department, PaginatedResponse, ApiResponse } from '../../types';
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
import StatCard from '../../components/ui/StatCard';
import { formatDate } from '../../utils/formatters';

type InstrumentStatus = 'active' | 'under_maintenance' | 'calibration_due' | 'out_of_service';

interface InstrumentFormData {
  name: string;
  code: string;
  departmentId: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  calibrationDate: string;
  nextCalibrationDate: string;
  calibrationCertificate: string;
  status: InstrumentStatus;
}

const emptyForm: InstrumentFormData = {
  name: '',
  code: '',
  departmentId: '',
  manufacturer: '',
  model: '',
  serialNumber: '',
  calibrationDate: '',
  nextCalibrationDate: '',
  calibrationCertificate: '',
  status: 'active',
};

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'under_maintenance', label: 'Under Maintenance' },
  { value: 'calibration_due', label: 'Calibration Due' },
  { value: 'out_of_service', label: 'Out of Service' },
];

const FORM_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'under_maintenance', label: 'Under Maintenance' },
  { value: 'calibration_due', label: 'Calibration Due' },
  { value: 'out_of_service', label: 'Out of Service' },
];

function getInstrumentStatusBadge(status: string): { label: string; variant: 'green' | 'yellow' | 'orange' | 'red' } {
  switch (status) {
    case 'active':
      return { label: 'Active', variant: 'green' };
    case 'under_maintenance':
      return { label: 'Under Maintenance', variant: 'yellow' };
    case 'calibration_due':
      return { label: 'Calibration Due', variant: 'orange' };
    case 'out_of_service':
      return { label: 'Out of Service', variant: 'red' };
    default:
      return { label: status, variant: 'green' };
  }
}

function isCalibrationDueSoon(nextCalibrationDate: string | undefined): boolean {
  if (!nextCalibrationDate) return false;
  const next = new Date(nextCalibrationDate);
  const now = new Date();
  const diff = next.getTime() - now.getTime();
  const days = diff / (1000 * 60 * 60 * 24);
  return days <= 7;
}

export default function InstrumentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingInstrument, setEditingInstrument] = useState<Instrument | null>(null);
  const [deletingInstrument, setDeletingInstrument] = useState<Instrument | null>(null);
  const [form, setForm] = useState<InstrumentFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof InstrumentFormData, string>>>({});

  const pageSize = 25;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['instruments', page, search, departmentFilter, statusFilter],
    queryFn: () =>
      get<PaginatedResponse<Instrument>>('/instruments', {
        params: {
          page,
          limit: pageSize,
          search: search || undefined,
          departmentId: departmentFilter || undefined,
          status: statusFilter || undefined,
        },
      }),
  });

  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => get<PaginatedResponse<Department>>('/departments', { params: { limit: 100 } }),
  });

  const instruments = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.total ?? 0;
  const departments = departmentsData?.data ?? [];

  const departmentOptions = [
    { value: '', label: 'All Departments' },
    ...departments.map((d) => ({ value: d.id, label: d.name })),
  ];

  const formDepartmentOptions = [
    { value: '', label: 'Select Department' },
    ...departments.map((d) => ({ value: d.id, label: d.name })),
  ];

  const stats = useMemo(() => {
    const all = instruments;
    const active = all.filter((i) => i.status === 'active').length;
    const calibDue = all.filter((i) => i.status === 'calibration_due' || isCalibrationDueSoon(i.calibrationDueDate)).length;
    const maintenance = all.filter((i) => i.status === 'under_maintenance').length;
    return { active, calibDue, maintenance };
  }, [instruments]);

  const createMutation = useMutation({
    mutationFn: (payload: InstrumentFormData) => post<ApiResponse<Instrument>>('/instruments', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instruments'] });
      toast.success('Instrument created successfully');
      closeModal();
    },
    onError: () => toast.error('Failed to create instrument'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: InstrumentFormData }) =>
      put<ApiResponse<Instrument>>(`/instruments/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instruments'] });
      toast.success('Instrument updated successfully');
      closeModal();
    },
    onError: () => toast.error('Failed to update instrument'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => del<ApiResponse<null>>(`/instruments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instruments'] });
      toast.success('Instrument deactivated successfully');
      setDeleteOpen(false);
      setDeletingInstrument(null);
    },
    onError: () => toast.error('Failed to deactivate instrument'),
  });

  const openCreate = () => {
    setEditingInstrument(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (instrument: Instrument) => {
    setEditingInstrument(instrument);
    setForm({
      name: instrument.name,
      code: instrument.code,
      departmentId: instrument.departmentId,
      manufacturer: instrument.manufacturer ?? '',
      model: instrument.model ?? '',
      serialNumber: instrument.serialNumber ?? '',
      calibrationDate: instrument.calibrationDueDate ? instrument.calibrationDueDate.split('T')[0] : '',
      nextCalibrationDate: instrument.calibrationDueDate ? instrument.calibrationDueDate.split('T')[0] : '',
      calibrationCertificate: '',
      status: (instrument.status as InstrumentStatus) || 'active',
    });
    setErrors({});
    setModalOpen(true);
  };

  const openDelete = (instrument: Instrument) => {
    setDeletingInstrument(instrument);
    setDeleteOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingInstrument(null);
    setForm(emptyForm);
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof InstrumentFormData, string>> = {};
    if (!form.name.trim()) newErrors.name = 'Instrument name is required';
    if (!form.code.trim()) newErrors.code = 'Instrument code is required';
    if (!form.departmentId) newErrors.departmentId = 'Department is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (editingInstrument) {
      updateMutation.mutate({ id: editingInstrument.id, payload: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const updateField = <K extends keyof InstrumentFormData>(field: K, value: InstrumentFormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const columns: Column<Instrument>[] = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: (row) => <span className="font-medium text-gray-900">{row.code}</span>,
    },
    { key: 'name', header: 'Name', sortable: true },
    { key: 'departmentName', header: 'Department', sortable: true },
    {
      key: 'manufacturer',
      header: 'Make / Model',
      render: (row) => (
        <span>
          {row.manufacturer ?? '—'}
          {row.model ? ` / ${row.model}` : ''}
        </span>
      ),
    },
    { key: 'serialNumber', header: 'Serial No', render: (row) => row.serialNumber ?? '—' },
    {
      key: 'calibrationDueDate',
      header: 'Calibration Date',
      render: (row) => formatDate(row.calibrationDueDate),
    },
    {
      key: 'nextCalibration',
      header: 'Next Calibration',
      render: (row) => {
        const date = row.calibrationDueDate;
        const isDueSoon = isCalibrationDueSoon(date);
        return (
          <span className={isDueSoon ? 'text-orange-600 font-medium' : ''}>
            {formatDate(date)}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const badge = getInstrumentStatusBadge(row.status);
        return <Badge variant={badge.variant}>{badge.label}</Badge>;
      },
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
            title="Deactivate"
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
          <h1 className="text-2xl font-bold text-gray-900">Instruments</h1>
          <p className="text-sm text-gray-500 mt-1">Manage instruments and NABL calibration traceability</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add Instrument
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Total Active"
          value={stats.active}
          color="green"
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Calibration Due"
          value={stats.calibDue}
          color="orange"
        />
        <StatCard
          icon={<Wrench className="h-5 w-5" />}
          label="Under Maintenance"
          value={stats.maintenance}
          color="yellow"
        />
      </div>

      <Card noPadding>
        <div className="flex items-center gap-4 p-4 border-b border-gray-100">
          <SearchInput
            onSearch={(val) => { setSearch(val); setPage(1); }}
            placeholder="Search by name, code, serial number..."
            className="w-80"
          />
          <Select
            options={departmentOptions}
            value={departmentFilter}
            onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }}
            className="w-48"
          />
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="w-48"
          />
        </div>

        {isLoading ? (
          <Loader text="Loading instruments..." />
        ) : isError ? (
          <EmptyState
            title="Failed to load instruments"
            description="There was an error loading the instrument list. The API server may not be running."
            icon={<Gauge className="h-8 w-8 text-gray-400" />}
          />
        ) : instruments.length === 0 ? (
          <EmptyState
            title="No instruments found"
            description={search ? 'Try adjusting your search criteria' : 'Get started by adding your first instrument'}
            icon={<Gauge className="h-8 w-8 text-gray-400" />}
            action={
              !search ? (
                <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate} size="sm">
                  Add Instrument
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <Table
              columns={columns}
              data={instruments}
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingInstrument ? 'Edit Instrument' : 'Add New Instrument'}
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
              {editingInstrument ? 'Update Instrument' : 'Create Instrument'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Instrument Name *"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            error={errors.name}
            placeholder="Enter instrument name"
          />
          <Input
            label="Instrument Code *"
            value={form.code}
            onChange={(e) => updateField('code', e.target.value.toUpperCase())}
            error={errors.code}
            placeholder="e.g., INST-001"
            disabled={!!editingInstrument}
          />
          <Select
            label="Department *"
            options={formDepartmentOptions}
            value={form.departmentId}
            onChange={(e) => updateField('departmentId', e.target.value)}
            error={errors.departmentId}
          />
          <Input
            label="Make / Manufacturer"
            value={form.manufacturer}
            onChange={(e) => updateField('manufacturer', e.target.value)}
            placeholder="e.g., Shimadzu"
          />
          <Input
            label="Model"
            value={form.model}
            onChange={(e) => updateField('model', e.target.value)}
            placeholder="e.g., UV-1800"
          />
          <Input
            label="Serial Number"
            value={form.serialNumber}
            onChange={(e) => updateField('serialNumber', e.target.value)}
            placeholder="Instrument serial number"
          />
          <Input
            label="Calibration Date"
            type="date"
            value={form.calibrationDate}
            onChange={(e) => updateField('calibrationDate', e.target.value)}
          />
          <Input
            label="Next Calibration Date"
            type="date"
            value={form.nextCalibrationDate}
            onChange={(e) => updateField('nextCalibrationDate', e.target.value)}
          />
          <Input
            label="Calibration Certificate"
            value={form.calibrationCertificate}
            onChange={(e) => updateField('calibrationCertificate', e.target.value)}
            placeholder="Certificate file path or reference"
          />
          <Select
            label="Status"
            options={FORM_STATUS_OPTIONS}
            value={form.status}
            onChange={(e) => updateField('status', e.target.value as InstrumentStatus)}
          />
        </div>
      </Modal>

      {/* Deactivate Confirmation */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeletingInstrument(null); }}
        onConfirm={() => deletingInstrument && deleteMutation.mutate(deletingInstrument.id)}
        title="Deactivate Instrument"
        message={`Are you sure you want to deactivate "${deletingInstrument?.name}"? This instrument will no longer be available for use.`}
        confirmText="Deactivate"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
