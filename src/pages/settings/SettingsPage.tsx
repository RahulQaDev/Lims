import { useState, useEffect, useMemo } from 'react';
import {
  Settings,
  Building2,
  FileText,
  Mail,
  Bell,
  Clock,
  Save,
  Send,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

// ─── Types ───────────────────────────────────────────────

interface GeneralSettings {
  labName: string;
  labAddress: string;
  nablAccreditationNumber: string;
  labPhone: string;
  labEmail: string;
  logoPath: string;
}

interface ReportSettings {
  reportPrefix: string;
  reportSeparator: string;
  reportYearFormat: '2-digit' | '4-digit';
  reportCounterDigits: number;
  sampleCodeFormat: string;
  invoiceNumberFormat: string;
}

interface EmailSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
}

interface NotificationSettings {
  sampleReceived: boolean;
  bookingConfirmed: boolean;
  resultsEntered: boolean;
  resultsApproved: boolean;
  coaReady: boolean;
  invoiceGenerated: boolean;
  tatBreachDeptHead: boolean;
  tatBreachLabHead: boolean;
  lowStockAlert: boolean;
  calibrationDueAlert: boolean;
}

interface TatSettings {
  normalDays: number;
  urgentDays: number;
  expressDays: number;
  warningPercent: number;
  alertPercent: number;
  breachPercent: number;
}

type TabKey = 'general' | 'reports' | 'email' | 'notifications' | 'tat';

const STORAGE_KEY_PREFIX = 'lims_settings_';

function loadFromStorage<T>(key: string, defaults: T): T {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    if (stored) return { ...defaults, ...JSON.parse(stored) } as T;
  } catch {
    // ignore parse errors
  }
  return defaults;
}

function saveToStorage<T>(key: string, data: T): void {
  localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(data));
}

// ─── Defaults ────────────────────────────────────────────

const defaultGeneral: GeneralSettings = {
  labName: '',
  labAddress: '',
  nablAccreditationNumber: '',
  labPhone: '',
  labEmail: '',
  logoPath: '',
};

const defaultReports: ReportSettings = {
  reportPrefix: 'RPT',
  reportSeparator: '-',
  reportYearFormat: '4-digit',
  reportCounterDigits: 5,
  sampleCodeFormat: 'SMP-{YYYY}-{NNNNN}',
  invoiceNumberFormat: 'INV-{YYYY}-{NNNNN}',
};

const defaultEmail: EmailSettings = {
  smtpHost: '',
  smtpPort: 587,
  smtpUsername: '',
  smtpPassword: '',
  fromEmail: '',
  fromName: '',
};

const defaultNotifications: NotificationSettings = {
  sampleReceived: true,
  bookingConfirmed: true,
  resultsEntered: true,
  resultsApproved: true,
  coaReady: true,
  invoiceGenerated: true,
  tatBreachDeptHead: true,
  tatBreachLabHead: true,
  lowStockAlert: true,
  calibrationDueAlert: true,
};

const defaultTat: TatSettings = {
  normalDays: 7,
  urgentDays: 3,
  expressDays: 1,
  warningPercent: 75,
  alertPercent: 90,
  breachPercent: 100,
};

// ─── Component ───────────────────────────────────────────

