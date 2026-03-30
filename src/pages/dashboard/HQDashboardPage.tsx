import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight, ArrowLeftRight, TrendingUp, Building2, Package, IndianRupee, Clock } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import StatCard from '../../components/ui/StatCard';
import { useLocationStore } from '../../stores/locationStore';

interface LocationStats {
  id: number; name: string; code: string; isHQ: boolean;
  samplesToday: number; pendingTests: number; revenue: number; tatCompliance: number; analysts: number;
}

const mockLocations: LocationStats[] = [
  { id: 1, name: 'Delhi', code: 'DEL', isHQ: true, samplesToday: 42, pendingTests: 67, revenue: 1850000, tatCompliance: 94, analysts: 85 },
  { id: 2, name: 'Alcatec', code: 'ALC', isHQ: false, samplesToday: 18, pendingTests: 31, revenue: 720000, tatCompliance: 91, analysts: 28 },
  { id: 3, name: 'Manesar', code: 'MAN', isHQ: false, samplesToday: 25, pendingTests: 44, revenue: 980000, tatCompliance: 88, analysts: 35 },
  { id: 4, name: 'Bangalore', code: 'BLR', isHQ: false, samplesToday: 31, pendingTests: 52, revenue: 1120000, tatCompliance: 96, analysts: 42 },
  { id: 5, name: 'Baddi', code: 'BDD', isHQ: false, samplesToday: 15, pendingTests: 22, revenue: 540000, tatCompliance: 85, analysts: 20 },
];

const mockTransfers = [
  { id: 1, sampleCode: 'AUR-2603-0045', from: 'Delhi', to: 'Bangalore', status: 'IN_TRANSIT', date: '2026-03-24' },
  { id: 2, sampleCode: 'AUR-2603-0038', from: 'Manesar', to: 'Delhi', status: 'RECEIVED', date: '2026-03-23' },
  { id: 3, sampleCode: 'AUR-2603-0051', from: 'Baddi', to: 'Delhi', status: 'REQUESTED', date: '2026-03-25' },
  { id: 4, sampleCode: 'AUR-2603-0029', from: 'Delhi', to: 'Alcatec', status: 'APPROVED', date: '2026-03-24' },
  { id: 5, sampleCode: 'AUR-2603-0033', from: 'Bangalore', to: 'Manesar', status: 'RECEIVED', date: '2026-03-22' },
];

const statusColors: Record<string, 'blue' | 'green' | 'yellow' | 'red' | 'purple'> = {
  REQUESTED: 'yellow', APPROVED: 'blue', IN_TRANSIT: 'purple', RECEIVED: 'green', REJECTED: 'red',
};

