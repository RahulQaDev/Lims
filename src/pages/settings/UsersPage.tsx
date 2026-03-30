import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Edit2,
  UserX,
  Users,
  AlertTriangle,
  Shield,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { get, post, put, del } from '../../services/api';
import type {
  User,
  Department,
  UserRole,
  PaginatedResponse,
  ApiResponse,
} from '../../types';
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
import { formatDate } from '../../utils/formatters';

// ─── Constants ───────────────────────────────────────────

const ALL_ROLES: { value: UserRole; label: string }[] = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'LAB_DIRECTOR', label: 'Lab Director' },
  { value: 'QUALITY_MANAGER', label: 'Quality Manager' },
  { value: 'DEPARTMENT_HEAD', label: 'Department Head' },
  { value: 'ANALYST', label: 'Analyst' },
  { value: 'REVIEWER', label: 'Reviewer' },
  { value: 'RECEPTIONIST', label: 'Receptionist' },
  { value: 'ACCOUNTS', label: 'Accounts' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'CLIENT', label: 'Client' },
];

const ROLE_BADGE_VARIANT: Record<string, 'purple' | 'blue' | 'green' | 'yellow' | 'orange' | 'cyan' | 'indigo' | 'teal' | 'red' | 'gray'> = {
  ADMIN: 'purple',
  LAB_DIRECTOR: 'blue',
  QUALITY_MANAGER: 'indigo',
  DEPARTMENT_HEAD: 'teal',
  ANALYST: 'green',
  REVIEWER: 'yellow',
  RECEPTIONIST: 'cyan',
  ACCOUNTS: 'orange',
  MARKETING: 'blue',
  CLIENT: 'gray',
};

const DEPARTMENT_ROLES = [
  { value: 'head', label: 'Head' },
  { value: 'analyst', label: 'Analyst' },
  { value: 'reviewer', label: 'Reviewer' },
  { value: 'approver', label: 'Approver' },
  { value: 'member', label: 'Member' },
];

const ROLE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Roles' },
  ...ALL_ROLES.map((r) => ({ value: r.value, label: r.label })),
];

// ─── Form types ──────────────────────────────────────────

interface UserFormData {
  fullName: string;
  username: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
}

interface DeptAssignment {
  departmentId: string;
  departmentName: string;
  role: string;
}

const emptyForm: UserFormData = {
  fullName: '',
  username: '',
  email: '',
  password: '',
  phone: '',
  role: 'ANALYST',
};

