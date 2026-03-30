import { useState } from 'react';
import {
  Plus,
  Edit2,
  DollarSign,
  TrendingUp,
  Wallet,
  PieChart,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Budget } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/formatters';

const FY_OPTIONS = [
  { value: '2025-26', label: 'FY 2025-26' },
  { value: '2024-25', label: 'FY 2024-25' },
  { value: '2026-27', label: 'FY 2026-27' },
];

const DEPARTMENT_OPTIONS = [
  { value: '', label: 'Select Department' },
  { value: 'HPLC', label: 'HPLC' },
  { value: 'Micro Biology', label: 'Micro Biology' },
  { value: 'ICPMS', label: 'ICPMS' },
  { value: 'Water Testing', label: 'Water Testing' },
  { value: 'Food Testing', label: 'Food Testing' },
  { value: 'GC', label: 'GC' },
  { value: 'General', label: 'General / Admin' },
];

const CATEGORY_OPTIONS = [
  { value: '', label: 'Select Category' },
  { value: 'chemicals', label: 'Chemicals & Reagents' },
  { value: 'consumables', label: 'Consumables' },
  { value: 'equipment', label: 'Equipment & Maintenance' },
  { value: 'manpower', label: 'Manpower' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'calibration', label: 'Calibration & Standards' },
  { value: 'other', label: 'Other' },
];

interface BudgetFormData {
  departmentName: string;
  category: string;
  financialYear: string;
  allocatedAmount: number;
  remarks: string;
}

const emptyForm: BudgetFormData = {
  departmentName: '',
  category: '',
  financialYear: '2025-26',
  allocatedAmount: 0,
  remarks: '',
};

// Mock data
const mockBudgets: Budget[] = [
  { id: '1', departmentId: 'd1', departmentName: 'HPLC', financialYear: '2025-26', allocatedAmount: 1500000, spentAmount: 1125000, remainingAmount: 375000, category: 'Chemicals & Reagents', createdAt: '2025-04-01', updatedAt: '2026-03-20' },
  { id: '2', departmentId: 'd2', departmentName: 'Micro Biology', financialYear: '2025-26', allocatedAmount: 800000, spentAmount: 680000, remainingAmount: 120000, category: 'Chemicals & Reagents', createdAt: '2025-04-01', updatedAt: '2026-03-18' },
  { id: '3', departmentId: 'd3', departmentName: 'ICPMS', financialYear: '2025-26', allocatedAmount: 2000000, spentAmount: 1400000, remainingAmount: 600000, category: 'Equipment & Maintenance', createdAt: '2025-04-01', updatedAt: '2026-03-15' },
  { id: '4', departmentId: 'd4', departmentName: 'Water Testing', financialYear: '2025-26', allocatedAmount: 600000, spentAmount: 510000, remainingAmount: 90000, category: 'Consumables', createdAt: '2025-04-01', updatedAt: '2026-03-22' },
  { id: '5', departmentId: 'd5', departmentName: 'Food Testing', financialYear: '2025-26', allocatedAmount: 900000, spentAmount: 630000, remainingAmount: 270000, category: 'Chemicals & Reagents', createdAt: '2025-04-01', updatedAt: '2026-03-10' },
  { id: '6', departmentId: 'd6', departmentName: 'GC', financialYear: '2025-26', allocatedAmount: 1200000, spentAmount: 840000, remainingAmount: 360000, category: 'Equipment & Maintenance', createdAt: '2025-04-01', updatedAt: '2026-03-08' },
  { id: '7', departmentId: 'd7', departmentName: 'General', financialYear: '2025-26', allocatedAmount: 500000, spentAmount: 475000, remainingAmount: 25000, category: 'Utilities', createdAt: '2025-04-01', updatedAt: '2026-03-21' },
];

function getUtilizationColor(pct: number): string {
  if (pct > 90) return 'bg-red-500';
  if (pct > 80) return 'bg-yellow-500';
  return 'bg-green-500';
}

function getUtilizationStatus(pct: number): { label: string; variant: 'green' | 'yellow' | 'red' } {
  if (pct > 90) return { label: 'Over Budget', variant: 'red' };
  if (pct > 80) return { label: 'Near Limit', variant: 'yellow' };
  return { label: 'On Track', variant: 'green' };
}

