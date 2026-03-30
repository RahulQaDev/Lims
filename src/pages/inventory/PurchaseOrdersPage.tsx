import { useState } from 'react';
import {
  Plus,
  Eye,
  FileText,
  ShoppingCart,
  Clock,
  CheckCircle,
  Package,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { PurchaseOrder, PurchaseOrderItem } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Table, { type Column } from '../../components/ui/Table';
import SearchInput from '../../components/ui/SearchInput';
import Pagination from '../../components/ui/Pagination';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate, formatCurrency } from '../../utils/formatters';

type POStatus = 'all' | 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'RECEIVED' | 'CANCELLED';

const STATUS_TABS: { value: POStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'RECEIVED', label: 'Received' },
];

const statusBadgeVariant: Record<string, 'gray' | 'yellow' | 'green' | 'blue' | 'red'> = {
  DRAFT: 'gray',
  PENDING_APPROVAL: 'yellow',
  APPROVED: 'green',
  RECEIVED: 'blue',
  CANCELLED: 'red',
};

const VENDOR_OPTIONS = [
  { value: '', label: 'Select Vendor' },
  { value: 'v1', label: 'SRL Chemicals' },
  { value: 'v2', label: 'Merck India Ltd' },
  { value: 'v3', label: 'Fisher Scientific' },
  { value: 'v4', label: 'HiMedia Labs' },
  { value: 'v5', label: 'Sigma Aldrich' },
];

