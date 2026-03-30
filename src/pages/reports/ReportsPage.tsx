import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileBarChart,
  Clock,
  Building2,
  DollarSign,
  TestTube,
  AlertTriangle,
  ArrowLeft,
  Download,
  Calendar,
} from 'lucide-react';
import { get } from '../../services/api';
import type { PaginatedResponse, Sample, Department } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate, formatCurrency } from '../../utils/formatters';

type ReportType =
  | 'sample-summary'
  | 'tat-analysis'
  | 'department-workload'
  | 'client-revenue'
  | 'test-revenue'
  | 'pending-aging';

interface ReportCard {
  id: ReportType;
  title: string;
  description: string;
  icon: typeof FileBarChart;
  color: string;
  iconBg: string;
}

const reportCards: ReportCard[] = [
  {
    id: 'sample-summary',
    title: 'Sample Summary Report',
    description: 'Daily, weekly, and monthly sample counts by department',
    icon: FileBarChart,
    color: 'text-blue-600',
    iconBg: 'bg-blue-50',
  },
  {
    id: 'tat-analysis',
    title: 'TAT Analysis',
    description: 'Turnaround time analysis across departments and tests',
    icon: Clock,
    color: 'text-purple-600',
    iconBg: 'bg-purple-50',
  },
  {
    id: 'department-workload',
    title: 'Department Workload',
    description: 'Samples per department with visual workload distribution',
    icon: Building2,
    color: 'text-orange-600',
    iconBg: 'bg-orange-50',
  },
  {
    id: 'client-revenue',
    title: 'Client Revenue Report',
    description: 'Revenue breakdown by client for the selected period',
    icon: DollarSign,
    color: 'text-green-600',
    iconBg: 'bg-green-50',
  },
  {
    id: 'test-revenue',
    title: 'Test-wise Revenue',
    description: 'Revenue breakdown by test type and department',
    icon: TestTube,
    color: 'text-teal-600',
    iconBg: 'bg-teal-50',
  },
  {
    id: 'pending-aging',
    title: 'Pending Samples Aging',
    description: 'Analysis of how long samples have been in pending state',
    icon: AlertTriangle,
    color: 'text-red-600',
    iconBg: 'bg-red-50',
  },
];

// Mock data for reports
const mockSampleSummary = [
  { department: 'HPLC', daily: 12, weekly: 65, monthly: 248 },
  { department: 'Micro Biology', daily: 8, weekly: 42, monthly: 178 },
  { department: 'ICPMS', daily: 5, weekly: 28, monthly: 112 },
  { department: 'Water Testing', daily: 15, weekly: 78, monthly: 310 },
  { department: 'Food Testing', daily: 10, weekly: 55, monthly: 220 },
  { department: 'GC', daily: 6, weekly: 35, monthly: 140 },
];

const mockTatAnalysis = [
  { department: 'HPLC', avgTat: 48, targetTat: 72, compliance: 92 },
  { department: 'Micro Biology', avgTat: 96, targetTat: 120, compliance: 85 },
  { department: 'ICPMS', avgTat: 36, targetTat: 48, compliance: 78 },
  { department: 'Water Testing', avgTat: 24, targetTat: 48, compliance: 95 },
  { department: 'Food Testing', avgTat: 72, targetTat: 96, compliance: 88 },
  { department: 'GC', avgTat: 40, targetTat: 48, compliance: 82 },
];

const mockDeptWorkload = [
  { department: 'HPLC', total: 65, inTesting: 28, pending: 12, completed: 25 },
  { department: 'Micro Biology', total: 42, inTesting: 18, pending: 8, completed: 16 },
  { department: 'ICPMS', total: 28, inTesting: 10, pending: 5, completed: 13 },
  { department: 'Water Testing', total: 78, inTesting: 35, pending: 15, completed: 28 },
  { department: 'Food Testing', total: 55, inTesting: 22, pending: 10, completed: 23 },
  { department: 'GC', total: 35, inTesting: 14, pending: 7, completed: 14 },
];

const mockClientRevenue = [
  { client: 'PharmaCo Ltd', samples: 85, revenue: 425000, outstanding: 52000 },
  { client: 'AquaPure Inc', samples: 62, revenue: 310000, outstanding: 0 },
  { client: 'GreenHerbs Pvt', samples: 48, revenue: 240000, outstanding: 18000 },
  { client: 'FoodSafe Corp', samples: 35, revenue: 175000, outstanding: 35000 },
  { client: 'CosmoBeauty', samples: 28, revenue: 140000, outstanding: 0 },
  { client: 'EnviroTest LLC', samples: 22, revenue: 110000, outstanding: 12000 },
];

