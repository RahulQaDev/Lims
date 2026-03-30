import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  PackagePlus,
  Check,
  Copy,
  RotateCcw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { get, post } from '../../services/api';
import type { Client, PaginatedResponse, ApiResponse, Sample } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { PRIORITIES } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';

interface ReceptionFormData {
  clientId: string;
  name: string;
  description: string;
  batchNumber: string;
  batchSize: string;
  manufacturingDate: string;
  expiryDate: string;
  quantity: string;
  condition: string;
  storageCondition: string;
  priority: string;
  remarks: string;
}

const emptyForm: ReceptionFormData = {
  clientId: '',
  name: '',
  description: '',
  batchNumber: '',
  batchSize: '',
  manufacturingDate: '',
  expiryDate: '',
  quantity: '1',
  condition: 'Good',
  storageCondition: '',
  priority: 'NORMAL',
  remarks: '',
};

const CONDITION_OPTIONS = [
  { value: 'Good', label: 'Good' },
  { value: 'Damaged', label: 'Damaged' },
  { value: 'Partially Damaged', label: 'Partially Damaged' },
  { value: 'Sealed', label: 'Sealed' },
  { value: 'Opened', label: 'Opened' },
];

const STORAGE_OPTIONS = [
  { value: '', label: 'Select storage condition' },
  { value: 'Room Temperature', label: 'Room Temperature (15-25 C)' },
  { value: 'Refrigerated', label: 'Refrigerated (2-8 C)' },
  { value: 'Frozen', label: 'Frozen (-20 C)' },
  { value: 'Deep Frozen', label: 'Deep Frozen (-80 C)' },
  { value: 'Controlled', label: 'Controlled Environment' },
];

const priorityOptions = PRIORITIES.map((p) => ({ value: p.value, label: p.label }));

export default function ReceptionPage() {
  const [form, setForm] = useState<ReceptionFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof ReceptionFormData, string>>>({});
  const [createdSample, setCreatedSample] = useState<Sample | null>(null);

  const { data: clientsData } = useQuery({
    queryKey: ['clients-list'],
    queryFn: () => get<PaginatedResponse<Client>>('/clients', { params: { limit: 500, status: 'active' } }),
  });

  const clients = clientsData?.data ?? [];
  const clientOptions = clients.map((c) => ({ value: c.id, label: `${c.code} - ${c.name}` }));

  const createMutation = useMutation({
    mutationFn: (payload: ReceptionFormData) =>
      post<ApiResponse<Sample>>('/samples/reception', payload),
    onSuccess: (response) => {
      toast.success('Sample received successfully');
      setCreatedSample(response.data);
    },
    onError: () => toast.error('Failed to register sample reception'),
  });

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ReceptionFormData, string>> = {};
    if (!form.clientId) newErrors.clientId = 'Client is required';
    if (!form.name.trim()) newErrors.name = 'Sample name / description is required';
    if (!form.quantity.trim() || Number(form.quantity) < 1) newErrors.quantity = 'Quantity must be at least 1';
    if (!form.condition) newErrors.condition = 'Sample condition is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    createMutation.mutate(form);
  };

  const handleReset = () => {
    setForm(emptyForm);
    setErrors({});
    setCreatedSample(null);
  };

  const updateField = <K extends keyof ReceptionFormData>(field: K, value: ReceptionFormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard');
    });
  };

  // Success view after sample creation
  if (createdSample) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sample Reception</h1>
          <p className="text-sm text-gray-500 mt-1">Register incoming samples</p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Sample Registered Successfully</h2>
            <p className="text-sm text-gray-500 mb-6">The sample has been received and assigned a tracking code.</p>

            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <div className="text-sm text-gray-500 mb-1">Sample Code</div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl font-bold text-blue-600 font-mono tracking-wider">
                  {createdSample.sampleCode}
                </span>
                <button
                  onClick={() => copyToClipboard(createdSample.sampleCode)}
                  className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-left mb-6">
              <div>
                <span className="text-xs text-gray-500 uppercase">Client</span>
                <p className="text-sm font-medium text-gray-900">{createdSample.clientName}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 uppercase">Sample Name</span>
                <p className="text-sm font-medium text-gray-900">{createdSample.name}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 uppercase">Priority</span>
                <p className="text-sm font-medium text-gray-900">{createdSample.priority}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500 uppercase">Received Date</span>
                <p className="text-sm font-medium text-gray-900">{formatDate(createdSample.receivedDate)}</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                icon={<RotateCcw className="h-4 w-4" />}
                onClick={handleReset}
              >
                Register Another Sample
              </Button>
              <Button
                icon={<PackagePlus className="h-4 w-4" />}
                onClick={() => {
                  // Navigate to booking could go here
                  toast.success('Navigate to booking (not implemented yet)');
                }}
              >
                Proceed to Booking
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sample Reception</h1>
        <p className="text-sm text-gray-500 mt-1">Register incoming samples for testing</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client & Sample Info */}
          <Card title="Client & Sample Information" className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Select
                  label="Client *"
                  options={clientOptions}
                  value={form.clientId}
                  onChange={(e) => updateField('clientId', e.target.value)}
                  error={errors.clientId}
                  placeholder="Select a client"
                />
              </div>
              <div className="md:col-span-2">
                <Input
                  label="Sample Name / Description *"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  error={errors.name}
                  placeholder="e.g., Paracetamol 500mg Tablets"
                />
              </div>
              <Input
                label="Batch / Lot Number"
                value={form.batchNumber}
                onChange={(e) => updateField('batchNumber', e.target.value)}
                placeholder="Batch number"
              />
              <Input
                label="Batch Size"
                value={form.batchSize}
                onChange={(e) => updateField('batchSize', e.target.value)}
                placeholder="e.g., 10,000 tablets"
              />
              <Input
                label="Manufacturing Date"
                type="date"
                value={form.manufacturingDate}
                onChange={(e) => updateField('manufacturingDate', e.target.value)}
              />
              <Input
                label="Expiry Date"
                type="date"
                value={form.expiryDate}
                onChange={(e) => updateField('expiryDate', e.target.value)}
              />
              <div className="md:col-span-2">
                <Input
                  label="Description / Remarks"
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Additional details about the sample"
                />
              </div>
            </div>
          </Card>

          {/* Reception Details */}
          <Card title="Reception Details">
            <div className="space-y-4">
              <Input
                label="Quantity *"
                type="number"
                value={form.quantity}
                onChange={(e) => updateField('quantity', e.target.value)}
                error={errors.quantity}
                placeholder="Number of containers/units"
              />
              <Select
                label="Sample Condition *"
                options={CONDITION_OPTIONS}
                value={form.condition}
                onChange={(e) => updateField('condition', e.target.value)}
                error={errors.condition}
              />
              <Select
                label="Storage Condition"
                options={STORAGE_OPTIONS}
                value={form.storageCondition}
                onChange={(e) => updateField('storageCondition', e.target.value)}
              />
              <Select
                label="Priority"
                options={priorityOptions}
                value={form.priority}
                onChange={(e) => updateField('priority', e.target.value)}
              />
              <Input
                label="Remarks"
                value={form.remarks}
                onChange={(e) => updateField('remarks', e.target.value)}
                placeholder="Any special instructions"
              />

              <div className="pt-4 border-t border-gray-100 space-y-3">
                <Button
                  type="submit"
                  loading={createMutation.isPending}
                  icon={<PackagePlus className="h-4 w-4" />}
                  className="w-full justify-center"
                >
                  Register Sample
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleReset}
                  className="w-full justify-center"
                >
                  Reset Form
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
}
