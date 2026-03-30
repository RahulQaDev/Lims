import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Edit2,
  Trash2,
  Package,
  AlertTriangle,
  Clock,
  ArrowUpDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { get, post, put, del } from '../../services/api';
import type { InventoryItem, PaginatedResponse, ApiResponse } from '../../types';
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

type InventoryCategory = 'all' | 'chemical' | 'reagent' | 'consumable' | 'glassware' | 'reference_standard' | 'solvent' | 'gas';

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: 'chemical', label: 'Chemical' },
  { value: 'reagent', label: 'Reagent' },
  { value: 'consumable', label: 'Consumable' },
  { value: 'glassware', label: 'Glassware' },
  { value: 'reference_standard', label: 'Reference Standard' },
  { value: 'solvent', label: 'Solvent' },
  { value: 'gas', label: 'Gas' },
];

const UNIT_OPTIONS = [
  { value: 'nos', label: 'Nos' },
  { value: 'ml', label: 'mL' },
  { value: 'l', label: 'L' },
  { value: 'g', label: 'g' },
  { value: 'kg', label: 'kg' },
  { value: 'mg', label: 'mg' },
  { value: 'pack', label: 'Pack' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'box', label: 'Box' },
];

interface InventoryFormData {
  name: string;
  code: string;
  category: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  location: string;
  expiryDate: string;
  departmentName: string;
}

interface StockAdjustmentData {
  type: 'add' | 'remove';
  quantity: number;
  reason: string;
}

const emptyForm: InventoryFormData = {
  name: '',
  code: '',
  category: 'chemical',
  unit: 'nos',
  currentStock: 0,
  minimumStock: 0,
  maximumStock: 0,
  location: '',
  expiryDate: '',
  departmentName: '',
};

const emptyAdjustment: StockAdjustmentData = {
  type: 'add',
  quantity: 0,
  reason: '',
};

// Mock data
const mockInventory: (InventoryItem & { maximumStock?: number })[] = [
  { id: '1', name: 'Acetonitrile HPLC Grade', code: 'CHM-001', category: 'solvent', currentStock: 15, minimumStock: 5, maximumStock: 50, unit: 'l', location: 'Chemical Store - Shelf A1', expiryDate: '2027-06-15', departmentName: 'HPLC', createdAt: '2025-01-15', updatedAt: '2026-03-20', lastRestockedAt: '2026-03-01' },
  { id: '2', name: 'Nutrient Agar', code: 'REA-001', category: 'reagent', currentStock: 3, minimumStock: 5, maximumStock: 20, unit: 'kg', location: 'Micro Lab - Cold Room', expiryDate: '2026-09-30', departmentName: 'Micro Biology', createdAt: '2025-02-10', updatedAt: '2026-03-18', lastRestockedAt: '2026-02-15' },
  { id: '3', name: 'Volumetric Flask 100ml', code: 'GLS-001', category: 'glassware', currentStock: 25, minimumStock: 10, maximumStock: 50, unit: 'nos', location: 'Glassware Store - Rack B3', departmentName: 'General', createdAt: '2025-01-20', updatedAt: '2026-03-15' },
  { id: '4', name: 'Nitric Acid AR Grade', code: 'CHM-002', category: 'chemical', currentStock: 8, minimumStock: 10, maximumStock: 30, unit: 'l', location: 'Chemical Store - Shelf A3', expiryDate: '2028-12-31', departmentName: 'ICPMS', createdAt: '2025-03-01', updatedAt: '2026-03-22', lastRestockedAt: '2026-01-10' },
  { id: '5', name: 'Lead Standard 1000ppm', code: 'REF-001', category: 'reference_standard', currentStock: 2, minimumStock: 2, maximumStock: 10, unit: 'bottle', location: 'Standard Store - Safe', expiryDate: '2026-06-30', departmentName: 'ICPMS', createdAt: '2025-04-01', updatedAt: '2026-03-10', lastRestockedAt: '2025-12-20' },
  { id: '6', name: 'Disposable Petri Dish', code: 'CON-001', category: 'consumable', currentStock: 500, minimumStock: 200, maximumStock: 1000, unit: 'nos', location: 'Consumable Store - Shelf C1', departmentName: 'Micro Biology', createdAt: '2025-05-15', updatedAt: '2026-03-19', lastRestockedAt: '2026-03-05' },
  { id: '7', name: 'Methanol HPLC Grade', code: 'CHM-003', category: 'solvent', currentStock: 20, minimumStock: 10, maximumStock: 40, unit: 'l', location: 'Chemical Store - Shelf A1', expiryDate: '2027-03-31', departmentName: 'HPLC', createdAt: '2025-06-01', updatedAt: '2026-03-21', lastRestockedAt: '2026-02-28' },
  { id: '8', name: 'Helium Gas (UHP)', code: 'GAS-001', category: 'gas', currentStock: 1, minimumStock: 2, maximumStock: 5, unit: 'nos', location: 'Gas Yard', departmentName: 'GC', createdAt: '2025-07-10', updatedAt: '2026-03-17', lastRestockedAt: '2026-01-25' },
];