interface POFormItem {
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

interface POFormData {
  vendorId: string;
  expectedDelivery: string;
  remarks: string;
  items: POFormItem[];
}

const emptyPOForm: POFormData = {
  vendorId: '',
  expectedDelivery: '',
  remarks: '',
  items: [{ itemName: '', quantity: 0, unit: 'nos', unitPrice: 0 }],
};

// Mock data
const mockPOs: PurchaseOrder[] = [
  {
    id: '1', poNumber: 'PO-2026-0042', vendorId: 'v1', vendorName: 'SRL Chemicals',
    items: [
      { id: 'i1', poId: '1', itemName: 'Acetonitrile HPLC', quantity: 20, unit: 'l', unitPrice: 2500, totalPrice: 50000 },
      { id: 'i2', poId: '1', itemName: 'Methanol HPLC', quantity: 20, unit: 'l', unitPrice: 1800, totalPrice: 36000 },
    ],
    totalAmount: 86000, status: 'APPROVED', orderedBy: 'Dr. Rajesh Kumar', orderedAt: '2026-03-20',
    expectedDelivery: '2026-03-28', createdAt: '2026-03-20', updatedAt: '2026-03-21',
  },
  {
    id: '2', poNumber: 'PO-2026-0041', vendorId: 'v2', vendorName: 'Merck India Ltd',
    items: [
      { id: 'i3', poId: '2', itemName: 'Lead Standard 1000ppm', quantity: 5, unit: 'bottle', unitPrice: 4500, totalPrice: 22500 },
    ],
    totalAmount: 22500, status: 'PENDING_APPROVAL', orderedBy: 'Priya Sharma', orderedAt: '2026-03-22',
    expectedDelivery: '2026-04-05', createdAt: '2026-03-22', updatedAt: '2026-03-22',
  },
  {
    id: '3', poNumber: 'PO-2026-0040', vendorId: 'v4', vendorName: 'HiMedia Labs',
    items: [
      { id: 'i4', poId: '3', itemName: 'Nutrient Agar', quantity: 10, unit: 'kg', unitPrice: 1200, totalPrice: 12000 },
      { id: 'i5', poId: '3', itemName: 'MacConkey Agar', quantity: 5, unit: 'kg', unitPrice: 1500, totalPrice: 7500 },
      { id: 'i6', poId: '3', itemName: 'Petri Dishes', quantity: 1000, unit: 'nos', unitPrice: 5, totalPrice: 5000 },
    ],
    totalAmount: 24500, status: 'RECEIVED', orderedBy: 'Amit Patel', orderedAt: '2026-03-15',
    expectedDelivery: '2026-03-22', receivedAt: '2026-03-21', createdAt: '2026-03-15', updatedAt: '2026-03-21',
  },
  {
    id: '4', poNumber: 'PO-2026-0039', vendorId: 'v3', vendorName: 'Fisher Scientific',
    items: [
      { id: 'i7', poId: '4', itemName: 'Volumetric Flask 100ml', quantity: 10, unit: 'nos', unitPrice: 850, totalPrice: 8500 },
    ],
    totalAmount: 8500, status: 'DRAFT', orderedBy: 'Neha Singh', orderedAt: '2026-03-23',
    createdAt: '2026-03-23', updatedAt: '2026-03-23',
  },
  {
    id: '5', poNumber: 'PO-2026-0038', vendorId: 'v5', vendorName: 'Sigma Aldrich',
    items: [
      { id: 'i8', poId: '5', itemName: 'Pesticide Mix Standard', quantity: 2, unit: 'bottle', unitPrice: 12000, totalPrice: 24000 },
    ],
    totalAmount: 24000, status: 'APPROVED', orderedBy: 'Vikram Desai', orderedAt: '2026-03-18',
    expectedDelivery: '2026-04-01', createdAt: '2026-03-18', updatedAt: '2026-03-19',
  },
];

export default function PurchaseOrdersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<POStatus>('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [poForm, setPOForm] = useState<POFormData>(emptyPOForm);

  const pageSize = 25;

  const filteredPOs = mockPOs.filter((po) => {
    if (statusFilter !== 'all' && po.status !== statusFilter) return false;
    if (search && !po.poNumber.toLowerCase().includes(search.toLowerCase()) &&
        !po.vendorName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredPOs.length / pageSize);
  const paginatedPOs = filteredPOs.slice((page - 1) * pageSize, page * pageSize);

  const addItem = () => {
    setPOForm((prev) => ({
      ...prev,
      items: [...prev.items, { itemName: '', quantity: 0, unit: 'nos', unitPrice: 0 }],
    }));
  };

  const removeItem = (index: number) => {
    setPOForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index: number, field: keyof POFormItem, value: string | number) => {
    setPOForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  };

  const totalAmount = poForm.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const handleCreate = () => {
    if (!poForm.vendorId) {
      toast.error('Please select a vendor');
      return;
    }
    if (poForm.items.some((i) => !i.itemName.trim())) {
      toast.error('All items must have a name');
      return;
    }
    toast.success('Purchase order created successfully');
    setCreateModalOpen(false);
    setPOForm(emptyPOForm);
  };

  const viewPO = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setViewModalOpen(true);
  };

  const columns: Column<PurchaseOrder>[] = [
    { key: 'poNumber', header: 'PO Number', sortable: true, render: (row) => <span className="font-medium text-blue-600">{row.poNumber}</span> },
    { key: 'vendorName', header: 'Vendor', sortable: true, render: (row) => <span className="font-medium text-gray-900">{row.vendorName}</span> },
    { key: 'orderedAt', header: 'Order Date', sortable: true, render: (row) => <span className="text-gray-500">{formatDate(row.orderedAt)}</span> },
    { key: 'expectedDelivery', header: 'Expected Delivery', render: (row) => <span className="text-gray-500">{row.expectedDelivery ? formatDate(row.expectedDelivery) : '---'}</span> },
    { key: 'totalAmount', header: 'Total Amount', sortable: true, render: (row) => <span className="font-medium text-gray-900">{formatCurrency(row.totalAmount)}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge variant={statusBadgeVariant[row.status] || 'gray'}>
          {row.status.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); viewPO(row); }}
          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          title="View Details"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Manage procurement and purchase orders</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => { setPOForm(emptyPOForm); setCreateModalOpen(true); }}>
          Create PO
        </Button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setStatusFilter(tab.value); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            {tab.value !== 'all' && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                statusFilter === tab.value ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                {mockPOs.filter((po) => po.status === tab.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card noPadding>
        <div className="flex items-center gap-4 p-4 border-b border-gray-100">
          <SearchInput
            onSearch={(val) => { setSearch(val); setPage(1); }}
            placeholder="Search by PO number, vendor..."
            className="w-80"
          />
        </div>

        {paginatedPOs.length === 0 ? (
          <EmptyState
            title="No purchase orders found"
            description={search || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Create your first purchase order'}
            icon={<ShoppingCart className="h-8 w-8 text-gray-400" />}
          />
        ) : (
          <>
            <Table columns={columns} data={paginatedPOs} keyExtractor={(row) => row.id} onRowClick={viewPO} />
            <div className="px-4 border-t border-gray-100">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={filteredPOs.length}
                pageSize={pageSize}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </Card>

      {/* Create PO Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Purchase Order"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create PO</Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Vendor *"
              options={VENDOR_OPTIONS}
              value={poForm.vendorId}
              onChange={(e) => setPOForm((prev) => ({ ...prev, vendorId: e.target.value }))}
            />
            <Input
              label="Expected Delivery"
              type="date"
              value={poForm.expectedDelivery}
              onChange={(e) => setPOForm((prev) => ({ ...prev, expectedDelivery: e.target.value }))}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Items</h3>
              <Button variant="outline" size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={addItem}>
                Add Item
              </Button>
            </div>
            <div className="space-y-3">
              {poForm.items.map((item, index) => (
                <div key={index} className="flex items-end gap-3 bg-gray-50 p-3 rounded-lg">
                  <Input
                    label="Item Name"
                    value={item.itemName}
                    onChange={(e) => updateItem(index, 'itemName', e.target.value)}
                    placeholder="Item name"
                    className="flex-1"
                  />
                  <Input
                    label="Qty"
                    type="number"
                    value={String(item.quantity)}
                    onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                    className="w-20"
                  />
                  <Input
                    label="Unit"
                    value={item.unit}
                    onChange={(e) => updateItem(index, 'unit', e.target.value)}
                    className="w-20"
                  />
                  <Input
                    label="Rate"
                    type="number"
                    value={String(item.unitPrice)}
                    onChange={(e) => updateItem(index, 'unitPrice', Number(e.target.value))}
                    className="w-28"
                  />
                  <div className="pb-0.5">
                    <span className="text-sm font-medium text-gray-700 block mb-1">Total</span>
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(item.quantity * item.unitPrice)}</span>
                  </div>
                  {poForm.items.length > 1 && (
                    <button
                      onClick={() => removeItem(index)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors mb-0.5"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4 pt-3 border-t border-gray-200">
              <div className="text-right">
                <span className="text-sm text-gray-500">Grand Total: </span>
                <span className="text-lg font-bold text-gray-900">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>

          <Input
            label="Remarks"
            value={poForm.remarks}
            onChange={(e) => setPOForm((prev) => ({ ...prev, remarks: e.target.value }))}
            placeholder="Additional notes..."
          />
        </div>
      </Modal>

      {/* View PO Detail Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => { setViewModalOpen(false); setSelectedPO(null); }}
        title={`Purchase Order - ${selectedPO?.poNumber || ''}`}
        size="lg"
        footer={
          <Button variant="ghost" onClick={() => { setViewModalOpen(false); setSelectedPO(null); }}>Close</Button>
        }
      >
        {selectedPO && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-xs text-gray-500 block">PO Number</span>
                <span className="text-sm font-semibold text-gray-900">{selectedPO.poNumber}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Vendor</span>
                <span className="text-sm font-semibold text-gray-900">{selectedPO.vendorName}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Order Date</span>
                <span className="text-sm text-gray-700">{formatDate(selectedPO.orderedAt)}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Status</span>
                <Badge variant={statusBadgeVariant[selectedPO.status] || 'gray'}>
                  {selectedPO.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Expected Delivery</span>
                <span className="text-sm text-gray-700">{selectedPO.expectedDelivery ? formatDate(selectedPO.expectedDelivery) : '---'}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Ordered By</span>
                <span className="text-sm text-gray-700">{selectedPO.orderedBy}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 block">Total Amount</span>
                <span className="text-sm font-bold text-gray-900">{formatCurrency(selectedPO.totalAmount)}</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Items</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Item</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Qty</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Unit</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Rate</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedPO.items.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 text-sm text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">{item.itemName}</td>
                        <td className="px-4 py-2 text-sm text-gray-700 text-right">{item.quantity}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{item.unit}</td>
                        <td className="px-4 py-2 text-sm text-gray-700 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">{formatCurrency(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={5} className="px-4 py-2 text-sm font-semibold text-gray-900 text-right">Grand Total</td>
                      <td className="px-4 py-2 text-sm font-bold text-gray-900 text-right">{formatCurrency(selectedPO.totalAmount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {selectedPO.remarks && (
              <div>
                <span className="text-xs text-gray-500 block mb-1">Remarks</span>
                <p className="text-sm text-gray-700">{selectedPO.remarks}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