const mockTestRevenue = [
  { test: 'Heavy Metals (ICPMS)', count: 120, revenue: 360000, avgRate: 3000 },
  { test: 'Microbiological Analysis', count: 95, revenue: 285000, avgRate: 3000 },
  { test: 'HPLC Assay', count: 88, revenue: 264000, avgRate: 3000 },
  { test: 'Water Quality (Full)', count: 75, revenue: 187500, avgRate: 2500 },
  { test: 'Dissolution Test', count: 60, revenue: 150000, avgRate: 2500 },
  { test: 'Stability Testing', count: 45, revenue: 135000, avgRate: 3000 },
];

const mockPendingAging = [
  { range: '0 - 24 hours', count: 18, percentage: 35 },
  { range: '24 - 48 hours', count: 12, percentage: 24 },
  { range: '48 - 72 hours', count: 8, percentage: 16 },
  { range: '3 - 5 days', count: 7, percentage: 14 },
  { range: '5 - 7 days', count: 4, percentage: 8 },
  { range: '> 7 days', count: 2, percentage: 4 },
];

function CSSBarChart({ data, maxValue, color }: { data: { label: string; value: number }[]; maxValue: number; color: string }) {
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.label}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-700">{item.label}</span>
            <span className="text-sm font-medium text-gray-900">{item.value}</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${color} rounded-full transition-all duration-500`}
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const renderReportContent = () => {
    switch (activeReport) {
      case 'sample-summary':
        return (
          <Card title="Sample Summary Report" subtitle="Sample counts by department">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Department</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Daily</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Weekly</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Monthly</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Monthly Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mockSampleSummary.map((row) => (
                    <tr key={row.department} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.department}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-right">{row.daily}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-right">{row.weekly}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">{row.monthly}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${(row.monthly / 310) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-8 text-right">{Math.round((row.monthly / 310) * 100)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">Total</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                      {mockSampleSummary.reduce((s, r) => s + r.daily, 0)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                      {mockSampleSummary.reduce((s, r) => s + r.weekly, 0)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                      {mockSampleSummary.reduce((s, r) => s + r.monthly, 0)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        );

      case 'tat-analysis':
        return (
          <Card title="TAT Analysis" subtitle="Turnaround time compliance by department">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Department</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Avg TAT (hrs)</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Target TAT (hrs)</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Compliance %</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mockTatAnalysis.map((row) => (
                    <tr key={row.department} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.department}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-right">{row.avgTat}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-right">{row.targetTat}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                row.compliance >= 90 ? 'bg-green-500' : row.compliance >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${row.compliance}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-10 text-right">{row.compliance}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={row.compliance >= 90 ? 'green' : row.compliance >= 80 ? 'yellow' : 'red'}>
                          {row.compliance >= 90 ? 'On Track' : row.compliance >= 80 ? 'At Risk' : 'Critical'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        );

      case 'department-workload':
        return (
          <div className="space-y-6">
            <Card title="Department Workload" subtitle="Current sample distribution across departments">
              <CSSBarChart
                data={mockDeptWorkload.map((d) => ({ label: d.department, value: d.total }))}
                maxValue={Math.max(...mockDeptWorkload.map((d) => d.total))}
                color="bg-blue-500"
              />
            </Card>
            <Card title="Workload Breakdown" noPadding>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Department</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">In Testing</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Pending</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Completed</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Distribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {mockDeptWorkload.map((row) => (
                      <tr key={row.department} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.department}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">{row.total}</td>
                        <td className="px-4 py-3 text-sm text-yellow-700 text-right">{row.inTesting}</td>
                        <td className="px-4 py-3 text-sm text-orange-700 text-right">{row.pending}</td>
                        <td className="px-4 py-3 text-sm text-green-700 text-right">{row.completed}</td>
                        <td className="px-4 py-3">
                          <div className="flex h-3 rounded-full overflow-hidden bg-gray-100 w-40">
                            <div className="bg-yellow-400" style={{ width: `${(row.inTesting / row.total) * 100}%` }} />
                            <div className="bg-orange-400" style={{ width: `${(row.pending / row.total) * 100}%` }} />
                            <div className="bg-green-400" style={{ width: `${(row.completed / row.total) * 100}%` }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        );

      case 'client-revenue':
        return (
          <Card title="Client Revenue Report" subtitle="Revenue breakdown by client" noPadding>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Client</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Samples</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Revenue</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Outstanding</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mockClientRevenue.map((row) => {
                    const totalRevenue = mockClientRevenue.reduce((s, r) => s + r.revenue, 0);
                    return (
                      <tr key={row.client} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.client}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 text-right">{row.samples}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">{formatCurrency(row.revenue)}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className={row.outstanding > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                            {formatCurrency(row.outstanding)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-24">
                              <div
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${(row.revenue / totalRevenue) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 w-10 text-right">
                              {Math.round((row.revenue / totalRevenue) * 100)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">Total</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                      {mockClientRevenue.reduce((s, r) => s + r.samples, 0)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                      {formatCurrency(mockClientRevenue.reduce((s, r) => s + r.revenue, 0))}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-red-600 text-right">
                      {formatCurrency(mockClientRevenue.reduce((s, r) => s + r.outstanding, 0))}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        );

      case 'test-revenue':
        return (
          <Card title="Test-wise Revenue" subtitle="Revenue by test type" noPadding>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Test Name</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Count</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Revenue</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Avg Rate</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mockTestRevenue.map((row) => {
                    const totalRevenue = mockTestRevenue.reduce((s, r) => s + r.revenue, 0);
                    return (
                      <tr key={row.test} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.test}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 text-right">{row.count}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">{formatCurrency(row.revenue)}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 text-right">{formatCurrency(row.avgRate)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-24">
                              <div
                                className="h-full bg-teal-500 rounded-full"
                                style={{ width: `${(row.revenue / totalRevenue) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 w-10 text-right">
                              {Math.round((row.revenue / totalRevenue) * 100)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">Total</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                      {mockTestRevenue.reduce((s, r) => s + r.count, 0)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                      {formatCurrency(mockTestRevenue.reduce((s, r) => s + r.revenue, 0))}
                    </td>
                    <td />
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        );

      case 'pending-aging':
        return (
          <Card title="Pending Samples Aging" subtitle="How long samples have been in pending state">
            <div className="space-y-4 mb-6">
              {mockPendingAging.map((row) => (
                <div key={row.range}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">{row.range}</span>
                    <span className="text-sm font-medium text-gray-900">{row.count} samples ({row.percentage}%)</span>
                  </div>
                  <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        row.range.includes('>') || row.range.includes('5 - 7')
                          ? 'bg-red-500'
                          : row.range.includes('3 - 5')
                            ? 'bg-orange-500'
                            : row.range.includes('48')
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                      }`}
                      style={{ width: `${row.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Age Range</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Count</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Percentage</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mockPendingAging.map((row) => (
                    <tr key={row.range} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.range}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-right">{row.count}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-right">{row.percentage}%</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            row.range.includes('>') || row.range.includes('5 - 7')
                              ? 'red'
                              : row.range.includes('3 - 5')
                                ? 'orange'
                                : row.range.includes('48')
                                  ? 'yellow'
                                  : 'green'
                          }
                        >
                          {row.range.includes('>') || row.range.includes('5 - 7')
                            ? 'Critical'
                            : row.range.includes('3 - 5')
                              ? 'Warning'
                              : row.range.includes('48')
                                ? 'Monitor'
                                : 'Normal'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {activeReport && (
            <button
              onClick={() => setActiveReport(null)}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-sm text-gray-500 mt-1">
              {activeReport
                ? reportCards.find((r) => r.id === activeReport)?.title
                : 'Generate and view MIS reports'}
            </p>
          </div>
        </div>
        {activeReport && (
          <Button variant="outline" icon={<Download className="h-4 w-4" />}>
            Export
          </Button>
        )}
      </div>

      {/* Date range filter */}
      <Card>
        <div className="flex items-center gap-4 flex-wrap">
          <Calendar className="h-5 w-5 text-gray-400" />
          <Input
            label="From Date"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-44"
          />
          <Input
            label="To Date"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-44"
          />
          <div className="pt-6">
            <Button variant="outline" size="sm">Apply Filter</Button>
          </div>
        </div>
      </Card>

      {/* Report cards grid or active report */}
      {activeReport ? (
        renderReportContent()
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportCards.map((report) => {
            const Icon = report.icon;
            return (
              <div
                key={report.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
                onClick={() => setActiveReport(report.id)}
              >
                <div className={`w-12 h-12 rounded-lg ${report.iconBg} flex items-center justify-center mb-4`}>
                  <Icon className={`h-6 w-6 ${report.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{report.title}</h3>
                <p className="text-sm text-gray-500 mb-4">{report.description}</p>
                <Button variant="outline" size="sm" className="group-hover:bg-blue-50 group-hover:border-blue-200 group-hover:text-blue-600">
                  View Report
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
