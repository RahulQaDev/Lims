import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Star,
  Copy,
  GripVertical,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Save,
  Maximize2,
  X,
  Beaker,
  Building2,
  Phone,
  Mail,
  Globe,
  QrCode,
  Shield,
  Award,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { get, post, put, del } from '../../services/api';
import type { ApiResponse, PaginatedResponse } from '../../types';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Table, { type Column } from '../../components/ui/Table';
import SearchInput from '../../components/ui/SearchInput';
import Pagination from '../../components/ui/Pagination';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { formatDate } from '../../utils/formatters';

// ─── Types ──────────────────────────────────────────────────
interface CoaTemplateItem {
  id: string;
  name: string;
  code: string;
  productTypeName?: string;
  productTypeId?: string;
  departmentName?: string;
  departmentId?: string;
  standardName?: string;
  standardId?: string;
  isDefault: boolean;
  isActive: boolean;
  version?: string;
  config?: TemplateConfig;
  createdAt: string;
  updatedAt: string;
}

interface DropdownOption {
  id: string;
  name: string;
}

interface SignatureSlot {
  name: string;
  designation: string;
}

interface SectionSettings {
  // Lab Header
  labName: string;
  labAddressLine1: string;
  labAddressLine2: string;
  nablNumber: string;
  labPhone: string;
  labEmail: string;
  labWebsite: string;
  // Signature Block
  signatureCount: number;
  signatures: SignatureSlot[];
  // Footer
  disclaimerText: string;
  showQrCode: boolean;
  // Test Table
  showMethodColumn: boolean;
  showUnitColumn: boolean;
  showPassFailColumn: boolean;
}

interface TemplateSection {
  id: string;
  label: string;
  icon: string;
  enabled: boolean;
  expanded: boolean;
}

interface TemplateConfig {
  name: string;
  productTypeId: string;
  departmentId: string;
  standardId: string;
  version: number;
  isDefault: boolean;
  sections: TemplateSection[];
  settings: SectionSettings;
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  labHeader: <Building2 className="h-4 w-4" />,
  reportInfo: <FileText className="h-4 w-4" />,
  clientInfo: <Building2 className="h-4 w-4" />,
  sampleInfo: <Beaker className="h-4 w-4" />,
  testTable: <FileText className="h-4 w-4" />,
  remarks: <FileText className="h-4 w-4" />,
  conclusion: <CheckCircle2 className="h-4 w-4" />,
  signatureBlock: <Pencil className="h-4 w-4" />,
  footer: <Shield className="h-4 w-4" />,
};

const DEFAULT_SECTIONS: TemplateSection[] = [
  { id: 'labHeader', label: 'Lab Header', icon: 'labHeader', enabled: true, expanded: false },
  { id: 'reportInfo', label: 'Report Information', icon: 'reportInfo', enabled: true, expanded: false },
  { id: 'clientInfo', label: 'Client Information', icon: 'clientInfo', enabled: true, expanded: false },
  { id: 'sampleInfo', label: 'Sample Information', icon: 'sampleInfo', enabled: true, expanded: false },
  { id: 'testTable', label: 'Test Parameters Table', icon: 'testTable', enabled: true, expanded: false },
  { id: 'remarks', label: 'Remarks Section', icon: 'remarks', enabled: true, expanded: false },
  { id: 'conclusion', label: 'Conclusion / Opinion', icon: 'conclusion', enabled: true, expanded: false },
  { id: 'signatureBlock', label: 'Signature Block', icon: 'signatureBlock', enabled: true, expanded: false },
  { id: 'footer', label: 'Footer', icon: 'footer', enabled: true, expanded: false },
];

const DEFAULT_SETTINGS: SectionSettings = {
  labName: '',
  labAddressLine1: '',
  labAddressLine2: '',
  nablNumber: '',
  labPhone: '',
  labEmail: '',
  labWebsite: '',
  signatureCount: 3,
  signatures: [
    { name: '', designation: 'Analyst' },
    { name: '', designation: 'Reviewer' },
    { name: '', designation: 'Authorized Signatory' },
    { name: '', designation: '' },
  ],
  disclaimerText: 'This report shall not be reproduced except in full without the written approval of the laboratory. The results relate only to the items tested.',
  showQrCode: true,
  showMethodColumn: true,
  showUnitColumn: true,
  showPassFailColumn: true,
};

const INITIAL_CONFIG: TemplateConfig = {
  name: '',
  productTypeId: '',
  departmentId: '',
  standardId: '',
  version: 1,
  isDefault: false,
  sections: DEFAULT_SECTIONS.map((s) => ({ ...s })),
  settings: { ...DEFAULT_SETTINGS, signatures: DEFAULT_SETTINGS.signatures.map((s) => ({ ...s })) },
};

const PRODUCT_TYPE_OPTIONS = [
  { value: '', label: 'All Product Types' },
  { value: 'food', label: 'Food' },
  { value: 'water', label: 'Water' },
  { value: 'pharma', label: 'Pharma' },
  { value: 'cosmetics', label: 'Cosmetics' },
  { value: 'environmental', label: 'Environmental' },
  { value: 'chemical', label: 'Chemical' },
  { value: 'herbal', label: 'Herbal' },
];