export default function BudgetPage() {
  const [selectedFY, setSelectedFY] = useState('2025-26');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [form, setForm] = useState<BudgetFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof BudgetFormData, string>>>({});

  const filteredBudgets = mockBudgets.filter((b) => b.financialYear === selectedFY);

  const totalAllocated = filteredBudgets.reduce((s, b) => s + b.allocatedAmount, 0);
  const totalSpent = filteredBudgets.reduce((s, b) => s + b.spentAmount, 0);
  const totalRemaining = filteredBudgets.reduce((s, b) => s + b.remainingAmount, 0);
  const avgUtilization = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

  const openCreate = () => {
    setEditingBudget(null);
    setForm({ ...emptyForm, financialYear: selectedFY });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setForm({
      departmentName: budget.departmentName,
      category: budget.category,
      financialYear: budget.financialYear,
      allocatedAmount: budget.allocatedAmount,
      remarks: budget.remarks || '',
    });
    setErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingBudget(null);
    setForm(emptyForm);
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof BudgetFormData, string>> = {};
    if (!form.departmentName) newErrors.departmentName = 'Department is required';
    if (!form.category) newErrors.category = 'Category is required';
    if (form.allocatedAmount <= 0) newErrors.allocatedAmount = 'Amount must be greater than 0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    toast.success(editingBudget ? 'Budget updated successfully' : 'Budget created successfully');
    closeModal();
  };

  const updateField = <K extends keyof BudgetFormData>(field: K, value: BudgetFormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget Management</h1>
          <p className="text-sm text-gray-500 mt-1">Department-wise budget allocation and tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            options={FY_OPTIONS}
            value={selectedFY}
            onChange={(e) => setSelectedFY(e.target.value)}
            className="w-40"
          />
          <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            Add Budget
          </Button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Wallet className="h-5 w-5" />} label="Total Budget" value={formatCurrency(totalAllocated)} color="blue" />
        <StatCard icon={<DollarSign className="h-5 w-5" />} label="Total Spent" value={formatCurrency(totalSpent)} color="red" />
        <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Total Remaining" value={formatCurrency(totalRemaining)} color="green" />
        <StatCard icon={<PieChart className="h-5 w-5" />} label="Average Utilization" value={`${avgUtilization}%`} color="purple" />
      </div>

      {/* Budget table */}
      <Card title={`Department-wise Budget - FY ${selectedFY}`} noPadding>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Department</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Allocated</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Spent</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Remaining</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">% Used</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBudgets.map((budget) => {
                const usedPct = budget.allocatedAmount > 0
                  ? Math.round((budget.spentAmount / budget.allocatedAmount) * 100)
                  : 0;
                const status = getUtilizationStatus(usedPct);

                return (
                  <tr key={budget.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{budget.departmentName}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{budget.category}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">{formatCurrency(budget.allocatedAmount)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 text-right">{formatCurrency(budget.spentAmount)}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className={budget.remainingAmount < 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                        {formatCurrency(budget.remainingAmount)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${getUtilizationColor(usedPct)}`}
                            style={{ width: `${Math.min(usedPct, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700 w-10 text-right">{usedPct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(budget)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">Total</td>
                <td />
                <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{formatCurrency(totalAllocated)}</td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{formatCurrency(totalSpent)}</td>
                <td className="px-4 py-3 text-sm font-semibold text-right">
                  <span className={totalRemaining < 0 ? 'text-red-600' : 'text-green-600'}>
                    {formatCurrency(totalRemaining)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getUtilizationColor(avgUtilization)}`}
                        style={{ width: `${Math.min(avgUtilization, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 w-10 text-right">{avgUtilization}%</span>
                  </div>
                </td>
                <td />
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingBudget ? 'Edit Budget' : 'Add Budget Allocation'}
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSubmit}>
              {editingBudget ? 'Update Budget' : 'Create Budget'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Department *"
            options={DEPARTMENT_OPTIONS}
            value={form.departmentName}
            onChange={(e) => updateField('departmentName', e.target.value)}
            error={errors.departmentName}
          />
          <Select
            label="Category *"
            options={CATEGORY_OPTIONS}
            value={form.category}
            onChange={(e) => updateField('category', e.target.value)}
            error={errors.category}
          />
          <Select
            label="Financial Year"
            options={FY_OPTIONS}
            value={form.financialYear}
            onChange={(e) => updateField('financialYear', e.target.value)}
          />
          <Input
            label="Allocated Amount *"
            type="number"
            value={String(form.allocatedAmount)}
            onChange={(e) => updateField('allocatedAmount', Number(e.target.value))}
            error={errors.allocatedAmount}
            placeholder="0.00"
          />
          <Input
            label="Remarks"
            value={form.remarks}
            onChange={(e) => updateField('remarks', e.target.value)}
            placeholder="Additional notes..."
          />
        </div>
      </Modal>
    </div>
  );
}
