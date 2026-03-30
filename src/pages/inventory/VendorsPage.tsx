import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Edit2,
  Trash2,
  Truck,
  Star,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { get, post, put, del } from '../../services/api';
import type { Vendor, PaginatedResponse, ApiResponse } from '../../types';
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

interface VendorFormData {
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
  bankName: string;
  bankAccount: string;
  bankIfsc: string;
  rating: number;
  isActive: boolean;
}

const emptyForm: VendorFormData = {
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
  bankName: '',
  bankAccount: '',
  bankIfsc: '',
  rating: 0,
  isActive: true,
};

// Extended mock vendor type with extra fields
interface VendorExtended extends Vendor {
  city?: string;
  state?: string;
  pincode?: string;
  pan?: string;
  bankName?: string;
  bankAccount?: string;
  bankIfsc?: string;
}

const mockVendors: VendorExtended[] = [
  { id: '1', name: 'SRL Chemicals', code: 'VND-001', contactPerson: 'Ravi Mehta', email: 'ravi@srlchem.com', phone: '9876543210', address: 'Plot 12, MIDC, Andheri East', city: 'Mumbai', state: 'Maharashtra', pincode: '400093', gstin: '27AAACS1234A1Z5', pan: 'AAACS1234A', bankName: 'HDFC Bank', bankAccount: '50200012345678', bankIfsc: 'HDFC0001234', rating: 5, isActive: true, createdAt: '2025-01-10', updatedAt: '2026-03-20' },
  { id: '2', name: 'Merck India Ltd', code: 'VND-002', contactPerson: 'Sunita Rao', email: 'sunita@merck.co.in', phone: '9988776655', address: 'Survey No 18, Taloja MIDC', city: 'Navi Mumbai', state: 'Maharashtra', pincode: '410208', gstin: '27AAACM5678B2Z3', rating: 4, isActive: true, createdAt: '2025-02-15', updatedAt: '2026-03-18' },
  { id: '3', name: 'Fisher Scientific', code: 'VND-003', contactPerson: 'Ankit Joshi', email: 'ankit@fisher.com', phone: '9112233445', address: '15/2, Whitefield Industrial Area', city: 'Bengaluru', state: 'Karnataka', pincode: '560066', rating: 4, isActive: true, createdAt: '2025-03-20', updatedAt: '2026-03-15' },
  { id: '4', name: 'HiMedia Labs', code: 'VND-004', contactPerson: 'Deepak Kulkarni', email: 'deepak@himedia.com', phone: '9223344556', address: '23, LBS Marg, Vikhroli West', city: 'Mumbai', state: 'Maharashtra', pincode: '400083', gstin: '27AAACH9012C3Z1', rating: 3, isActive: true, createdAt: '2025-04-01', updatedAt: '2026-03-10' },
  { id: '5', name: 'Sigma Aldrich', code: 'VND-005', contactPerson: 'Kavita Nair', email: 'kavita@sigma.com', phone: '9334455667', address: '9th Floor, Godrej BKC', city: 'Mumbai', state: 'Maharashtra', pincode: '400051', rating: 5, isActive: true, createdAt: '2025-05-10', updatedAt: '2026-03-08' },
  { id: '6', name: 'Agilent Technologies', code: 'VND-006', contactPerson: 'Sanjay Deshmukh', email: 'sanjay@agilent.com', phone: '9445566778', address: 'DLF Cyber City, Phase II', city: 'Gurgaon', state: 'Haryana', pincode: '122002', rating: 4, isActive: true, createdAt: '2025-06-15', updatedAt: '2026-03-05' },
  { id: '7', name: 'Qualigens Fine Chemicals', code: 'VND-007', contactPerson: 'Mohan Pillai', email: 'mohan@qualigens.com', phone: '9556677889', address: 'Old MIDC, Ambernath', city: 'Thane', state: 'Maharashtra', pincode: '421501', rating: 2, isActive: false, createdAt: '2025-07-20', updatedAt: '2026-02-28' },
];