export default function HQDashboardPage() {
  const navigate = useNavigate();
  const { setCurrentLocation } = useLocationStore();
  const [selectedPeriod] = useState('today');

  const totalSamples = mockLocations.reduce((s, l) => s + l.samplesToday, 0);
  const totalRevenue = mockLocations.reduce((s, l) => s + l.revenue, 0);
  const avgTAT = Math.round(mockLocations.reduce((s, l) => s + l.tatCompliance, 0) / mockLocations.length);
  const totalPending = mockLocations.reduce((s, l) => s + l.pendingTests, 0);
  const maxSamples = Math.max(...mockLocations.map(l => l.samplesToday));

  const getPerformanceColor = (tat: number) => tat >= 93 ? 'border-green-400 bg-green-50' : tat >= 88 ? 'border-yellow-400 bg-yellow-50' : 'border-red-400 bg-red-50';
  const getPerformanceDot = (tat: number) => tat >= 93 ? 'bg-green-500' : tat >= 88 ? 'bg-yellow-500' : 'bg-red-500';

  const handleLocationClick = (loc: LocationStats) => {
    setCurrentLocation(loc.id, loc.name);
    navigate('/dashboard');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HQ Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Multi-location overview across all 5 units</p>
        </div>
        <div className="flex gap-2">
          {['today', 'week', 'month'].map(p => (
            <button key={p} className={`px-3 py-1.5 text-xs font-medium rounded-lg ${selectedPeriod === p ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Samples Today" value={totalSamples} icon={<Package className="h-5 w-5" />} trend={{ value: 8, isPositive: true }} />
        <StatCard label="Total Pending Tests" value={totalPending} icon={<Clock className="h-5 w-5" />} trend={{ value: 3, isPositive: false }} />
        <StatCard label="Overall TAT Compliance" value={`${avgTAT}%`} icon={<TrendingUp className="h-5 w-5" />} trend={{ value: 2, isPositive: true }} />
        <StatCard label="Revenue This Month" value={`₹${(totalRevenue/100000).toFixed(1)}L`} icon={<IndianRupee className="h-5 w-5" />} trend={{ value: 12, isPositive: true }} />
      </div>

      {/* Location Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Location Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {mockLocations.map(loc => (
            <div
              key={loc.id}
              onClick={() => handleLocationClick(loc)}
              className={`rounded-xl border-2 p-4 cursor-pointer hover:shadow-lg transition-all ${getPerformanceColor(loc.tatCompliance)}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-600" />
                  <span className="font-semibold text-gray-900">{loc.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  {loc.isHQ && <Badge variant="blue">HQ</Badge>}
                  <div className={`w-2.5 h-2.5 rounded-full ${getPerformanceDot(loc.tatCompliance)}`} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Samples Today</span>
                  <span className="font-semibold">{loc.samplesToday}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Pending Tests</span>
                  <span className="font-semibold text-orange-600">{loc.pendingTests}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Revenue</span>
                  <span className="font-semibold">₹{(loc.revenue/100000).toFixed(1)}L</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">TAT Compliance</span>
                  <span className={`font-semibold ${loc.tatCompliance >= 93 ? 'text-green-600' : loc.tatCompliance >= 88 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {loc.tatCompliance}%
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-center text-xs text-blue-600 font-medium">
                View Details <ArrowRight className="h-3 w-3 ml-1" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sample Volume Comparison */}
        <Card title="Sample Volume by Location" subtitle="Today's intake comparison">
          <div className="space-y-3 mt-4">
            {mockLocations.map(loc => (
              <div key={loc.id} className="flex items-center gap-3">
                <span className="w-20 text-sm font-medium text-gray-700">{loc.code}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-end pr-2"
                    style={{ width: `${(loc.samplesToday / maxSamples) * 100}%` }}
                  >
                    <span className="text-xs font-bold text-white">{loc.samplesToday}</span>
                  </div>
                </div>
                <span className="w-12 text-right text-sm text-gray-500">{loc.analysts} staff</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Transfer Activity */}
        <Card title="Inter-Location Transfers" subtitle="Recent sample movements" actions={
          <Button size="sm" variant="outline" onClick={() => navigate('/samples/transfers')}>
            <ArrowLeftRight className="h-4 w-4 mr-1" /> View All
          </Button>
        }>
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-yellow-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-yellow-700">3</p>
                <p className="text-xs text-yellow-600">Pending</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-purple-700">1</p>
                <p className="text-xs text-purple-600">In Transit</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-700">8</p>
                <p className="text-xs text-green-600">Completed</p>
              </div>
            </div>
            <div className="divide-y">
              {mockTransfers.map(t => (
                <div key={t.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3">
                    <code className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{t.sampleCode}</code>
                    <span className="text-sm text-gray-600">{t.from} → {t.to}</span>
                  </div>
                  <Badge variant={statusColors[t.status] || 'gray'}>{t.status.replace('_', ' ')}</Badge>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Location Analysts */}
      <Card title="Workforce Distribution" subtitle="Active analysts across locations">
        <div className="grid grid-cols-5 gap-4 mt-4">
          {mockLocations.map(loc => (
            <div key={loc.id} className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-2">
                <Building2 className="h-7 w-7 text-blue-600" />
              </div>
              <p className="font-semibold text-gray-900">{loc.analysts}</p>
              <p className="text-xs text-gray-500">{loc.name}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
