import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { get, post, put, del } from '../../services/api';
import type { ProductType, PaginatedResponse, ApiResponse } from '../../types';
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

interface ProductFormData {
  name: string;
  code: string;
  category: string;
  description: string;
  isActive: boolean;
}

const emptyForm: ProductFormData = {
  name: '',
  code: '',
  category: '',
  description: '',
  isActive: true,
};

export default function ProductTypesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductType | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<ProductType | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});

  const pageSize = 25;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', page, search],
    queryFn: () =>
      get<PaginatedResponse<ProductType>>('/product-types', {
        params: { page, limit: pageSize, search },
      }),
  });

  const products = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.total ?? 0;

  const createMutation = useMutation({
    mutationFn: (payload: ProductFormData) => post<ApiResponse<ProductType>>('/product-types', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product type created successfully');
      closeModal();
    },
    onError: () => toast.error('Failed to create product type'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ProductFormData }) =>
      put<ApiResponse<ProductType>>(`/product-types/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product type updated successfully');
      closeModal();
    },
    onError: () => toast.error('Failed to update product type'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => del<ApiResponse<null>>(`/product-types/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product type deleted successfully');
      setDeleteOpen(false);
      setDeletingProduct(null);
    },
    onError: () => toast.error('Failed to delete product type'),
  });

  const openCreate = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (product: ProductType) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      code: product.code,
      category: product.category,
      description: product.description ?? '',
      isActive: product.isActive,
    });
    setErrors({});
    setModalOpen(true);
  };

  const openDelete = (product: ProductType) => {
    setDeletingProduct(product);
    setDeleteOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
    setForm(emptyForm);
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ProductFormData, string>> = {};
    if (!form.name.trim()) newErrors.name = 'Product name is required';
    if (!form.code.trim()) newErrors.code = 'Product code is required';
    if (!form.category.trim()) newErrors.category = 'Category is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, payload: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const updateField = <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const columns: Column<ProductType>[] = [
    { key: 'code', header: 'Code', sortable: true, render: (row) => <span className="font-medium text-gray-900">{row.code}</span> },
    { key: 'name', header: 'Product Type', sortable: true },
    { key: 'category', header: 'Category', sortable: true },
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
          <h1 className="text-2xl font-bold text-gray-900">Product Types</h1>
          <p className="text-sm text-gray-500 mt-1">Manage product categories and types</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add Product Type
        </Button>
      </div>

      <Card noPadding>
        <div className="flex items-center gap-4 p-4 border-b border-gray-100">
          <SearchInput
            onSearch={(val) => { setSearch(val); setPage(1); }}
            placeholder="Search product types..."
            className="w-80"
          />
        </div>

        {isLoading ? (
          <Loader text="Loading product types..." />
        ) : isError ? (
          <EmptyState
            title="Failed to load product types"
            description="There was an error loading the list. The API server may not be running."
            icon={<Package className="h-8 w-8 text-gray-400" />}
          />
        ) : products.length === 0 ? (
          <EmptyState
            title="No product types found"
            description={search ? 'Try adjusting your search criteria' : 'Get started by adding your first product type'}
            icon={<Package className="h-8 w-8 text-gray-400" />}
            action={
              !search ? (
                <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate} size="sm">
                  Add Product Type
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <Table columns={columns} data={products} keyExtractor={(row) => row.id} />
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
        title={editingProduct ? 'Edit Product Type' : 'Add New Product Type'}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSubmit} loading={createMutation.isPending || updateMutation.isPending}>
              {editingProduct ? 'Update Product Type' : 'Create Product Type'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Product Name *"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            error={errors.name}
            placeholder="e.g., Pharmaceutical Tablet"
          />
          <Input
            label="Product Code *"
            value={form.code}
            onChange={(e) => updateField('code', e.target.value.toUpperCase())}
            error={errors.code}
            placeholder="e.g., PHARMA-TAB"
            disabled={!!editingProduct}
          />
          <Input
            label="Category *"
            value={form.category}
            onChange={(e) => updateField('category', e.target.value)}
            error={errors.category}
            placeholder="e.g., Pharmaceuticals, Food, Water, Cosmetics"
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
              id="productActive"
              checked={form.isActive}
              onChange={(e) => updateField('isActive', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="productActive" className="text-sm text-gray-700">Active</label>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeletingProduct(null); }}
        onConfirm={() => deletingProduct && deleteMutation.mutate(deletingProduct.id)}
        title="Delete Product Type"
        message={`Are you sure you want to delete "${deletingProduct?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