function getStockStatus(current: number, min: number): { label: string; variant: 'green' | 'yellow' | 'red' } {
  if (current <= 0) return { label: 'Out of Stock', variant: 'red' };
  if (current < min) return { label: 'Low Stock', variant: 'red' };
  if (current <= min * 1.5) return { label: 'Near Minimum', variant: 'yellow' };
  return { label: 'In Stock', variant: 'green' };
}

function getCategoryLabel(cat: string): string {
  const map: Record<string, string> = {
    chemical: 'Chemical',
    reagent: 'Reagent',
    consumable: 'Consumable',
    glassware: 'Glassware',
    reference_standard: 'Ref. Standard',
    solvent: 'Solvent',
    gas: 'Gas',
  };
  return map[cat] || cat;
}

function getCategoryBadgeVariant(cat: string): 'blue' | 'green' | 'purple' | 'orange' | 'teal' | 'cyan' | 'yellow' {
  const map: Record<string, 'blue' | 'green' | 'purple' | 'orange' | 'teal' | 'cyan' | 'yellow'> = {
    chemical: 'blue',
    reagent: 'purple',
    consumable: 'green',
    glassware: 'cyan',
    reference_standard: 'orange',
    solvent: 'teal',
    gas: 'yellow',
  };
  return map[cat] || 'blue';
}

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<InventoryCategory>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<(InventoryItem & { maximumStock?: number }) | null>(null);
  const [adjustingItem, setAdjustingItem] = useState<InventoryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<InventoryFormData>(emptyForm);
  const [adjustForm, setAdjustForm] = useState<StockAdjustmentData>(emptyAdjustment);
  const [errors, setErrors] = useState<Partial<Record<keyof InventoryFormData, string>>>({});

  const pageSize = 25;

  // Filter mock data
  const filteredItems = mockInventory.filter((item) => {
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase()) &&
        !item.code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const paginatedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  const lowStockCount = mockInventory.filter((i) => i.currentStock < i.minimumStock).length;
  const expiringCount = mockInventory.filter((i) => {
    if (!i.expiryDate) return false;
    const expiry = new Date(i.expiryDate);
    const threeMonths = new Date();
    threeMonths.setMonth(threeMonths.getMonth() + 3);
    return expiry <= threeMonths;
  }).length;

  const openCreate = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (item: InventoryItem & { maximumStock?: number }) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      code: item.code,
      category: item.category,
      unit: item.unit,
      currentStock: item.currentStock,
      minimumStock: item.minimumStock,
      maximumStock: item.maximumStock || 0,
      location: item.location || '',
      expiryDate: item.expiryDate || '',
      departmentName: item.departmentName || '',
    });
    setErrors({});
    setModalOpen(true);
  };

  const openAdjust = (item: InventoryItem) => {
    setAdjustingItem(item);
    setAdjustForm(emptyAdjustment);
    setAdjustModalOpen(true);
  };

  const openDelete = (item: InventoryItem) => {
    setDeletingItem(item);
    setDeleteOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
    setForm(emptyForm);
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof InventoryFormData, string>> = {};
    if (!form.name.trim()) newErrors.name = 'Item name is required';
    if (!form.code.trim()) newErrors.code = 'Item code is required';
    if (!form.category) newErrors.category = 'Category is required';
    if (form.minimumStock < 0) newErrors.minimumStock = 'Cannot be negative';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    toast.success(editingItem ? 'Item updated successfully' : 'Item created successfully');
    closeModal();
  };

  const handleAdjust = () => {
    if (adjustForm.quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }
    if (!adjustForm.reason.trim()) {
      toast.error('Reason is required for stock adjustment');
      return;
    }
    toast.success(`Stock ${adjustForm.type === 'add' ? 'added' : 'removed'} successfully`);
    setAdjustModalOpen(false);
    setAdjustingItem(null);
  };

  const handleDelete = () => {
    toast.success('Item deleted successfully');
    setDeleteOpen(false);
    setDeletingItem(null);
  };

  const updateField = <K extends keyof InventoryFormData>(field: K, value: InventoryFormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const columns: Column<InventoryItem & { maximumStock?: number }>[] = [
    { key: 'code', header: 'Code', sortable: true, render: (row) => <span className="font-medium text-gray-900 font-mono">{row.code}</span> },
    { key: 'name', header: 'Name', sortable: true, render: (row) => <span className="font-medium text-gray-900">{row.name}</span> },
    {
      key: 'category',
      header: 'Category',
      render: (row) => <Badge variant={getCategoryBadgeVariant(row.category)}>{getCategoryLabel(row.category)}</Badge>,
    },
    { key: 'unit', header: 'Unit', render: (row) => <span className="text-gray-500 uppercase text-xs">{row.unit}</span> },
    {
      key: 'currentStock',
      header: 'Current',
      sortable: true,
      render: (row) => {
        const status = getStockStatus(row.currentStock, row.minimumStock);
        return (
          <span className={`font-semibold ${status.variant === 'red' ? 'text-red-600' : status.variant === 'yellow' ? 'text-yellow-600' : 'text-gray-900'}`}>
            {row.currentStock}
          </span>
        );
      },
    },
    { key: 'minimumStock', header: 'Min', render: (row) => <span className="text-gray-500">{row.minimumStock}</span> },
    { key: 'maximumStock', header: 'Max', render: (row) => <span className="text-gray-500">{row.maximumStock || '---'}</span> },
    { key: 'location', header: 'Storage', render: (row) => <span className="text-gray-500 text-xs">{row.location || '---'}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const status = getStockStatus(row.currentStock, row.minimumStock);
        return <Badge variant={status.variant}>{status.label}</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); openAdjust(row); }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
            title="Adjust Stock"
          >
            <ArrowUpDown className="h-4 w-4" />
          </button>
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
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage lab chemicals, reagents, and consumables</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add Item
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={<Package className="h-5 w-5" />} label="Total Items" value={mockInventory.length} color="blue" />
        <StatCard icon={<AlertTriangle className="h-5 w-5" />} label="Low Stock Alerts" value={lowStockCount} color="red" />
        <StatCard icon={<Clock className="h-5 w-5" />} label="Expiring Soon" value={expiringCount} color="orange" />
      </div>

      {/* Filters & Table */}
      <Card noPadding>
        <div className="flex items-center gap-4 p-4 border-b border-gray-100">
          <SearchInput
            onSearch={(val) => { setSearch(val); setPage(1); }}
            placeholder="Search items by name, code..."
            className="w-80"
          />
          <Select
            options={CATEGORY_OPTIONS}
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value as InventoryCategory); setPage(1); }}
            className="w-48"
          />
        </div>

        {paginatedItems.length === 0 ? (
          <EmptyState
            title="No inventory items found"
            description={search ? 'Try adjusting your search criteria' : 'Get started by adding your first item'}
            icon={<Package className="h-8 w-8 text-gray-400" />}
            action={
              !search ? (
                <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate} size="sm">
                  Add Item
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <Table columns={columns} data={paginatedItems} keyExtractor={(row) => row.id} />
            <div className="px-4 border-t border-gray-100">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={filteredItems.length}
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
        title={editingItem ? 'Edit Item' : 'Add New Item'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSubmit}>
              {editingItem ? 'Update Item' : 'Create Item'}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Item Name *"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            error={errors.name}
            placeholder="Enter item name"
          />
          <Input
            label="Item Code *"
            value={form.code}
            onChange={(e) => updateField('code', e.target.value.toUpperCase())}
            error={errors.code}
            placeholder="e.g., CHM-001"
            disabled={!!editingItem}
          />
          <Select
            label="Category *"
            options={CATEGORY_OPTIONS.filter((o) => o.value !== 'all')}
            value={form.category}
            onChange={(e) => updateField('category', e.target.value)}
          />
          <Select
            label="Unit *"
            options={UNIT_OPTIONS}
            value={form.unit}
            onChange={(e) => updateField('unit', e.target.value)}
          />
          <Input
            label="Current Stock"
            type="number"
            value={String(form.currentStock)}
            onChange={(e) => updateField('currentStock', Number(e.target.value))}
            placeholder="0"
          />
          <Input
            label="Minimum Stock"
            type="number"
            value={String(form.minimumStock)}
            onChange={(e) => updateField('minimumStock', Number(e.target.value))}
            error={errors.minimumStock}
            placeholder="0"
          />
          <Input
            label="Maximum Stock"
            type="number"
            value={String(form.maximumStock)}
            onChange={(e) => updateField('maximumStock', Number(e.target.value))}
            placeholder="0"
          />
          <Input
            label="Storage Location"
            value={form.location}
            onChange={(e) => updateField('location', e.target.value)}
            placeholder="e.g., Chemical Store - Shelf A1"
          />
          <Input
            label="Expiry Date"
            type="date"
            value={form.expiryDate}
            onChange={(e) => updateField('expiryDate', e.target.value)}
          />
          <Input
            label="Department"
            value={form.departmentName}
            onChange={(e) => updateField('departmentName', e.target.value)}
            placeholder="e.g., HPLC"
          />
        </div>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={adjustModalOpen}
        onClose={() => { setAdjustModalOpen(false); setAdjustingItem(null); }}
        title={`Adjust Stock - ${adjustingItem?.name || ''}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => { setAdjustModalOpen(false); setAdjustingItem(null); }}>Cancel</Button>
            <Button onClick={handleAdjust}>Submit Adjustment</Button>
          </>
        }
      >
        <div className="space-y-4">
          {adjustingItem && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-500">Current Stock: <span className="font-semibold text-gray-900">{adjustingItem.currentStock} {adjustingItem.unit}</span></p>
            </div>
          )}
          <Select
            label="Adjustment Type"
            options={[
              { value: 'add', label: 'Add Stock' },
              { value: 'remove', label: 'Remove Stock' },
            ]}
            value={adjustForm.type}
            onChange={(e) => setAdjustForm((prev) => ({ ...prev, type: e.target.value as 'add' | 'remove' }))}
          />
          <Input
            label="Quantity *"
            type="number"
            value={String(adjustForm.quantity)}
            onChange={(e) => setAdjustForm((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
            placeholder="Enter quantity"
          />
          <Input
            label="Reason *"
            value={adjustForm.reason}
            onChange={(e) => setAdjustForm((prev) => ({ ...prev, reason: e.target.value }))}
            placeholder="e.g., Received from vendor PO-2026-001"
          />
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeletingItem(null); }}
        onConfirm={handleDelete}
        title="Delete Item"
        message={`Are you sure you want to delete "${deletingItem?.name}"? This action cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  );
}
