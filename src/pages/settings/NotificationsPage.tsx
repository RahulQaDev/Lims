import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  CheckCheck,
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  ClipboardList,
  Clock,
  X,
  FlaskConical,
  FileText,
  Shield,
  FileCheck,
  Package,
  Settings,
  Mail,
  BellRing,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { get, put, del } from '../../services/api';
import type {
  Notification,
  NotificationType,
  NotificationCategory,
  NotificationPreferences,
  NotificationStats,
  ApiResponse,
} from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';
import Loader from '../../components/ui/Loader';

// ─── Constants ───────────────────────────────────────────

interface CategoryTab {
  value: NotificationCategory | 'all';
  label: string;
  icon: typeof Bell;
}

const CATEGORY_TABS: CategoryTab[] = [
  { value: 'all', label: 'All', icon: Bell },
  { value: 'sample', label: 'Samples', icon: FlaskConical },
  { value: 'result', label: 'Results', icon: FileText },
  { value: 'review', label: 'Reviews', icon: Shield },
  { value: 'coa', label: 'CoA', icon: FileCheck },
  { value: 'inventory', label: 'Inventory', icon: Package },
  { value: 'system', label: 'System', icon: Settings },
];

const typeConfig: Record<string, { icon: typeof Info; color: string; bgColor: string; badgeVariant: 'blue' | 'yellow' | 'red' | 'green' | 'purple' | 'orange' }> = {
  info: { icon: Info, color: 'text-blue-600', bgColor: 'bg-blue-50', badgeVariant: 'blue' },
  warning: { icon: AlertTriangle, color: 'text-yellow-600', bgColor: 'bg-yellow-50', badgeVariant: 'yellow' },
  error: { icon: AlertCircle, color: 'text-red-600', bgColor: 'bg-red-50', badgeVariant: 'red' },
  success: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50', badgeVariant: 'green' },
  task: { icon: ClipboardList, color: 'text-purple-600', bgColor: 'bg-purple-50', badgeVariant: 'purple' },
  reminder: { icon: Clock, color: 'text-orange-600', bgColor: 'bg-orange-50', badgeVariant: 'orange' },
  escalation: { icon: TrendingUp, color: 'text-red-600', bgColor: 'bg-red-50', badgeVariant: 'red' },
};

const PREF_LABELS: Record<NotificationCategory, string> = {
  sample: 'Sample Notifications',
  booking: 'Booking Notifications',
  result: 'Result Notifications',
  review: 'Review Notifications',
  coa: 'CoA Notifications',
  invoice: 'Invoice Notifications',
  inventory: 'Inventory Alerts',
  system: 'System Notifications',
};

const PREF_DESCRIPTIONS: Record<NotificationCategory, string> = {
  sample: 'New samples received, TAT warnings, sample assignments',
  booking: 'New bookings, booking updates, test assignments',
  result: 'Results entered, results pending review',
  review: 'Review requests, approvals, rejections',
  coa: 'CoA generation, CoA approval, dispatch ready',
  invoice: 'Invoice generated, payment received',
  inventory: 'Low stock alerts, purchase order updates',
  system: 'Calibration reminders, maintenance, announcements',
};

// ─── Helpers ─────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

interface PaginatedNotificationResponse {
  success: boolean;
  data: Notification[];
  message: string;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ─── Component ───────────────────────────────────────────

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState<NotificationCategory | 'all'>('all');
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all');
  const [showPreferences, setShowPreferences] = useState(false);
  const pageSize = 15;

  // ─── Queries ──────────────────────────────────────────