function formatRoleLabel(role: string): string {
  return role
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deactivatingUser, setDeactivatingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});

  // Department assignments
  const [deptAssignments, setDeptAssignments] = useState<DeptAssignment[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedDeptRole, setSelectedDeptRole] = useState('member');

  const pageSize = 25;

  // ─── Fetch users ───────────────────────────────────────
  const { data, isLoading, isError } = useQuery({
    queryKey: ['users', page, search, roleFilter],
    queryFn: () =>
      get<PaginatedResponse<User>>('/users', {
        params: {
          page,
          limit: pageSize,
          search,
          role: roleFilter === 'all' ? undefined : roleFilter,
        },
      }),
  });

  const users = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalItems = data?.total ?? 0;

  // ─── Fetch departments for assignment ──────────────────
  const { data: departmentsData } = useQuery({
    queryKey: ['departments-list'],
    queryFn: () =>
      get<ApiResponse<Department[]>>('/departments').then((res) => res.data),
  });

  const departments = departmentsData ?? [];

  // ─── Fetch user departments when editing ───────────────
  const { data: userDepts } = useQuery({
    queryKey: ['user-departments', editingUser?.id],
    queryFn: () =>
      get<ApiResponse<DeptAssignment[]>>(
        `/users/${editingUser!.id}/departments`,
      ).then((res) => res.data),
    enabled: !!editingUser?.id && modalOpen,
  });

  // ─── Mutations ─────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (payload: UserFormData) =>
      post<ApiResponse<User>>('/users', payload),
    onSuccess: async (res) => {
      // Assign departments
      const userId = res.data?.id;
      if (userId && deptAssignments.length > 0) {
        await Promise.allSettled(
          deptAssignments.map((d) =>
            post(`/departments/${d.departmentId}/members`, {
              userId,
              role: d.role,
            }),
          ),
        );
      }
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created successfully');
      closeModal();
    },
    onError: () => toast.error('Failed to create user'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<UserFormData> }) =>
      put<ApiResponse<User>>(`/users/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated successfully');
      closeModal();
    },
    onError: () => toast.error('Failed to update user'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => del<ApiResponse<null>>(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deactivated successfully');
      setDeactivateOpen(false);
      setDeactivatingUser(null);
    },
    onError: () => toast.error('Failed to deactivate user'),
  });

  const addDeptMemberMutation = useMutation({
    mutationFn: ({ deptId, userId, role }: { deptId: string; userId: string; role: string }) =>
      post(`/departments/${deptId}/members`, { userId, role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-departments'] });
      toast.success('Department assignment added');
    },
    onError: () => toast.error('Failed to add department assignment'),
  });

  const removeDeptMemberMutation = useMutation({
    mutationFn: ({ deptId, userId }: { deptId: string; userId: string }) =>
      del(`/departments/${deptId}/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-departments'] });
      toast.success('Department assignment removed');
    },
    onError: () => toast.error('Failed to remove department assignment'),
  });

  // ─── Modal handlers ────────────────────────────────────

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setDeptAssignments([]);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setForm({
      fullName: `${user.firstName} ${user.lastName}`.trim(),
      username: user.username,
      email: user.email,
      password: '',
      phone: user.phone ?? '',
      role: user.role,
    });
    setDeptAssignments([]);
    setErrors({});
    setModalOpen(true);
  };

  const openDeactivate = (user: User) => {
    setDeactivatingUser(user);
    setDeactivateOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
    setForm(emptyForm);
    setDeptAssignments([]);
    setErrors({});
    setSelectedDeptId('');
    setSelectedDeptRole('member');
  };

  // ─── Validation ────────────────────────────────────────

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof UserFormData, string>> = {};
    if (!form.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!form.username.trim()) newErrors.username = 'Username is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = 'Invalid email format';
    if (!editingUser && !form.password.trim())
      newErrors.password = 'Password is required';
    else if (!editingUser && form.password.length < 6)
      newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    if (editingUser) {
      const payload: Partial<UserFormData> = {
        fullName: form.fullName,
        username: form.username,
        email: form.email,
        phone: form.phone,
        role: form.role,
      };
      if (form.password.trim()) {
        payload.password = form.password;
      }
      updateMutation.mutate({ id: editingUser.id, payload });
    } else {
      createMutation.mutate(form);
    }
  };

  const updateField = <K extends keyof UserFormData>(field: K, value: UserFormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // ─── Department assignment handlers ────────────────────

  const addDeptAssignment = () => {
    if (!selectedDeptId) return;
    const dept = departments.find((d) => d.id === selectedDeptId);
    if (!dept) return;

    if (editingUser) {
      // Direct API call when editing existing user
      addDeptMemberMutation.mutate({
        deptId: selectedDeptId,
        userId: editingUser.id,
        role: selectedDeptRole,
      });
    } else {
      // Local state for new users
      if (deptAssignments.find((d) => d.departmentId === selectedDeptId)) {
        toast.error('Department already assigned');
        return;
      }
      setDeptAssignments((prev) => [
        ...prev,
        { departmentId: dept.id, departmentName: dept.name, role: selectedDeptRole },
      ]);
    }
    setSelectedDeptId('');
    setSelectedDeptRole('member');
  };

  const removeDeptAssignment = (departmentId: string) => {
    if (editingUser) {
      removeDeptMemberMutation.mutate({
        deptId: departmentId,
        userId: editingUser.id,
      });
    } else {
      setDeptAssignments((prev) => prev.filter((d) => d.departmentId !== departmentId));
    }
  };

  // Combine remote + local assignments for display
  const displayAssignments = editingUser ? (userDepts ?? []) : deptAssignments;

  // ─── Table columns ─────────────────────────────────────

  const columns: Column<User>[] = [
    {
      key: 'username',
      header: 'Username',
      sortable: true,
      render: (row) => (
        <span className="font-medium text-gray-900">{row.username}</span>
      ),
    },
    {
      key: 'fullName',
      header: 'Full Name',
      sortable: true,
      render: (row) => `${row.firstName} ${row.lastName}`.trim() || '—',
    },
    { key: 'email', header: 'Email', sortable: true },
    {
      key: 'role',
      header: 'Role',
      render: (row) => (
        <Badge variant={ROLE_BADGE_VARIANT[row.role] ?? 'gray'}>
          {formatRoleLabel(row.role)}
        </Badge>
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
      key: 'lastLogin',
      header: 'Last Login',
      sortable: true,
      render: (row) => formatDate(row.lastLogin),
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
              openEdit(row);
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Edit"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          {row.isActive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openDeactivate(row);
              }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Deactivate"
            >
              <UserX className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users &amp; Roles</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage user accounts, roles, and department assignments
          </p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Add User
        </Button>
      </div>

      {/* Users table */}
      <Card noPadding>
        <div className="flex items-center gap-4 p-4 border-b border-gray-100">
          <SearchInput
            onSearch={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="Search by name, username, email..."
            className="w-80"
          />
          <Select
            options={ROLE_FILTER_OPTIONS}
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="w-48"
          />
        </div>

        {isLoading ? (
          <Loader text="Loading users..." />
        ) : isError ? (
          <EmptyState
            title="Failed to load users"
            description="There was an error loading the users list. The API server may not be running."
            icon={<AlertTriangle className="h-8 w-8 text-gray-400" />}
          />
        ) : users.length === 0 ? (
          <EmptyState
            title="No users found"
            description={
              search || roleFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by adding your first user'
            }
            icon={<Users className="h-8 w-8 text-gray-400" />}
            action={
              !search && roleFilter === 'all' ? (
                <Button icon={<Plus className="h-4 w-4" />} onClick={openCreate} size="sm">
                  Add User
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <Table columns={columns} data={users} keyExtractor={(row) => row.id} />
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

      {/* Create / Edit User Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingUser ? 'Edit User' : 'Add New User'}
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
              {editingUser ? 'Update User' : 'Create User'}
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          {/* Basic info */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-400" />
              User Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name *"
                value={form.fullName}
                onChange={(e) => updateField('fullName', e.target.value)}
                error={errors.fullName}
                placeholder="Enter full name"
              />
              <Input
                label="Username *"
                value={form.username}
                onChange={(e) => updateField('username', e.target.value)}
                error={errors.username}
                placeholder="Enter username"
                disabled={!!editingUser}
              />
              <Input
                label="Email *"
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                error={errors.email}
                placeholder="email@example.com"
              />
              {!editingUser && (
                <Input
                  label="Password *"
                  type="password"
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  error={errors.password}
                  placeholder="Min. 6 characters"
                />
              )}
              <Input
                label="Phone"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="Phone number"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  value={form.role}
                  onChange={(e) => updateField('role', e.target.value as UserRole)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {ALL_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Department assignments */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              Department Assignments
            </h4>

            {/* Add assignment */}
            <div className="flex items-end gap-3 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select department...</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-40">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role in Dept.
                </label>
                <select
                  value={selectedDeptRole}
                  onChange={(e) => setSelectedDeptRole(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {DEPARTMENT_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                size="sm"
                variant="outline"
                icon={<Plus className="h-3.5 w-3.5" />}
                onClick={addDeptAssignment}
                disabled={!selectedDeptId}
              >
                Add
              </Button>
            </div>

            {/* Assigned departments list */}
            {displayAssignments.length > 0 ? (
              <div className="space-y-2">
                {displayAssignments.map((assignment) => (
                  <div
                    key={assignment.departmentId}
                    className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900">
                        {assignment.departmentName}
                      </span>
                      <Badge variant="blue">
                        {assignment.role.charAt(0).toUpperCase() + assignment.role.slice(1)}
                      </Badge>
                    </div>
                    <button
                      onClick={() => removeDeptAssignment(assignment.departmentId)}
                      className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Remove assignment"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                No department assignments yet
              </p>
            )}
          </div>
        </div>
      </Modal>

      {/* Deactivate Confirmation */}
      <ConfirmDialog
        isOpen={deactivateOpen}
        onClose={() => {
          setDeactivateOpen(false);
          setDeactivatingUser(null);
        }}
        onConfirm={() => deactivatingUser && deactivateMutation.mutate(deactivatingUser.id)}
        title="Deactivate User"
        message={`Are you sure you want to deactivate "${deactivatingUser?.firstName} ${deactivatingUser?.lastName}"? They will no longer be able to log in.`}
        confirmText="Deactivate"
        loading={deactivateMutation.isPending}
      />
    </div>
  );
}