// ─── Main Component ─────────────────────────────────────────
export default function CoaTemplatesPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<'list' | 'designer'>('list');
  const [search, setSearch] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [config, setConfig] = useState<TemplateConfig>(structuredClone(INITIAL_CONFIG));
  const [deleteTarget, setDeleteTarget] = useState<CoaTemplateItem | null>(null);
  const [fullPreview, setFullPreview] = useState(false);

  // Drag state
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const pageSize = 25;

  // ─── Data Fetching ──────────────────────────────────────
  const { data, isLoading, isError } = useQuery({
    queryKey: ['coa-templates', page, search, productTypeFilter],
    queryFn: () =>
      get<PaginatedResponse<CoaTemplateItem>>('/coa/templates', {
        params: {
          page,
          limit: pageSize,
          search,
          ...(productTypeFilter ? { productTypeId: productTypeFilter } : {}),
        },
      }),
  });

  const items = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.total ?? 0;

  const { data: productTypes } = useQuery({
    queryKey: ['product-types-dropdown'],
    queryFn: () =>
      get<PaginatedResponse<DropdownOption>>('/product-types', {
        params: { limit: 200, isActive: true },
      }).then((r) => r.data),
  });

  const { data: departments } = useQuery({
    queryKey: ['departments-dropdown'],
    queryFn: () =>
      get<PaginatedResponse<DropdownOption>>('/departments', {
        params: { limit: 200, isActive: true },
      }).then((r) => r.data),
  });

  const { data: standards } = useQuery({
    queryKey: ['standards-dropdown'],
    queryFn: () =>
      get<PaginatedResponse<DropdownOption>>('/standards', {
        params: { limit: 200, isActive: true },
      }).then((r) => r.data),
  });

  // ─── Mutations ──────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: (payload: { config: TemplateConfig; id?: string | null }) => {
      const body = {
        name: payload.config.name,
        productTypeId: payload.config.productTypeId || undefined,
        departmentId: payload.config.departmentId || undefined,
        standardId: payload.config.standardId || undefined,
        isDefault: payload.config.isDefault,
        version: String(payload.config.version),
        config: payload.config,
      };
      if (payload.id) {
        return put<ApiResponse<null>>(`/coa/templates/${payload.id}`, body);
      }
      return post<ApiResponse<null>>('/coa/templates', body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coa-templates'] });
      toast.success(editingId ? 'Template updated successfully' : 'Template created successfully');
      setView('list');
      setEditingId(null);
    },
    onError: () => toast.error('Failed to save template'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => del<ApiResponse<null>>(`/coa/templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coa-templates'] });
      toast.success('Template deleted');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to delete template'),
  });

  const cloneMutation = useMutation({
    mutationFn: (template: CoaTemplateItem) => {
      const body = {
        name: `${template.name} (Copy)`,
        productTypeId: template.productTypeId,
        departmentId: template.departmentId,
        standardId: template.standardId,
        isDefault: false,
        version: '1',
        config: template.config,
      };
      return post<ApiResponse<null>>('/coa/templates', body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coa-templates'] });
      toast.success('Template cloned successfully');
    },
    onError: () => toast.error('Failed to clone template'),
  });

  // ─── Actions ────────────────────────────────────────────
  const openDesigner = useCallback(
    (template?: CoaTemplateItem) => {
      if (template) {
        setEditingId(template.id);
        if (template.config) {
          setConfig(structuredClone(template.config));
        } else {
          setConfig({
            ...structuredClone(INITIAL_CONFIG),
            name: template.name,
            productTypeId: template.productTypeId || '',
            departmentId: template.departmentId || '',
            standardId: template.standardId || '',
            isDefault: template.isDefault,
            version: parseInt(template.version || '1', 10),
          });
        }
      } else {
        setEditingId(null);
        setConfig(structuredClone(INITIAL_CONFIG));
      }
      setView('designer');
    },
    [],
  );

  const handleSave = useCallback(() => {
    if (!config.name.trim()) {
      toast.error('Template name is required');
      return;
    }
    saveMutation.mutate({ config, id: editingId });
  }, [config, editingId, saveMutation]);

  const updateConfig = useCallback(<K extends keyof TemplateConfig>(key: K, value: TemplateConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateSettings = useCallback(<K extends keyof SectionSettings>(key: K, value: SectionSettings[K]) => {
    setConfig((prev) => ({ ...prev, settings: { ...prev.settings, [key]: value } }));
  }, []);

  const toggleSection = useCallback((idx: number) => {
    setConfig((prev) => {
      const sections = prev.sections.map((s, i) =>
        i === idx ? { ...s, enabled: !s.enabled } : s,
      );
      return { ...prev, sections };
    });
  }, []);

  const toggleExpanded = useCallback((idx: number) => {
    setConfig((prev) => {
      const sections = prev.sections.map((s, i) =>
        i === idx ? { ...s, expanded: !s.expanded } : s,
      );
      return { ...prev, sections };
    });
  }, []);

  const updateSignature = useCallback((index: number, field: keyof SignatureSlot, value: string) => {
    setConfig((prev) => {
      const sigs = prev.settings.signatures.map((s, i) =>
        i === index ? { ...s, [field]: value } : s,
      );
      return { ...prev, settings: { ...prev.settings, signatures: sigs } };
    });
  }, []);

  // ─── Drag & Drop ────────────────────────────────────────
  const handleDragStart = useCallback((idx: number) => {
    setDragIdx(idx);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  }, []);

  const handleDrop = useCallback(
    (idx: number) => {
      if (dragIdx === null || dragIdx === idx) {
        setDragIdx(null);
        setDragOverIdx(null);
        return;
      }
      setConfig((prev) => {
        const sections = [...prev.sections];
        const [removed] = sections.splice(dragIdx, 1);
        sections.splice(idx, 0, removed);
        return { ...prev, sections };
      });
      setDragIdx(null);
      setDragOverIdx(null);
    },
    [dragIdx],
  );

  const handleDragEnd = useCallback(() => {
    setDragIdx(null);
    setDragOverIdx(null);
  }, []);

  // ─── Enabled sections in order ──────────────────────────
  const enabledSections = useMemo(
    () => config.sections.filter((s) => s.enabled),
    [config.sections],
  );

  // ─── Table columns ──────────────────────────────────────
  const columns: Column<CoaTemplateItem>[] = [
    {
      key: 'name',
      header: 'Template Name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="font-medium text-gray-900">{row.name}</span>
            {row.isDefault && (
              <Star className="inline-block ml-1.5 h-3.5 w-3.5 text-amber-500 fill-amber-500" />
            )}
            {row.code && <p className="text-xs text-gray-400">{row.code}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'productTypeName',
      header: 'Product Type',
      render: (row) =>
        row.productTypeName ? (
          <Badge variant="blue">{row.productTypeName}</Badge>
        ) : (
          <span className="text-gray-400">--</span>
        ),
    },
    {
      key: 'departmentName',
      header: 'Department',
      render: (row) => row.departmentName || <span className="text-gray-400">--</span>,
    },
    {
      key: 'standardName',
      header: 'Standard',
      render: (row) => row.standardName || <span className="text-gray-400">--</span>,
    },
    {
      key: 'isDefault',
      header: 'Default',
      render: (row) =>
        row.isDefault ? (
          <Badge variant="green">
            <Star className="h-3 w-3 mr-0.5 fill-current" /> Default
          </Badge>
        ) : (
          <span className="text-gray-400 text-xs">--</span>
        ),
    },
    {
      key: 'version',
      header: 'Version',
      render: (row) => (
        <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
          v{row.version || '1.0'}
        </span>
      ),
    },
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
            onClick={(e) => {
              e.stopPropagation();
              openDesigner(row);
            }}
            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
            title="Edit Template"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              cloneMutation.mutate(row);
            }}
            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
            title="Clone Template"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(row);
            }}
            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
            title="Delete Template"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // ─── Toggle component ─────────────────────────────────────
  const Toggle = ({
    label,
    checked,
    onChange,
    size = 'md',
  }: {
    label?: string;
    checked: boolean;
    onChange: (val: boolean) => void;
    size?: 'sm' | 'md';
  }) => (
    <label className="flex items-center gap-2 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex shrink-0 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-300'
        } ${size === 'sm' ? 'h-4 w-7' : 'h-5 w-9'}`}
      >
        <span
          className={`inline-block rounded-full bg-white transition-transform shadow-sm ${
            size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'
          } ${
            checked
              ? size === 'sm'
                ? 'translate-x-3.5'
                : 'translate-x-4.5'
              : 'translate-x-0.5'
          }`}
        />
      </button>
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  );

  // ═══════════════════════════════════════════════════════════
  // LIST VIEW
  // ═══════════════════════════════════════════════════════════
  if (view === 'list') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">CoA Templates</h1>
            <p className="text-sm text-gray-500 mt-1">
              Design and manage Certificate of Analysis layouts for each product matrix
            </p>
          </div>
          <Button
            icon={<Plus className="h-4 w-4" />}
            onClick={() => openDesigner()}
          >
            Create New Template
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Templates', value: totalItems, color: 'bg-blue-500' },
            { label: 'Active', value: items.filter((i) => i.isActive).length, color: 'bg-green-500' },
            { label: 'Defaults Set', value: items.filter((i) => i.isDefault).length, color: 'bg-amber-500' },
            { label: 'Product Types', value: new Set(items.map((i) => i.productTypeName).filter(Boolean)).size, color: 'bg-purple-500' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3"
            >
              <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Templates table */}
        <Card noPadding>
          <div className="flex items-center gap-4 p-4 border-b border-gray-100">
            <SearchInput
              onSearch={(val) => {
                setSearch(val);
                setPage(1);
              }}
              placeholder="Search templates..."
              className="w-80"
            />
            <Select
              value={productTypeFilter}
              onChange={(e) => {
                setProductTypeFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: '', label: 'All Product Types' },
                ...(productTypes ?? []).map((pt) => ({
                  value: pt.id,
                  label: pt.name,
                })),
              ]}
              className="w-48"
            />
          </div>

          {isLoading ? (
            <Loader text="Loading templates..." />
          ) : isError ? (
            <EmptyState
              title="Failed to load templates"
              description="There was an error loading the template list. The API server may not be running."
              icon={<AlertTriangle className="h-8 w-8 text-gray-400" />}
            />
          ) : items.length === 0 ? (
            <EmptyState
              title="No templates found"
              description={
                search
                  ? 'Try adjusting your search criteria'
                  : 'Create your first CoA template to start designing professional lab reports.'
              }
              icon={<FileText className="h-8 w-8 text-gray-400" />}
              action={
                !search ? (
                  <Button
                    icon={<Plus className="h-4 w-4" />}
                    onClick={() => openDesigner()}
                    size="sm"
                  >
                    Create Template
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <Table
                columns={columns}
                data={items}
                keyExtractor={(row) => row.id}
                onRowClick={(row) => openDesigner(row)}
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

        {/* Delete confirm */}
        <ConfirmDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => {
            if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
          }}
          title="Delete Template"
          message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
          confirmText="Delete"
          variant="danger"
          loading={deleteMutation.isPending}
        />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // DESIGNER VIEW
  // ═══════════════════════════════════════════════════════════
  return (
    <>
      <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden -m-6">
        {/* ─── Top Bar ─────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setView('list');
                setEditingId(null);
              }}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Edit Template' : 'Create New Template'}
              </h2>
              <p className="text-xs text-gray-500">
                Design your CoA layout with drag-and-drop sections
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<Maximize2 className="h-4 w-4" />}
              onClick={() => setFullPreview(true)}
              size="sm"
            >
              Full Preview
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setView('list');
                setEditingId(null);
              }}
              size="sm"
            >
              Cancel
            </Button>
            <Button
              icon={<Save className="h-4 w-4" />}
              onClick={handleSave}
              loading={saveMutation.isPending}
              size="sm"
            >
              Save Template
            </Button>
          </div>
        </div>

        {/* ─── Three Panels ────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT PANEL - Template Config */}
          <div className="w-[30%] border-r border-gray-200 bg-gray-50 overflow-y-auto">
            <div className="p-5 space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
                    <FileText className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  Template Configuration
                </h3>
                <div className="space-y-3">
                  <Input
                    label="Template Name"
                    value={config.name}
                    onChange={(e) => updateConfig('name', e.target.value)}
                    placeholder="e.g. Standard Food Analysis Report"
                  />
                  <Select
                    label="Product Type"
                    value={config.productTypeId}
                    onChange={(e) => updateConfig('productTypeId', e.target.value)}
                    options={(productTypes ?? []).map((pt) => ({
                      value: pt.id,
                      label: pt.name,
                    }))}
                    placeholder="Select product type"
                  />
                  <Select
                    label="Department"
                    value={config.departmentId}
                    onChange={(e) => updateConfig('departmentId', e.target.value)}
                    options={(departments ?? []).map((d) => ({
                      value: d.id,
                      label: d.name,
                    }))}
                    placeholder="Select department"
                  />
                  <Select
                    label="Standard"
                    value={config.standardId}
                    onChange={(e) => updateConfig('standardId', e.target.value)}
                    options={(standards ?? []).map((s) => ({
                      value: s.id,
                      label: s.name,
                    }))}
                    placeholder="Select standard"
                  />
                </div>
              </div>

              {/* Version */}
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Version</p>
                    <p className="text-xs text-gray-400">Auto-incremented on save</p>
                  </div>
                  <span className="text-lg font-bold text-blue-600 font-mono">
                    v{config.version}.0
                  </span>
                </div>
              </div>

              {/* Default toggle */}
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Set as Default</p>
                    <p className="text-xs text-gray-400">Default for this product type</p>
                  </div>
                  <Toggle
                    checked={config.isDefault}
                    onChange={(v) => updateConfig('isDefault', v)}
                  />
                </div>
              </div>

              {/* Quick section summary */}
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Active Sections
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {config.sections
                    .filter((s) => s.enabled)
                    .map((s) => (
                      <span
                        key={s.id}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                      >
                        {s.label}
                      </span>
                    ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {config.sections.filter((s) => s.enabled).length} of{' '}
                  {config.sections.length} sections enabled
                </p>
              </div>
            </div>
          </div>

          {/* CENTER PANEL - Live Preview */}
          <div className="w-[45%] bg-gray-100 overflow-y-auto">
            <div className="p-6 flex justify-center">
              <div className="w-full max-w-[210mm] min-h-[297mm] bg-white shadow-xl border border-gray-300 relative">
                {/* Page content */}
                <div className="p-8 space-y-0">
                  {enabledSections.map((section) => (
                    <div key={section.id}>
                      {section.id === 'labHeader' && <PreviewLabHeader settings={config.settings} />}
                      {section.id === 'reportInfo' && <PreviewReportInfo />}
                      {section.id === 'clientInfo' && <PreviewClientInfo />}
                      {section.id === 'sampleInfo' && <PreviewSampleInfo />}
                      {section.id === 'testTable' && <PreviewTestTable settings={config.settings} />}
                      {section.id === 'remarks' && <PreviewRemarks />}
                      {section.id === 'conclusion' && <PreviewConclusion />}
                      {section.id === 'signatureBlock' && <PreviewSignatureBlock settings={config.settings} />}
                      {section.id === 'footer' && <PreviewFooter settings={config.settings} />}
                    </div>
                  ))}
                  {enabledSections.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                      <EyeOff className="h-12 w-12 mb-3" />
                      <p className="text-sm font-medium">No sections enabled</p>
                      <p className="text-xs">Enable sections from the right panel</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL - Section Controls */}
          <div className="w-[25%] border-l border-gray-200 bg-gray-50 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-indigo-100 flex items-center justify-center">
                  <GripVertical className="h-3.5 w-3.5 text-indigo-600" />
                </div>
                Section Controls
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Drag to reorder. Click eye to toggle visibility.
              </p>

              <div className="space-y-1.5">
                {config.sections.map((section, idx) => (
                  <div
                    key={section.id}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={() => handleDrop(idx)}
                    onDragEnd={handleDragEnd}
                    className={`rounded-lg border transition-all ${
                      dragIdx === idx
                        ? 'opacity-40 border-blue-400 bg-blue-50'
                        : dragOverIdx === idx
                        ? 'border-blue-400 border-dashed bg-blue-50/50'
                        : section.enabled
                        ? 'border-gray-200 bg-white hover:border-gray-300'
                        : 'border-gray-200 bg-gray-100 opacity-60'
                    }`}
                  >
                    {/* Section header row */}
                    <div className="flex items-center gap-2 px-3 py-2.5">
                      <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <div className="text-gray-500">
                        {SECTION_ICONS[section.icon] || <FileText className="h-4 w-4" />}
                      </div>
                      <span
                        className={`text-sm font-medium flex-1 ${
                          section.enabled ? 'text-gray-800' : 'text-gray-400'
                        }`}
                      >
                        {section.label}
                      </span>
                      <button
                        onClick={() => toggleSection(idx)}
                        className={`p-1 rounded transition-colors ${
                          section.enabled
                            ? 'text-blue-600 hover:bg-blue-50'
                            : 'text-gray-400 hover:bg-gray-200'
                        }`}
                        title={section.enabled ? 'Hide section' : 'Show section'}
                      >
                        {section.enabled ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </button>
                      {(section.id === 'labHeader' ||
                        section.id === 'signatureBlock' ||
                        section.id === 'footer' ||
                        section.id === 'testTable') && (
                        <button
                          onClick={() => toggleExpanded(idx)}
                          className="p-1 rounded text-gray-400 hover:bg-gray-100 transition-colors"
                          title="Settings"
                        >
                          {section.expanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Expanded settings */}
                    {section.expanded && section.id === 'labHeader' && (
                      <div className="px-3 pb-3 border-t border-gray-100 pt-3 space-y-2.5">
                        <Input
                          label="Lab Name"
                          value={config.settings.labName}
                          onChange={(e) => updateSettings('labName', e.target.value)}
                          placeholder="e.g. ABC Testing Laboratory"
                          className="text-xs"
                        />
                        <Input
                          label="Address Line 1"
                          value={config.settings.labAddressLine1}
                          onChange={(e) => updateSettings('labAddressLine1', e.target.value)}
                          placeholder="Street address"
                          className="text-xs"
                        />
                        <Input
                          label="Address Line 2"
                          value={config.settings.labAddressLine2}
                          onChange={(e) => updateSettings('labAddressLine2', e.target.value)}
                          placeholder="City, State, PIN"
                          className="text-xs"
                        />
                        <Input
                          label="NABL Accreditation No."
                          value={config.settings.nablNumber}
                          onChange={(e) => updateSettings('nablNumber', e.target.value)}
                          placeholder="e.g. TC-12345"
                          className="text-xs"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            label="Phone"
                            value={config.settings.labPhone}
                            onChange={(e) => updateSettings('labPhone', e.target.value)}
                            placeholder="+91..."
                            className="text-xs"
                          />
                          <Input
                            label="Email"
                            value={config.settings.labEmail}
                            onChange={(e) => updateSettings('labEmail', e.target.value)}
                            placeholder="lab@example.com"
                            className="text-xs"
                          />
                        </div>
                        <Input
                          label="Website"
                          value={config.settings.labWebsite}
                          onChange={(e) => updateSettings('labWebsite', e.target.value)}
                          placeholder="www.example.com"
                          className="text-xs"
                        />
                      </div>
                    )}

                    {section.expanded && section.id === 'signatureBlock' && (
                      <div className="px-3 pb-3 border-t border-gray-100 pt-3 space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Number of Signatures
                          </label>
                          <div className="flex items-center gap-2">
                            {[1, 2, 3, 4].map((n) => (
                              <button
                                key={n}
                                onClick={() => updateSettings('signatureCount', n)}
                                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                                  config.settings.signatureCount === n
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                        </div>
                        {Array.from({ length: config.settings.signatureCount }).map((_, i) => (
                          <div
                            key={i}
                            className="bg-gray-50 rounded-lg p-2.5 space-y-2"
                          >
                            <p className="text-xs font-semibold text-gray-500">
                              Signature {i + 1}
                            </p>
                            <Input
                              label="Name"
                              value={config.settings.signatures[i]?.name || ''}
                              onChange={(e) => updateSignature(i, 'name', e.target.value)}
                              placeholder="Full name"
                              className="text-xs"
                            />
                            <Input
                              label="Designation"
                              value={config.settings.signatures[i]?.designation || ''}
                              onChange={(e) => updateSignature(i, 'designation', e.target.value)}
                              placeholder="e.g. Analyst, Reviewer"
                              className="text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {section.expanded && section.id === 'footer' && (
                      <div className="px-3 pb-3 border-t border-gray-100 pt-3 space-y-2.5">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Disclaimer Text
                          </label>
                          <textarea
                            rows={3}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={config.settings.disclaimerText}
                            onChange={(e) => updateSettings('disclaimerText', e.target.value)}
                            placeholder="Disclaimer text for footer..."
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-700">Show QR Code</span>
                          <Toggle
                            checked={config.settings.showQrCode}
                            onChange={(v) => updateSettings('showQrCode', v)}
                            size="sm"
                          />
                        </div>
                      </div>
                    )}

                    {section.expanded && section.id === 'testTable' && (
                      <div className="px-3 pb-3 border-t border-gray-100 pt-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-700">Show Method Column</span>
                          <Toggle
                            checked={config.settings.showMethodColumn}
                            onChange={(v) => updateSettings('showMethodColumn', v)}
                            size="sm"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-700">Show Unit Column</span>
                          <Toggle
                            checked={config.settings.showUnitColumn}
                            onChange={(v) => updateSettings('showUnitColumn', v)}
                            size="sm"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-700">Show Pass/Fail Column</span>
                          <Toggle
                            checked={config.settings.showPassFailColumn}
                            onChange={(v) => updateSettings('showPassFailColumn', v)}
                            size="sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Full Preview Modal ──────────────────────────────── */}
      {fullPreview && (
        <div className="fixed inset-0 z-50 bg-gray-900/80 flex items-start justify-center overflow-y-auto py-8">
          <div className="relative">
            <button
              onClick={() => setFullPreview(false)}
              className="fixed top-4 right-4 z-50 p-2 rounded-full bg-white shadow-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="w-[210mm] bg-white shadow-2xl border border-gray-300">
              <div className="p-10 space-y-0">
                {enabledSections.map((section) => (
                  <div key={section.id}>
                    {section.id === 'labHeader' && <PreviewLabHeader settings={config.settings} />}
                    {section.id === 'reportInfo' && <PreviewReportInfo />}
                    {section.id === 'clientInfo' && <PreviewClientInfo />}
                    {section.id === 'sampleInfo' && <PreviewSampleInfo />}
                    {section.id === 'testTable' && <PreviewTestTable settings={config.settings} />}
                    {section.id === 'remarks' && <PreviewRemarks />}
                    {section.id === 'conclusion' && <PreviewConclusion />}
                    {section.id === 'signatureBlock' && <PreviewSignatureBlock settings={config.settings} />}
                    {section.id === 'footer' && <PreviewFooter settings={config.settings} />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ═════════════════════════════════════════════════════════════
// PREVIEW SUB-COMPONENTS
// ═════════════════════════════════════════════════════════════

function PreviewLabHeader({ settings }: { settings: SectionSettings }) {
  return (
    <div className="border-b-2 border-gray-800 pb-4 mb-4">
      <div className="flex items-start justify-between">
        {/* Logo placeholder */}
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 border-2 border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
            <Beaker className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-tight">
              {settings.labName || 'Laboratory Name'}
            </h1>
            {(settings.labAddressLine1 || !settings.labName) && (
              <p className="text-[10px] text-gray-600 leading-tight mt-0.5">
                {settings.labAddressLine1 || '123 Lab Street, Industrial Area'}
              </p>
            )}
            {(settings.labAddressLine2 || !settings.labName) && (
              <p className="text-[10px] text-gray-600 leading-tight">
                {settings.labAddressLine2 || 'Mumbai, Maharashtra 400001'}
              </p>
            )}
            <div className="flex items-center gap-3 mt-1 text-[9px] text-gray-500">
              {(settings.labPhone || !settings.labName) && (
                <span className="flex items-center gap-0.5">
                  <Phone className="h-2.5 w-2.5" />
                  {settings.labPhone || '+91 22 1234 5678'}
                </span>
              )}
              {(settings.labEmail || !settings.labName) && (
                <span className="flex items-center gap-0.5">
                  <Mail className="h-2.5 w-2.5" />
                  {settings.labEmail || 'info@laboratory.com'}
                </span>
              )}
              {(settings.labWebsite || !settings.labName) && (
                <span className="flex items-center gap-0.5">
                  <Globe className="h-2.5 w-2.5" />
                  {settings.labWebsite || 'www.laboratory.com'}
                </span>
              )}
            </div>
          </div>
        </div>
        {/* NABL badge */}
        <div className="text-right shrink-0">
          <div className="inline-flex items-center gap-1.5 border border-blue-200 bg-blue-50 rounded-lg px-2.5 py-1.5">
            <Award className="h-5 w-5 text-blue-600" />
            <div className="text-left">
              <p className="text-[8px] font-semibold text-blue-800 uppercase tracking-wider">
                NABL Accredited
              </p>
              <p className="text-[10px] font-bold text-blue-700 font-mono">
                {settings.nablNumber || 'TC-XXXXX'}
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Title */}
      <div className="text-center mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg py-2">
        <h2 className="text-sm font-bold text-white tracking-widest uppercase">
          Certificate of Analysis
        </h2>
      </div>
    </div>
  );
}

function PreviewReportInfo() {
  return (
    <div className="mb-4">
      <div className="grid grid-cols-3 gap-3 text-[10px]">
        <div className="bg-gray-50 rounded px-2.5 py-1.5 border border-gray-200">
          <span className="text-gray-500 font-medium">Report No.</span>
          <p className="font-semibold text-gray-800 mt-0.5 font-mono">COA-2024-00142</p>
        </div>
        <div className="bg-gray-50 rounded px-2.5 py-1.5 border border-gray-200">
          <span className="text-gray-500 font-medium">Date of Report</span>
          <p className="font-semibold text-gray-800 mt-0.5">{formatDate(new Date().toISOString())}</p>
        </div>
        <div className="bg-gray-50 rounded px-2.5 py-1.5 border border-gray-200">
          <span className="text-gray-500 font-medium">Date of Receipt</span>
          <p className="font-semibold text-gray-800 mt-0.5">{formatDate(new Date(Date.now() - 86400000 * 3).toISOString())}</p>
        </div>
      </div>
    </div>
  );
}

function PreviewClientInfo() {
  return (
    <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-800 px-3 py-1.5">
        <h4 className="text-[10px] font-semibold text-white uppercase tracking-wider">
          Client Information
        </h4>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 px-3 py-2.5 text-[10px]">
        <div className="flex">
          <span className="text-gray-500 w-20 shrink-0">Client Name:</span>
          <span className="font-medium text-gray-800">Acme Pharmaceuticals Pvt. Ltd.</span>
        </div>
        <div className="flex">
          <span className="text-gray-500 w-20 shrink-0">Contact:</span>
          <span className="font-medium text-gray-800">Mr. Rajesh Kumar</span>
        </div>
        <div className="flex col-span-2">
          <span className="text-gray-500 w-20 shrink-0">Address:</span>
          <span className="font-medium text-gray-800">
            Plot No. 45, MIDC Industrial Area, Andheri East, Mumbai - 400093
          </span>
        </div>
      </div>
    </div>
  );
}

function PreviewSampleInfo() {
  return (
    <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-800 px-3 py-1.5">
        <h4 className="text-[10px] font-semibold text-white uppercase tracking-wider">
          Sample Information
        </h4>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 px-3 py-2.5 text-[10px]">
        <div className="flex">
          <span className="text-gray-500 w-24 shrink-0">Sample Desc.:</span>
          <span className="font-medium text-gray-800">Drinking Water Sample</span>
        </div>
        <div className="flex">
          <span className="text-gray-500 w-24 shrink-0">Sample Code:</span>
          <span className="font-medium text-gray-800 font-mono">SMP-2024-00321</span>
        </div>
        <div className="flex">
          <span className="text-gray-500 w-24 shrink-0">Batch/Lot No.:</span>
          <span className="font-medium text-gray-800">B-2024-0087</span>
        </div>
        <div className="flex">
          <span className="text-gray-500 w-24 shrink-0">Quantity:</span>
          <span className="font-medium text-gray-800">2 x 500 mL</span>
        </div>
        <div className="flex">
          <span className="text-gray-500 w-24 shrink-0">Condition:</span>
          <span className="font-medium text-gray-800">Sealed, Ambient Temp.</span>
        </div>
        <div className="flex">
          <span className="text-gray-500 w-24 shrink-0">Date Collected:</span>
          <span className="font-medium text-gray-800">{formatDate(new Date(Date.now() - 86400000 * 5).toISOString())}</span>
        </div>
      </div>
    </div>
  );
}

function PreviewTestTable({ settings }: { settings: SectionSettings }) {
  const rows = [
    { param: 'pH at 25\u00b0C', method: 'IS 3025 (Part 11)', unit: '--', spec: '6.5 - 8.5', result: '7.2', pass: true },
    { param: 'Turbidity', method: 'IS 3025 (Part 10)', unit: 'NTU', spec: 'Max 1.0', result: '0.45', pass: true },
    { param: 'Total Dissolved Solids', method: 'IS 3025 (Part 16)', unit: 'mg/L', spec: 'Max 500', result: '324', pass: true },
    { param: 'Total Hardness (as CaCO3)', method: 'IS 3025 (Part 21)', unit: 'mg/L', spec: 'Max 200', result: '168', pass: true },
    { param: 'Chloride (as Cl)', method: 'IS 3025 (Part 32)', unit: 'mg/L', spec: 'Max 250', result: '52.8', pass: true },
    { param: 'Iron (as Fe)', method: 'IS 3025 (Part 53)', unit: 'mg/L', spec: 'Max 0.3', result: '0.08', pass: true },
    { param: 'E. Coli', method: 'IS 5887 (Part 1)', unit: 'MPN/100mL', spec: 'Absent', result: 'Absent', pass: true },
    { param: 'Total Coliform', method: 'IS 5887 (Part 1)', unit: 'MPN/100mL', spec: 'Absent', result: 'Absent', pass: true },
  ];

  return (
    <div className="mb-4">
      <div className="bg-gray-800 px-3 py-1.5 rounded-t-lg">
        <h4 className="text-[10px] font-semibold text-white uppercase tracking-wider">
          Test Results
        </h4>
      </div>
      <table className="w-full border-collapse text-[9px] border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold text-gray-700 w-8">
              S.No.
            </th>
            <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold text-gray-700">
              Parameter
            </th>
            {settings.showMethodColumn && (
              <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold text-gray-700">
                Method
              </th>
            )}
            {settings.showUnitColumn && (
              <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold text-gray-700 w-16">
                Unit
              </th>
            )}
            <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold text-gray-700">
              Specification
            </th>
            <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold text-gray-700 w-16">
              Result
            </th>
            {settings.showPassFailColumn && (
              <th className="border border-gray-300 px-2 py-1.5 text-center font-semibold text-gray-700 w-14">
                Status
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
              <td className="border border-gray-300 px-2 py-1.5 text-center text-gray-500">
                {i + 1}
              </td>
              <td className="border border-gray-300 px-2 py-1.5 font-medium text-gray-800">
                {row.param}
              </td>
              {settings.showMethodColumn && (
                <td className="border border-gray-300 px-2 py-1.5 text-gray-600 font-mono">
                  {row.method}
                </td>
              )}
              {settings.showUnitColumn && (
                <td className="border border-gray-300 px-2 py-1.5 text-gray-600">
                  {row.unit}
                </td>
              )}
              <td className="border border-gray-300 px-2 py-1.5 text-gray-600">
                {row.spec}
              </td>
              <td className="border border-gray-300 px-2 py-1.5 font-semibold text-gray-900">
                {row.result}
              </td>
              {settings.showPassFailColumn && (
                <td className="border border-gray-300 px-2 py-1.5 text-center">
                  {row.pass ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-green-100 text-green-700">
                      PASS
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold bg-red-100 text-red-700">
                      FAIL
                    </span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PreviewRemarks() {
  return (
    <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-800 px-3 py-1.5">
        <h4 className="text-[10px] font-semibold text-white uppercase tracking-wider">
          Remarks
        </h4>
      </div>
      <div className="px-3 py-2.5">
        <p className="text-[10px] text-gray-700 italic leading-relaxed">
          All parameters tested are within the permissible limits as per IS 10500:2012 (Drinking Water Specification).
          The sample was tested under controlled laboratory conditions. No anomalies observed during analysis.
        </p>
      </div>
    </div>
  );
}

function PreviewConclusion() {
  return (
    <div className="mb-4 border-2 border-green-200 rounded-lg overflow-hidden bg-green-50/30">
      <div className="bg-green-700 px-3 py-1.5">
        <h4 className="text-[10px] font-semibold text-white uppercase tracking-wider">
          Conclusion / Opinion
        </h4>
      </div>
      <div className="px-3 py-2.5">
        <p className="text-[10px] text-gray-800 font-medium leading-relaxed">
          Based on the test results obtained, the sample <span className="font-bold text-green-700">CONFORMS</span> to
          the requirements of IS 10500:2012 for Drinking Water Specification. The sample is suitable for intended use.
        </p>
      </div>
    </div>
  );
}

function PreviewSignatureBlock({ settings }: { settings: SectionSettings }) {
  const sigCount = settings.signatureCount;
  const sigs = settings.signatures.slice(0, sigCount);

  return (
    <div className="mb-4 pt-6 mt-2">
      <div
        className="grid gap-6"
        style={{ gridTemplateColumns: `repeat(${sigCount}, 1fr)` }}
      >
        {sigs.map((sig, i) => (
          <div key={i} className="text-center">
            <div className="border-b-2 border-gray-400 mb-2 h-10" />
            <p className="text-[10px] font-bold text-gray-800">
              {sig.name || `Name ${i + 1}`}
            </p>
            <p className="text-[9px] text-gray-500 mt-0.5">
              {sig.designation || `Designation ${i + 1}`}
            </p>
            <p className="text-[8px] text-gray-400 mt-0.5">Date: ___/___/______</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewFooter({ settings }: { settings: SectionSettings }) {
  return (
    <div className="border-t-2 border-gray-800 pt-3 mt-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {settings.disclaimerText && (
            <p className="text-[8px] text-gray-500 leading-relaxed">
              {settings.disclaimerText}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1 border border-blue-200 bg-blue-50 rounded px-1.5 py-0.5">
              <Award className="h-3 w-3 text-blue-600" />
              <span className="text-[7px] font-semibold text-blue-700">NABL Accredited</span>
            </div>
            <p className="text-[7px] text-gray-400">
              End of Report -- Page 1 of 1
            </p>
          </div>
        </div>
        {settings.showQrCode && (
          <div className="shrink-0 flex flex-col items-center">
            <div className="w-14 h-14 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center bg-gray-50">
              <QrCode className="h-7 w-7 text-gray-400" />
            </div>
            <p className="text-[7px] text-gray-400 mt-1">Scan to verify</p>
          </div>
        )}
      </div>
    </div>
  );
}
