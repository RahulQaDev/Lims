import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { User as UserIcon, Shield, Lock, Clock, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { put } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import type { ApiResponse, User } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { formatDate } from '../../utils/formatters';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const emptyPassword: PasswordFormData = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

function getRoleBadgeVariant(role: string): 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'gray' | 'teal' | 'indigo' | 'cyan' {
  switch (role) {
    case 'ADMIN': return 'red';
    case 'LAB_DIRECTOR': return 'purple';
    case 'QUALITY_MANAGER': return 'indigo';
    case 'DEPARTMENT_HEAD': return 'blue';
    case 'ANALYST': return 'green';
    case 'REVIEWER': return 'teal';
    case 'RECEPTIONIST': return 'cyan';
    case 'ACCOUNTS': return 'orange';
    case 'MARKETING': return 'blue';
    default: return 'gray';
  }
}

function getRoleLabel(role: string): string {
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';
}

export default function ProfilePage() {
  const { user, setUser } = useAuth();

  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
  });
  const [profileErrors, setProfileErrors] = useState<Partial<Record<keyof ProfileFormData, string>>>({});

  const [passwordForm, setPasswordForm] = useState<PasswordFormData>(emptyPassword);
  const [passwordErrors, setPasswordErrors] = useState<Partial<Record<keyof PasswordFormData, string>>>({});

  const profileMutation = useMutation({
    mutationFn: (payload: ProfileFormData) => put<ApiResponse<User>>('/auth/me', payload),
    onSuccess: (res) => {
      if (res.data) {
        setUser(res.data);
      }
      toast.success('Profile updated successfully');
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const passwordMutation = useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      put<ApiResponse<null>>('/auth/change-password', payload),
    onSuccess: () => {
      toast.success('Password changed successfully');
      setPasswordForm(emptyPassword);
      setPasswordErrors({});
    },
    onError: () => toast.error('Failed to change password. Check your current password.'),
  });

  const validateProfile = (): boolean => {
    const errors: Partial<Record<keyof ProfileFormData, string>> = {};
    if (!profileForm.firstName.trim()) errors.firstName = 'First name is required';
    if (!profileForm.lastName.trim()) errors.lastName = 'Last name is required';
    if (!profileForm.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email)) errors.email = 'Invalid email format';
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePassword = (): boolean => {
    const errors: Partial<Record<keyof PasswordFormData, string>> = {};
    if (!passwordForm.currentPassword) errors.currentPassword = 'Current password is required';
    if (!passwordForm.newPassword) errors.newPassword = 'New password is required';
    else if (passwordForm.newPassword.length < 6) errors.newPassword = 'Password must be at least 6 characters';
    if (!passwordForm.confirmPassword) errors.confirmPassword = 'Please confirm your new password';
    else if (passwordForm.newPassword !== passwordForm.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSubmit = () => {
    if (!validateProfile()) return;
    profileMutation.mutate(profileForm);
  };

  const handlePasswordSubmit = () => {
    if (!validatePassword()) return;
    passwordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  const updateProfileField = <K extends keyof ProfileFormData>(field: K, value: ProfileFormData[K]) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
    if (profileErrors[field]) setProfileErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const updatePasswordField = <K extends keyof PasswordFormData>(field: K, value: PasswordFormData[K]) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
    if (passwordErrors[field]) setPasswordErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">View and manage your account information</p>
      </div>

      {/* Profile Card */}
      <Card>
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-white">
              {getInitials(user.firstName, user.lastName)}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-gray-900">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">@{user.username}</p>
            <p className="text-sm text-gray-500">{user.email}</p>

            <div className="flex items-center gap-3 mt-3">
              <Badge variant={getRoleBadgeVariant(user.role)}>
                <Shield className="h-3 w-3 mr-1" />
                {getRoleLabel(user.role)}
              </Badge>
              {user.departmentName && (
                <Badge variant="gray">
                  <Building2 className="h-3 w-3 mr-1" />
                  {user.departmentName}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Edit Profile */}
      <Card title="Edit Profile" subtitle="Update your personal information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="First Name *"
            value={profileForm.firstName}
            onChange={(e) => updateProfileField('firstName', e.target.value)}
            error={profileErrors.firstName}
            placeholder="First name"
          />
          <Input
            label="Last Name *"
            value={profileForm.lastName}
            onChange={(e) => updateProfileField('lastName', e.target.value)}
            error={profileErrors.lastName}
            placeholder="Last name"
          />
          <Input
            label="Email *"
            type="email"
            value={profileForm.email}
            onChange={(e) => updateProfileField('email', e.target.value)}
            error={profileErrors.email}
            placeholder="email@example.com"
          />
          <Input
            label="Phone"
            value={profileForm.phone}
            onChange={(e) => updateProfileField('phone', e.target.value)}
            placeholder="Phone number"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            onClick={handleProfileSubmit}
            loading={profileMutation.isPending}
            icon={<UserIcon className="h-4 w-4" />}
          >
            Save Profile
          </Button>
        </div>
      </Card>

      {/* Change Password */}
      <Card title="Change Password" subtitle="Update your account password">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Current Password *"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(e) => updatePasswordField('currentPassword', e.target.value)}
            error={passwordErrors.currentPassword}
            placeholder="Enter current password"
          />
          <Input
            label="New Password *"
            type="password"
            value={passwordForm.newPassword}
            onChange={(e) => updatePasswordField('newPassword', e.target.value)}
            error={passwordErrors.newPassword}
            placeholder="Enter new password"
          />
          <Input
            label="Confirm Password *"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(e) => updatePasswordField('confirmPassword', e.target.value)}
            error={passwordErrors.confirmPassword}
            placeholder="Confirm new password"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            onClick={handlePasswordSubmit}
            loading={passwordMutation.isPending}
            icon={<Lock className="h-4 w-4" />}
          >
            Change Password
          </Button>
        </div>
      </Card>

      {/* Activity Info */}
      <Card title="Activity" subtitle="Account activity information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Last Login</p>
              <p className="text-sm font-medium text-gray-900">
                {user.lastLogin ? formatDate(user.lastLogin, { hour: '2-digit', minute: '2-digit' }) : 'Never'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <UserIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Account Created</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(user.createdAt)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Department Assignments */}
      {user.departmentName && (
        <Card title="Department Assignments" subtitle="Your assigned departments and roles">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{user.departmentName}</td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