function StarRating({ rating, onChange }: { rating: number; onChange?: (r: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          className={`${onChange ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <Star
            className={`h-4 w-4 ${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function VendorsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorExtended | null>(null);
  const [deletingVendor, setDeletingVendor] = useState<VendorExtended | null>(null);
  const [form, setForm] = useState<VendorFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof VendorFormData, string>>>({});

  const pageSize = 25;

  const filteredVendors = mockVendors.filter((v) => {
    if (search && !v.name.toLowerCase().includes(search.toLowerCase()) &&
        !v.code.toLowerCase().includes(search.toLowerCase()) &&
        !v.contactPerson.toLowerCase().includes(search.toLowerCase()) &&
        !(v.city || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredVendors.length / pageSize);
  const paginatedVendors = filteredVendors.slice((page - 1) * pageSize, page * pageSize);

  const openCreate = () => {
    setEditingVendor(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (vendor: VendorExtended) => {
    setEditingVendor(vendor);
    setForm({
      name: vendor.name,
      code: vendor.code,
      contactPerson: vendor.contactPerson,
      email: vendor.email,
      phone: vendor.phone,
      address: vendor.address,
      city: vendor.city || '',
      state: vendor.state || '',
      pincode: vendor.pincode || '',
      gstin: vendor.gstin || '',
      pan: vendor.pan || '',
      bankName: vendor.bankName || '',
      bankAccount: vendor.bankAccount || '',
      bankIfsc: vendor.bankIfsc || '',
      rating: vendor.rating || 0,
      isActive: vendor.isActive,
    });
    setErrors({});
    setModalOpen(true);
  };

  const openDelete = (vendor: VendorExtended) => {
    setDeletingVendor(vendor);
    setDeleteOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingVendor(null);
    setForm(emptyForm);
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof VendorFormData, string>> = {};
    if (!form.name.trim()) newErrors.name = 'Vendor name is required';
    if (!form.code.trim()) newErrors.code = 'Vendor code is required';
    if (!form.contactPerson.trim()) newErrors.contactPerson = 'Contact person is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Invalid email format';
    if (!form.phone.trim()) newErrors.phone = 'Phone is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    toast.success(editingVendor ? 'Vendor updated successfully' : 'Vendor created successfully');
    closeModal();
  };

  const handleDelete = () => {
    toast.success('Vendor deleted successfully');
    setDeleteOpen(false);
    setDeletingVendor(null);
  };

  const updateField = <K extends keyof VendorFormData>(field: K, value: VendorFormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const columns: Column<VendorExtended>[] = [
    { key: 'code', header: 'Code', sortable: true, render: (row) => <span className="font-medium text-gray-900 font-mono">{row.code}</span> },
    { key: 'name', header: 'Name', sortable: true, render: (row) => <span className="font-medium text-gray-900">{row.name}</span> },
    { key: 'contactPerson', header: 'Contact' },
    { key: 'city', header: 'City', sortable: true, render: (row) => <span className="text-gray-500">{row.city || '---'}</span> },
    { key: 'phone', header: 'Phone' },
    {
      key: 'rating',
      header: 'Rating',
      render: (row) => <StarRating rating={row.rating || 0} />,
    },
    {
      key: 'isActive',
      header: 'Approved',
      render: (row) => (
        <Badge variant={row.isActive ? 'green' : 'gray'}>
          {row.isActive ? 'Approved' : 'Inactive'}
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <p className="text-sm text-gray-500 mt-1">Manage vendor directory and approval status</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add Vendor
        </Button>
      </div>

      {/* Table */}
      <Card noPadding>
        <div className="flex items-center gap-4 p-4 border-b border-gray-100">
          <SearchInput
            onSearch={(val) => { setSearch(val); setPage(1); }}
            placeholder="Search vendors by name, code, city..."
            className="w-80"
          />
        </div>

        {paginatedVendors.length === 0 ? (
          <EmptyState
            title="No vendors found"
            description={search ? 'Try adjusting your search criteria' : 'Get started by adding your first vendor'}
            icon={<Truck className="h-8 w-8 text-gray-400" />}
            action={
              !search ? (
                <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate} size="sm">
                  Add Vendor
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <Table columns={columns} data={paginatedVendors} keyExtractor={(row) => row.id} />
            <div className="px-4 border-t border-gray-100">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={filteredVendors.length}
                pageSize={pageSize}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSubmit}>
              {editingVendor ? 'Update Vendor' : 'Create Vendor'}
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Vendor Name *"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                error={errors.name}
                placeholder="Enter vendor name"
              />
              <Input
                label="Vendor Code *"
                value={form.code}
                onChange={(e) => updateField('code', e.target.value.toUpperCase())}
                error={errors.code}
                placeholder="e.g., VND-001"
                disabled={!!editingVendor}
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
              <Input label="City" value={form.city} onChange={(e) => updateField('city', e.target.value)} placeholder="City" />
              <Input label="State" value={form.state} onChange={(e) => updateField('state', e.target.value)} placeholder="State" />
              <Input label="Pincode" value={form.pincode} onChange={(e) => updateField('pincode', e.target.value)} placeholder="Pincode" />
              <Input label="PAN" value={form.pan} onChange={(e) => updateField('pan', e.target.value.toUpperCase())} placeholder="PAN number" />
            </div>
          </div>

          {/* Bank Details */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Bank Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Bank Name" value={form.bankName} onChange={(e) => updateField('bankName', e.target.value)} placeholder="Bank name" />
              <Input label="Account Number" value={form.bankAccount} onChange={(e) => updateField('bankAccount', e.target.value)} placeholder="Account number" />
              <Input label="IFSC Code" value={form.bankIfsc} onChange={(e) => updateField('bankIfsc', e.target.value.toUpperCase())} placeholder="IFSC code" />
            </div>
          </div>

          {/* Rating & Status */}
          <div className="flex items-center gap-8">
            <div>
              <span className="text-sm font-medium text-gray-700 block mb-2">Rating</span>
              <StarRating rating={form.rating} onChange={(r) => updateField('rating', r)} />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="vendorActive"
                checked={form.isActive}
                onChange={(e) => updateField('isActive', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="vendorActive" className="text-sm text-gray-700">Approved Vendor</label>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeletingVendor(null); }}
        onConfirm={handleDelete}
        title="Delete Vendor"
        message={`Are you sure you want to delete "${deletingVendor?.name}"? This action cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  );
}
