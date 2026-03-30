import { useState } from 'react';
import {
  TrendingUp,
  BarChart3,
  Users,
  Clock,
  DollarSign,
  TestTube,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/formatters';

// Mock data
const revenueMonths = [
  { month: 'Oct 2025', revenue: 1250000 },
  { month: 'Nov 2025', revenue: 1420000 },
  { month: 'Dec 2025', revenue: 1180000 },
  { month: 'Jan 2026', revenue: 1560000 },
  { month: 'Feb 2026', revenue: 1680000 },
  { month: 'Mar 2026', revenue: 1450000 },
];

const sampleVolumeMonths = [
  { month: 'Oct 2025', count: 320 },
  { month: 'Nov 2025', count: 385 },
  { month: 'Dec 2025', count: 290 },
  { month: 'Jan 2026', count: 410 },
  { month: 'Feb 2026', count: 445 },
  { month: 'Mar 2026', count: 378 },
];

const departmentUtilization = [
  { department: 'HPLC', utilization: 85, capacity: 100 },
  { department: 'Micro Biology', utilization: 72, capacity: 100 },
  { department: 'ICPMS', utilization: 58, capacity: 100 },
  { department: 'Water Testing', utilization: 92, capacity: 100 },
  { department: 'Food Testing', utilization: 68, capacity: 100 },
  { department: 'GC', utilization: 45, capacity: 100 },
];

const topClients = [
  { rank: 1, name: 'PharmaCo Ltd', revenue: 425000, samples: 85, growth: 12 },
  { rank: 2, name: 'AquaPure Inc', revenue: 310000, samples: 62, growth: 8 },
  { rank: 3, name: 'GreenHerbs Pvt', revenue: 240000, samples: 48, growth: -3 },
  { rank: 4, name: 'FoodSafe Corp', revenue: 175000, samples: 35, growth: 15 },
  { rank: 5, name: 'CosmoBeauty', revenue: 140000, samples: 28, growth: 22 },
  { rank: 6, name: 'EnviroTest LLC', revenue: 110000, samples: 22, growth: -5 },
  { rank: 7, name: 'MetalWorks India', revenue: 95000, samples: 19, growth: 10 },
  { rank: 8, name: 'BioPharm Solutions', revenue: 82000, samples: 16, growth: 7 },
  { rank: 9, name: 'NutriFoods', revenue: 75000, samples: 15, growth: 18 },
  { rank: 10, name: 'CleanWater Co', revenue: 68000, samples: 14, growth: -2 },
];

const topTests = [
  { rank: 1, name: 'Heavy Metals (ICPMS)', count: 120, department: 'ICPMS' },
  { rank: 2, name: 'Microbiological Analysis', count: 95, department: 'Micro Biology' },
  { rank: 3, name: 'HPLC Assay', count: 88, department: 'HPLC' },
  { rank: 4, name: 'Water Quality (Full)', count: 75, department: 'Water Testing' },
  { rank: 5, name: 'Dissolution Test', count: 60, department: 'HPLC' },
  { rank: 6, name: 'Stability Testing', count: 45, department: 'HPLC' },
  { rank: 7, name: 'Pesticide Residue', count: 42, department: 'GC' },
  { rank: 8, name: 'Karl Fischer', count: 38, department: 'HPLC' },
  { rank: 9, name: 'Aflatoxin Analysis', count: 35, department: 'Food Testing' },
  { rank: 10, name: 'BOD/COD Analysis', count: 32, department: 'Water Testing' },
];

const tatCompliance = [
  { department: 'HPLC', compliance: 92, onTime: 76, delayed: 7, total: 83 },
  { department: 'Micro Biology', compliance: 85, onTime: 51, delayed: 9, total: 60 },
  { department: 'ICPMS', compliance: 78, onTime: 31, delayed: 9, total: 40 },
  { department: 'Water Testing', compliance: 95, onTime: 86, delayed: 5, total: 91 },
  { department: 'Food Testing', compliance: 88, onTime: 53, delayed: 7, total: 60 },
  { department: 'GC', compliance: 82, onTime: 33, delayed: 7, total: 40 },
];

function BarChartCSS({
  data,
  maxValue,
  color,
  formatValue,
}: {
  data: { label: string; value: number }[];
  maxValue: number;
  color: string;
  formatValue?: (val: number) => string;
}) {
  return (
    <div className="flex items-end gap-2 h-48 pt-4">
      {data.map((item) => {
        const heightPct = (item.value / maxValue) * 100;
        return (
          <div key={item.label} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs font-medium text-gray-700">
              {formatValue ? formatValue(item.value) : item.value}
            </span>
            <div className="w-full flex flex-col justify-end h-36">
              <div
                className={`w-full ${color} rounded-t-md transition-all duration-500`}
                style={{ height: `${heightPct}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 text-center leading-tight">
              {item.label.split(' ')[0]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsPage() {
  const totalRevenue = revenueMonths.reduce((s, m) => s + m.revenue, 0);
  const totalSamples = sampleVolumeMonths.reduce((s, m) => s + m.count, 0);
  const avgUtilization = Math.round(
    departmentUtilization.reduce((s, d) => s + d.utilization, 0) / departmentUtilization.length
  );
  const avgTatCompliance = Math.round(
    tatCompliance.reduce((s, d) => s + d.compliance, 0) / tatCompliance.length
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Visual metrics and performance insights</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<DollarSign className="h-5 w-5" />}
          label="Total Revenue (6M)"
          value={formatCurrency(totalRevenue)}
          color="green"
          trend={{ value: 14, isPositive: true }}
        />
        <StatCard
          icon={<TestTube className="h-5 w-5" />}
          label="Total Samples (6M)"
          value={totalSamples.toLocaleString()}
          color="blue"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          icon={<BarChart3 className="h-5 w-5" />}
          label="Avg Utilization"
          value={`${avgUtilization}%`}
          color="purple"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="TAT Compliance"
          value={`${avgTatCompliance}%`}
          color="orange"
          trend={{ value: 3, isPositive: true }}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue trend */}
        <Card title="Revenue Trend" subtitle="Last 6 months">
          <BarChartCSS
            data={revenueMonths.map((m) => ({ label: m.month, value: m.revenue }))}
            maxValue={Math.max(...revenueMonths.map((m) => m.revenue))}
            color="bg-green-500"
            formatValue={(v) => `${(v / 100000).toFixed(1)}L`}
          />
        </Card>

        {/* Sample volume trend */}
        <Card title="Sample Volume Trend" subtitle="Last 6 months">
          <BarChartCSS
            data={sampleVolumeMonths.map((m) => ({ label: m.month, value: m.count }))}
            maxValue={Math.max(...sampleVolumeMonths.map((m) => m.count))}
            color="bg-blue-500"
          />
        </Card>
      </div>

      {/* Department utilization */}
      <Card title="Department Utilization" subtitle="Current capacity utilization percentage">
        <div className="space-y-4">
          {departmentUtilization.map((dept) => (
            <div key={dept.department}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{dept.department}</span>
                <span className="text-sm font-medium text-gray-900">{dept.utilization}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    dept.utilization >= 90
                      ? 'bg-red-500'
                      : dept.utilization >= 75
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                  }`}
                  style={{ width: `${dept.utilization}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Tables row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 clients */}
        <Card title="Top 10 Clients by Revenue" noPadding>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Client</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Revenue</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Growth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topClients.map((c) => (
                  <tr key={c.rank} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-sm text-gray-500">{c.rank}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-700 text-right">{formatCurrency(c.revenue)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`text-sm font-medium ${c.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {c.growth >= 0 ? '+' : ''}{c.growth}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Top 10 tests */}
        <Card title="Top 10 Tests by Volume" noPadding>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Test</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Count</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Department</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topTests.map((t) => (
                  <tr key={t.rank} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-sm text-gray-500">{t.rank}</td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{t.name}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-700 text-right">{t.count}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant="blue">{t.department}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* TAT compliance */}
      <Card title="TAT Compliance by Department" subtitle="On-time delivery percentage" noPadding>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Department</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">On Time</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Delayed</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Compliance</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tatCompliance.map((row) => (
                <tr key={row.department} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.department}</td>
                  <td className="px-4 py-3 text-sm text-green-700 text-right">{row.onTime}</td>
                  <td className="px-4 py-3 text-sm text-red-700 text-right">{row.delayed}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">{row.total}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            row.compliance >= 90 ? 'bg-green-500' : row.compliance >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${row.compliance}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{row.compliance}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={row.compliance >= 90 ? 'green' : row.compliance >= 80 ? 'yellow' : 'red'}>
                      {row.compliance >= 90 ? 'Excellent' : row.compliance >= 80 ? 'Good' : 'Needs Improvement'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