  const { data: notificationsRes, isLoading } = useQuery({
    queryKey: ['notifications', page, activeCategory, filterRead],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(pageSize));
      if (activeCategory !== 'all') params.set('category', activeCategory);
      if (filterRead === 'unread') params.set('isRead', 'false');
      if (filterRead === 'read') params.set('isRead', 'true');
      return get<PaginatedNotificationResponse>(`/notifications?${params.toString()}`);
    },
  });

  const { data: statsRes } = useQuery({
    queryKey: ['notification-stats'],
    queryFn: () => get<ApiResponse<NotificationStats>>('/notifications/stats'),
    refetchInterval: 30000,
  });

  const { data: prefsRes } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => get<ApiResponse<{ preferences: NotificationPreferences }>>('/notifications/preferences'),
    enabled: showPreferences,
  });

  const notifications = notificationsRes?.data || [];
  const pagination = notificationsRes?.pagination;
  const stats = statsRes?.data;
  const preferences = prefsRes?.data?.preferences;

  // ─── Mutations ────────────────────────────────────────

  const markReadMutation = useMutation({
    mutationFn: (id: string) => put(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => put('/notifications/read-all', {
      category: activeCategory !== 'all' ? activeCategory : undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
      toast.success(activeCategory !== 'all'
        ? `All ${activeCategory} notifications marked as read`
        : 'All notifications marked as read'
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => del(`/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-stats'] });
      toast.success('Notification deleted');
    },
  });

  const updatePrefsMutation = useMutation({
    mutationFn: (prefs: NotificationPreferences) =>
      put('/notifications/preferences', { preferences: prefs }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast.success('Preferences saved');
    },
  });

  // ─── Handlers ─────────────────────────────────────────

  const handleCategoryChange = (cat: NotificationCategory | 'all') => {
    setActiveCategory(cat);
    setPage(1);
  };

  const handleTogglePref = (category: NotificationCategory, channel: 'inApp' | 'email') => {
    if (!preferences) return;
    const updated = {
      ...preferences,
      [category]: {
        ...preferences[category],
        [channel]: !preferences[category][channel],
      },
    };
    updatePrefsMutation.mutate(updated);
  };

  const totalUnread = stats?.totalUnread || 0;

  // ─── Render ───────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalUnread > 0
              ? `You have ${totalUnread} unread notification${totalUnread > 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            icon={<Settings className="h-4 w-4" />}
            onClick={() => setShowPreferences(!showPreferences)}
          >
            Preferences
          </Button>
          {totalUnread > 0 && (
            <Button
              variant="outline"
              icon={<CheckCheck className="h-4 w-4" />}
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {CATEGORY_TABS.map((tab) => {
          const TabIcon = tab.icon;
          const catCount = tab.value === 'all'
            ? totalUnread
            : (stats?.byCategory?.[tab.value as NotificationCategory] || 0);

          return (
            <button
              key={tab.value}
              onClick={() => handleCategoryChange(tab.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeCategory === tab.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <TabIcon className="h-4 w-4" />
              {tab.label}
              {catCount > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                  activeCategory === tab.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-red-100 text-red-600'
                }`}>
                  {catCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Read/Unread filter */}
      <div className="flex items-center gap-2">
        {(['all', 'unread', 'read'] as const).map((f) => (
          <button
            key={f}
            onClick={() => { setFilterRead(f); setPage(1); }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              filterRead === f
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'All' : f === 'unread' ? 'Unread' : 'Read'}
          </button>
        ))}
      </div>

      {/* Notification List */}
      {isLoading ? (
        <Loader text="Loading notifications..." />
      ) : notifications.length === 0 ? (
        <Card>
          <EmptyState
            title="No notifications"
            description={
              filterRead !== 'all' || activeCategory !== 'all'
                ? 'Try adjusting your filters'
                : 'You are all caught up!'
            }
            icon={<Bell className="h-8 w-8 text-gray-400" />}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const config = typeConfig[notification.type?.toLowerCase()] || typeConfig.info;
            const Icon = config.icon;

            return (
              <div
                key={notification.id}
                onClick={() => {
                  if (!notification.isRead) {
                    markReadMutation.mutate(notification.id);
                  }
                  if (notification.link) {
                    window.location.href = notification.link;
                  }
                }}
                className={`bg-white rounded-xl border shadow-sm p-4 transition-all cursor-pointer hover:shadow-md ${
                  notification.isRead
                    ? 'border-gray-200'
                    : 'border-blue-200 bg-blue-50/30'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-lg ${config.bgColor} ${config.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`text-sm font-semibold ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                          {notification.title}
                        </h3>
                        <Badge variant={config.badgeVariant}>
                          {notification.type}
                        </Badge>
                        {notification.category && notification.category !== 'system' && (
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                            {notification.category}
                          </span>
                        )}
                        {!notification.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-gray-400">{timeAgo(notification.createdAt)}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMutation.mutate(notification.id);
                          }}
                          className="p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className={`text-sm mt-1 leading-relaxed ${notification.isRead ? 'text-gray-500' : 'text-gray-600'}`}>
                      {notification.message}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Card>
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </Card>
      )}

      {/* Preferences Section */}
      {showPreferences && (
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <BellRing className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
                <p className="text-sm text-gray-500">Choose how you want to be notified for each category</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Category</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 w-32">
                      <div className="flex items-center justify-center gap-1.5">
                        <Bell className="h-4 w-4" />
                        In-App
                      </div>
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 w-32">
                      <div className="flex items-center justify-center gap-1.5">
                        <Mail className="h-4 w-4" />
                        Email
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(Object.keys(PREF_LABELS) as NotificationCategory[]).map((cat) => (
                    <tr key={cat} className="border-b border-gray-100 last:border-b-0">
                      <td className="py-4 px-4">
                        <div className="font-medium text-sm text-gray-900">{PREF_LABELS[cat]}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{PREF_DESCRIPTIONS[cat]}</div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <ToggleSwitch
                          enabled={preferences?.[cat]?.inApp ?? true}
                          onChange={() => handleTogglePref(cat, 'inApp')}
                        />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <ToggleSwitch
                          enabled={preferences?.[cat]?.email ?? false}
                          onChange={() => handleTogglePref(cat, 'email')}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Toggle Switch Component ─────────────────────────────

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        enabled ? 'bg-blue-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
