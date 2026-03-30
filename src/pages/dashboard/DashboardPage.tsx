import { useNavigate } from 'react-router-dom';
import {
  FlaskConical,
  BookOpen,
  TestTube,
  ClipboardCheck,
  FileText,
  AlertTriangle,
  PackagePlus,
  ArrowRight,
} from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../utils/formatters';

// Mock data for demonstration
const stats = [
  { icon: <FlaskConical className="h-5 w-5" />, label: 'Total Samples Today', value: 42, color: 'blue', trend: { value: 12, isPositive: true } },
  { icon: <BookOpen className="h-5 w-5" />, label: 'Pending Booking', value: 18, color: 'yellow', trend: { value: 5, isPositive: false } },
  { icon: <TestTube className="h-5 w-5" />, label: 'In Testing', value: 67, color: 'purple' },
  { icon: <ClipboardCheck className="h-5 w-5" />, label: 'Pending Review', value: 23, color: 'orange' },
  { icon: <FileText className="h-5 w-5" />, label: 'CoA Ready', value: 15, color: 'green', trend: { value: 8, isPositive: true } },
  { icon: <AlertTriangle className="h-5 w-5" />, label: 'Overdue Samples', value: 4, color: 'red' },
];

const recentSamples = [
  { id: '1', code: 'SMP-2026-00142', client: 'PharmaCo Ltd', name: 'Paracetamol Tablets', status: 'IN_TESTING', priority: 'NORMAL', date: '2026-03-24' },
  { id: '2', code: 'SMP-2026-00141', client: 'AquaPure Inc', name: 'Drinking Water', status: 'PENDING_REVIEW', priority: 'URGENT', date: '2026-03-24' },
  { id: '3', code: 'SMP-2026-00140', client: 'GreenHerbs Pvt', name: 'Ashwagandha Powder', status: 'BOOKED', priority: 'NORMAL', date: '2026-03-24' },
  { id: '4', code: 'SMP-2026-00139', client: 'FoodSafe Corp', name: 'Wheat Flour', status: 'RECEIVED', priority: 'CRITICAL', date: '2026-03-23' },
  { id: '5', code: 'SMP-2026-00138', client: 'CosmoBeauty', name: 'Face Cream Sample', status: 'APPROVED', priority: 'NORMAL', date: '2026-03-23' },
  { id: '6', code: 'SMP-2026-00137', client: 'PharmaCo Ltd', name: 'Ibuprofen Syrup', status: 'COA_GENERATED', priority: 'URGENT', date: '2026-03-23' },
  { id: '7', code: 'SMP-2026-00136', client: 'EnviroTest LLC', name: 'Soil Sample', status: 'IN_TESTING', priority: 'NORMAL', date: '2026-03-22' },
  { id: '8', code: 'SMP-2026-00135', client: 'AquaPure Inc', name: 'Wastewater Sample', status: 'REVIEWED', priority: 'NORMAL', date: '2026-03-22' },
  { id: '9', code: 'SMP-2026-00134', client: 'NutriFoods', name: 'Protein Bar', status: 'IN_TESTING', priority: 'NORMAL', date: '2026-03-22' },
  { id: '10', code: 'SMP-2026-00133', client: 'GreenHerbs Pvt', name: 'Turmeric Extract', status: 'DISPATCHED', priority: 'NORMAL', date: '2026-03-21' },
];

const statusBadge: Record<string, { label: string; variant: 'blue' | 'green' | 'red' | 'yellow' | 'orange' | 'purple' | 'gray' | 'indigo' | 'cyan' | 'teal' | 'emerald' | 'lime' }> = {
  RECEIVED: { label: 'Received', variant: 'blue' },
  BOOKED: { label: 'Booked', variant: 'purple' },
  IN_TESTING: { label: 'In Testing', variant: 'yellow' },
  PENDING_REVIEW: { label: 'Pending Review', variant: 'orange' },
  REVIEWED: { label: 'Reviewed', variant: 'cyan' },
  APPROVED: { label: 'Approved', variant: 'green' },
  COA_GENERATED: { label: 'CoA Generated', variant: 'teal' },
  DISPATCHED: { label: 'Dispatched', variant: 'lime' },
};

const priorityBadge: Record<string, { label: string; variant: 'blue' | 'orange' | 'red' }> = {
  NORMAL: { label: 'Normal', variant: 'blue' },
  URGENT: { label: 'Urgent', variant: 'orange' },
  CRITICAL: { label: 'Critical', variant: 'red' },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName || 'User'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Here is what is happening in the lab today
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          icon={<PackagePlus className="h-4 w-4" />}
          onClick={() => navigate('/samples/reception')}
        >
          New Reception
        </Button>
        <Button
          variant="outline"
          icon={<BookOpen className="h-4 w-4" />}
          onClick={() => navigate('/booking')}
        >
          New Booking
        </Button>
        <Button
          variant="outline"
          icon={<FileText className="h-4 w-4" />}
          onClick={() => navigate('/coa')}
        >
          Generate CoA
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent samples table */}
        <Card
          title="Recent Samples"
          subtitle="Last 10 samples received"
          className="xl:col-span-2"
          noPadding
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Sample Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Client
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {recentSamples.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-blue-600">
                      {s.code}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {s.client}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {s.name}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusBadge[s.status]?.variant || 'gray'}>
                        {statusBadge[s.status]?.label || s.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={priorityBadge[s.priority]?.variant || 'blue'}>
                        {priorityBadge[s.priority]?.label || s.priority}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(s.date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Right column */}
        <div className="space-y-6">
          {/* Department workload placeholder */}
          <Card title="Department Workload">
            <div className="space-y-3">
              {[
                { dept: 'HPLC', count: 18, max: 30 },
                { dept: 'Micro Biology', count: 12, max: 30 },
                { dept: 'ICPMS', count: 8, max: 30 },
                { dept: 'Water', count: 15, max: 30 },
                { dept: 'Food', count: 10, max: 30 },
                { dept: 'GC', count: 6, max: 30 },
              ].map((d) => (
                <div key={d.dept}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">{d.dept}</span>
                    <span className="text-xs text-gray-500">{d.count} tests</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${(d.count / d.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Sample status distribution placeholder */}
          <Card title="Status Distribution">
            <div className="space-y-2">
              {[
                { status: 'Received', count: 8, color: 'bg-blue-500' },
                { status: 'In Testing', count: 67, color: 'bg-yellow-500' },
                { status: 'Pending Review', count: 23, color: 'bg-orange-500' },
                { status: 'Approved', count: 31, color: 'bg-green-500' },
                { status: 'Dispatched', count: 14, color: 'bg-lime-500' },
              ].map((item) => (
                <div key={item.status} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-sm text-gray-700 flex-1">
                    {item.status}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
            <button className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium mt-4">
              View All Reports <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