export default function SettingsPage() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('general');

  // Form states
  const [general, setGeneral] = useState<GeneralSettings>(() => loadFromStorage('general', defaultGeneral));
  const [reports, setReports] = useState<ReportSettings>(() => loadFromStorage('reports', defaultReports));
  const [email, setEmail] = useState<EmailSettings>(() => loadFromStorage('email', defaultEmail));
  const [notifications, setNotifications] = useState<NotificationSettings>(() => loadFromStorage('notifications', defaultNotifications));
  const [tat, setTat] = useState<TatSettings>(() => loadFromStorage('tat', defaultTat));

  // Load from localStorage on mount
  useEffect(() => {
    setGeneral(loadFromStorage('general', defaultGeneral));
    setReports(loadFromStorage('reports', defaultReports));
    setEmail(loadFromStorage('email', defaultEmail));
    setNotifications(loadFromStorage('notifications', defaultNotifications));
    setTat(loadFromStorage('tat', defaultTat));
  }, []);

  const tabs: { key: TabKey; label: string; icon: typeof Settings }[] = [
    { key: 'general', label: 'General', icon: Building2 },
    { key: 'reports', label: 'Report Settings', icon: FileText },
    { key: 'email', label: 'Email Settings', icon: Mail },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'tat', label: 'TAT Settings', icon: Clock },
  ];

  const saveGeneral = () => {
    saveToStorage('general', general);
    toast.success('General settings saved');
  };

  const saveReports = () => {
    saveToStorage('reports', reports);
    toast.success('Report settings saved');
  };

  const saveEmail = () => {
    saveToStorage('email', email);
    toast.success('Email settings saved');
  };

  const saveNotifications = () => {
    saveToStorage('notifications', notifications);
    toast.success('Notification settings saved');
  };

  const saveTat = () => {
    saveToStorage('tat', tat);
    toast.success('TAT settings saved');
  };

  const handleTestEmail = () => {
    if (!email.smtpHost || !email.fromEmail) {
      toast.error('Please configure SMTP settings first');
      return;
    }
    toast.success('Test email sent successfully (simulated)');
  };

  // Report format preview
  const reportPreview = useMemo(() => {
    const year = reports.reportYearFormat === '2-digit'
      ? new Date().getFullYear().toString().slice(-2)
      : new Date().getFullYear().toString();
    const counter = '1'.padStart(reports.reportCounterDigits, '0');
    return `${reports.reportPrefix}${reports.reportSeparator}${year}${reports.reportSeparator}${counter}`;
  }, [reports.reportPrefix, reports.reportSeparator, reports.reportYearFormat, reports.reportCounterDigits]);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Settings className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900">Access Restricted</h2>
          <p className="text-sm text-gray-500 mt-1">Only administrators can access system settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure lab-wide system settings</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Tabs */}
        <div className="w-56 shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.key
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* General Tab */}
          {activeTab === 'general' && (
            <Card title="General Settings" subtitle="Basic lab information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label="Lab Name"
                    value={general.labName}
                    onChange={(e) => setGeneral((p) => ({ ...p, labName: e.target.value }))}
                    placeholder="Enter lab name"
                  />
                </div>
                <div className="md:col-span-2">
                  <Input
                    label="Lab Address"
                    value={general.labAddress}
                    onChange={(e) => setGeneral((p) => ({ ...p, labAddress: e.target.value }))}
                    placeholder="Enter full address"
                  />
                </div>
                <Input
                  label="NABL Accreditation Number"
                  value={general.nablAccreditationNumber}
                  onChange={(e) => setGeneral((p) => ({ ...p, nablAccreditationNumber: e.target.value }))}
                  placeholder="e.g., TC-XXXX"
                />
                <Input
                  label="Lab Phone"
                  value={general.labPhone}
                  onChange={(e) => setGeneral((p) => ({ ...p, labPhone: e.target.value }))}
                  placeholder="Phone number"
                />
                <Input
                  label="Lab Email"
                  type="email"
                  value={general.labEmail}
                  onChange={(e) => setGeneral((p) => ({ ...p, labEmail: e.target.value }))}
                  placeholder="lab@example.com"
                />
                <div>
                  <Input
                    label="Logo"
                    value={general.logoPath}
                    onChange={(e) => setGeneral((p) => ({ ...p, logoPath: e.target.value }))}
                    placeholder="Logo file path (upload coming soon)"
                    helperText="Logo upload feature will be available in a future update"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button icon={<Save className="h-4 w-4" />} onClick={saveGeneral}>
                  Save Changes
                </Button>
              </div>
            </Card>
          )}

          {/* Report Settings Tab */}
          {activeTab === 'reports' && (
            <Card title="Report Settings" subtitle="Configure numbering formats for reports, samples, and invoices">
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Report Number Format</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Input
                      label="Prefix"
                      value={reports.reportPrefix}
                      onChange={(e) => setReports((p) => ({ ...p, reportPrefix: e.target.value.toUpperCase() }))}
                      placeholder="RPT"
                    />
                    <Input
                      label="Separator"
                      value={reports.reportSeparator}
                      onChange={(e) => setReports((p) => ({ ...p, reportSeparator: e.target.value }))}
                      placeholder="-"
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Year Format</label>
                      <select
                        value={reports.reportYearFormat}
                        onChange={(e) => setReports((p) => ({ ...p, reportYearFormat: e.target.value as '2-digit' | '4-digit' }))}
                        className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="4-digit">4-digit (2026)</option>
                        <option value="2-digit">2-digit (26)</option>
                      </select>
                    </div>
                    <Input
                      label="Counter Digits"
                      type="number"
                      value={String(reports.reportCounterDigits)}
                      onChange={(e) => setReports((p) => ({ ...p, reportCounterDigits: Math.max(1, Number(e.target.value)) }))}
                      placeholder="5"
                    />
                  </div>
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg flex items-center gap-2">
                    <Eye className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Preview: </span>
                    <span className="text-sm font-mono font-medium text-gray-900">{reportPreview}</span>
                  </div>
                </div>

                <hr className="border-gray-200" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Sample Code Format"
                    value={reports.sampleCodeFormat}
                    onChange={(e) => setReports((p) => ({ ...p, sampleCodeFormat: e.target.value }))}
                    placeholder="SMP-{YYYY}-{NNNNN}"
                    helperText="Use {YYYY} for year, {NNNNN} for counter"
                  />
                  <Input
                    label="Invoice Number Format"
                    value={reports.invoiceNumberFormat}
                    onChange={(e) => setReports((p) => ({ ...p, invoiceNumberFormat: e.target.value }))}
                    placeholder="INV-{YYYY}-{NNNNN}"
                    helperText="Use {YYYY} for year, {NNNNN} for counter"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button icon={<Save className="h-4 w-4" />} onClick={saveReports}>
                  Save Changes
                </Button>
              </div>
            </Card>
          )}

          {/* Email Settings Tab */}
          {activeTab === 'email' && (
            <Card title="Email Settings" subtitle="Configure SMTP for sending emails">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="SMTP Host"
                  value={email.smtpHost}
                  onChange={(e) => setEmail((p) => ({ ...p, smtpHost: e.target.value }))}
                  placeholder="smtp.gmail.com"
                />
                <Input
                  label="SMTP Port"
                  type="number"
                  value={String(email.smtpPort)}
                  onChange={(e) => setEmail((p) => ({ ...p, smtpPort: Number(e.target.value) }))}
                  placeholder="587"
                />
                <Input
                  label="Username"
                  value={email.smtpUsername}
                  onChange={(e) => setEmail((p) => ({ ...p, smtpUsername: e.target.value }))}
                  placeholder="SMTP username"
                />
                <Input
                  label="Password"
                  type="password"
                  value={email.smtpPassword}
                  onChange={(e) => setEmail((p) => ({ ...p, smtpPassword: e.target.value }))}
                  placeholder="SMTP password"
                />
                <Input
                  label="From Email"
                  type="email"
                  value={email.fromEmail}
                  onChange={(e) => setEmail((p) => ({ ...p, fromEmail: e.target.value }))}
                  placeholder="noreply@lab.com"
                />
                <Input
                  label="From Name"
                  value={email.fromName}
                  onChange={(e) => setEmail((p) => ({ ...p, fromName: e.target.value }))}
                  placeholder="Lab Name"
                />
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" icon={<Send className="h-4 w-4" />} onClick={handleTestEmail}>
                  Send Test Email
                </Button>
                <Button icon={<Save className="h-4 w-4" />} onClick={saveEmail}>
                  Save Changes
                </Button>
              </div>
            </Card>
          )}

          {/* Notification Settings Tab */}
          {activeTab === 'notifications' && (
            <Card title="Notification Settings" subtitle="Configure which events trigger email and alert notifications">
              <div className="space-y-1">
                {([
                  { key: 'sampleReceived' as const, label: 'Sample Received', desc: 'Email to client when sample is received' },
                  { key: 'bookingConfirmed' as const, label: 'Booking Confirmed', desc: 'Email to client when booking is confirmed' },
                  { key: 'resultsEntered' as const, label: 'Results Entered', desc: 'Notify reviewer when results are entered' },
                  { key: 'resultsApproved' as const, label: 'Results Approved', desc: 'Notify approver when results are approved' },
                  { key: 'coaReady' as const, label: 'CoA Ready', desc: 'Email to client when Certificate of Analysis is ready' },
                  { key: 'invoiceGenerated' as const, label: 'Invoice Generated', desc: 'Email to client when invoice is generated' },
                  { key: 'tatBreachDeptHead' as const, label: 'TAT Breach - Dept Head', desc: 'Alert department head on TAT breach' },
                  { key: 'tatBreachLabHead' as const, label: 'TAT Breach - Lab Head', desc: 'Alert lab head on TAT breach' },
                  { key: 'lowStockAlert' as const, label: 'Low Stock', desc: 'Alert purchase team on low stock items' },
                  { key: 'calibrationDueAlert' as const, label: 'Calibration Due', desc: 'Alert QA when instrument calibration is due' },
                ]).map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications[item.key]}
                        onChange={(e) =>
                          setNotifications((p) => ({ ...p, [item.key]: e.target.checked }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                    </label>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <Button icon={<Save className="h-4 w-4" />} onClick={saveNotifications}>
                  Save Changes
                </Button>
              </div>
            </Card>
          )}

          {/* TAT Settings Tab */}
          {activeTab === 'tat' && (
            <Card title="TAT Settings" subtitle="Configure turnaround time defaults and escalation thresholds">
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Default TAT per Priority</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Normal (days)"
                      type="number"
                      value={String(tat.normalDays)}
                      onChange={(e) => setTat((p) => ({ ...p, normalDays: Math.max(1, Number(e.target.value)) }))}
                    />
                    <Input
                      label="Urgent (days)"
                      type="number"
                      value={String(tat.urgentDays)}
                      onChange={(e) => setTat((p) => ({ ...p, urgentDays: Math.max(1, Number(e.target.value)) }))}
                    />
                    <Input
                      label="Express (days)"
                      type="number"
                      value={String(tat.expressDays)}
                      onChange={(e) => setTat((p) => ({ ...p, expressDays: Math.max(1, Number(e.target.value)) }))}
                    />
                  </div>
                </div>

                <hr className="border-gray-200" />

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Escalation Thresholds</h4>
                  <p className="text-xs text-gray-500 mb-3">
                    Set percentage thresholds relative to TAT. Alerts trigger when elapsed time reaches these levels.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Warning at (%)"
                      type="number"
                      value={String(tat.warningPercent)}
                      onChange={(e) => setTat((p) => ({ ...p, warningPercent: Number(e.target.value) }))}
                      helperText="Yellow warning indicator"
                    />
                    <Input
                      label="Alert at (%)"
                      type="number"
                      value={String(tat.alertPercent)}
                      onChange={(e) => setTat((p) => ({ ...p, alertPercent: Number(e.target.value) }))}
                      helperText="Orange alert notification"
                    />
                    <Input
                      label="Breach at (%)"
                      type="number"
                      value={String(tat.breachPercent)}
                      onChange={(e) => setTat((p) => ({ ...p, breachPercent: Number(e.target.value) }))}
                      helperText="Red breach escalation"
                    />
                  </div>

                  {/* Visual threshold bar */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-500 mb-2">Threshold Visualization</p>
                    <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-green-400 transition-all"
                        style={{ width: `${Math.min(tat.warningPercent, 100)}%` }}
                      />
                      <div
                        className="absolute inset-y-0 bg-yellow-400 transition-all"
                        style={{ left: `${Math.min(tat.warningPercent, 100)}%`, width: `${Math.max(0, Math.min(tat.alertPercent - tat.warningPercent, 100 - tat.warningPercent))}%` }}
                      />
                      <div
                        className="absolute inset-y-0 bg-orange-400 transition-all"
                        style={{ left: `${Math.min(tat.alertPercent, 100)}%`, width: `${Math.max(0, Math.min(tat.breachPercent - tat.alertPercent, 100 - tat.alertPercent))}%` }}
                      />
                      <div
                        className="absolute inset-y-0 bg-red-400 transition-all"
                        style={{ left: `${Math.min(tat.breachPercent, 100)}%`, right: 0 }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-500">
                      <span>0%</span>
                      <span>{tat.warningPercent}% Warning</span>
                      <span>{tat.alertPercent}% Alert</span>
                      <span>{tat.breachPercent}% Breach</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button icon={<Save className="h-4 w-4" />} onClick={saveTat}>
                  Save Changes
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
