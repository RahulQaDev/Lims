import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  PackageCheck,
  BookOpen,
  TestTube,
  ClipboardCheck,
  CheckCircle2,
  FileText,
  Printer,
  Truck,
  Receipt,
  Clock,
} from 'lucide-react';
import { get } from '../../services/api';
import type { Sample, ApiResponse } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate } from '../../utils/formatters';
import { getStatusColor, getStatusBadge } from '../../utils/formatters';

type TimelineStep = {
  key: string;
  label: string;
  icon: React.ReactNode;
  status: 'completed' | 'current' | 'upcoming';
  date?: string;
};

const STATUS_ORDER = [
  'RECEIVED',
  'REGISTERED',
  'BOOKED',
  'IN_TESTING',
  'PENDING_REVIEW',
  'REVIEWED',
  'APPROVED',
  'COA_GENERATED',
  'COA_PRINTED',
  'DISPATCHED',
  'INVOICED',
];

const STATUS_ICONS: Record<string, React.ReactNode> = {
  RECEIVED: <PackageCheck className="h-5 w-5" />,
  REGISTERED: <PackageCheck className="h-5 w-5" />,
  BOOKED: <BookOpen className="h-5 w-5" />,
  IN_TESTING: <TestTube className="h-5 w-5" />,
  PENDING_REVIEW: <ClipboardCheck className="h-5 w-5" />,
  REVIEWED: <ClipboardCheck className="h-5 w-5" />,
  APPROVED: <CheckCircle2 className="h-5 w-5" />,
  COA_GENERATED: <FileText className="h-5 w-5" />,
  COA_PRINTED: <Printer className="h-5 w-5" />,
  DISPATCHED: <Truck className="h-5 w-5" />,
  INVOICED: <Receipt className="h-5 w-5" />,
};

function buildTimeline(sample: Sample): TimelineStep[] {
  const currentIndex = STATUS_ORDER.indexOf(sample.status);

  // Simplified timeline with key milestones
  const milestones = [
    { key: 'RECEIVED', label: 'Received' },
    { key: 'BOOKED', label: 'Booked' },
    { key: 'IN_TESTING', label: 'In Testing' },
    { key: 'PENDING_REVIEW', label: 'Under Review' },
    { key: 'APPROVED', label: 'Approved' },
    { key: 'COA_GENERATED', label: 'CoA Generated' },
    { key: 'DISPATCHED', label: 'Dispatched' },
  ];

  return milestones.map((m) => {
    const mIndex = STATUS_ORDER.indexOf(m.key);
    let status: TimelineStep['status'] = 'upcoming';
    if (mIndex < currentIndex) status = 'completed';
    else if (mIndex === currentIndex) status = 'current';
    // Special: if sample status matches or is past this milestone
    if (sample.status === m.key) status = 'current';

    return {
      key: m.key,
      label: m.label,
      icon: STATUS_ICONS[m.key] || <Clock className="h-5 w-5" />,
      status,
      date: status === 'completed' || status === 'current' ? sample.updatedAt : undefined,
    };
  });
}

export default function TrackingPage() {
  const [searchCode, setSearchCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['sample-tracking', searchQuery],
    queryFn: () => get<ApiResponse<Sample>>(`/samples/track/${searchQuery}`),
    enabled: !!searchQuery,
  });

  const sample = data?.data ?? null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchCode.trim()) {
      setSearchQuery(searchCode.trim());
    }
  };

  const timeline = sample ? buildTimeline(sample) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sample Tracking</h1>
        <p className="text-sm text-gray-500 mt-1">Track the progress of a sample through the testing process</p>
      </div>

      {/* Search */}
      <Card>
        <form onSubmit={handleSearch} className="flex items-end gap-4">
          <div className="flex-1 max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sample Code or Report Number
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="e.g., SMP-2026-00142"
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>
          </div>
          <Button type="submit" icon={<Search className="h-4 w-4" />}>
            Track
          </Button>
        </form>
      </Card>

      {/* Loading */}
      {isLoading && <Loader text="Searching for sample..." />}

      {/* Error / Not found */}
      {isError && searchQuery && (
        <Card>
          <EmptyState
            title="Sample not found"
            description={`No sample found with code "${searchQuery}". Please check the code and try again.`}
            icon={<Search className="h-8 w-8 text-gray-400" />}
          />
        </Card>
      )}

      {/* Sample Details & Timeline */}
      {sample && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sample Info */}
          <Card title="Sample Details">
            <div className="space-y-4">
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wider">Sample Code</span>
                <p className="text-lg font-bold text-blue-600 font-mono">{sample.sampleCode}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Client</span>
                  <p className="text-sm font-medium text-gray-900">{sample.clientName}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Priority</span>
                  <p className="mt-0.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sample.priority)}`}>
                      {sample.priority}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Name</span>
                  <p className="text-sm text-gray-900">{sample.name}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Current Status</span>
                  <p className="mt-0.5">
                    <Badge variant={sample.status === 'REJECTED' ? 'red' : sample.status === 'APPROVED' ? 'green' : 'blue'}>
                      {getStatusBadge(sample.status)}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Received</span>
                  <p className="text-sm text-gray-900">{formatDate(sample.receivedDate)}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Due Date</span>
                  <p className="text-sm text-gray-900">{formatDate(sample.dueDate)}</p>
                </div>
              </div>
              {sample.batchNumber && (
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Batch Number</span>
                  <p className="text-sm text-gray-900">{sample.batchNumber}</p>
                </div>
              )}
              {sample.remarks && (
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Remarks</span>
                  <p className="text-sm text-gray-600">{sample.remarks}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Timeline */}
          <Card title="Sample Journey" className="lg:col-span-2">
            <div className="relative">
              {timeline.map((step, index) => {
                const isLast = index === timeline.length - 1;

                return (
                  <div key={step.key} className="flex gap-4 pb-8 last:pb-0">
                    {/* Timeline line and dot */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          step.status === 'completed'
                            ? 'bg-green-100 text-green-600'
                            : step.status === 'current'
                              ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                              : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {step.icon}
                      </div>
                      {!isLast && (
                        <div
                          className={`w-0.5 flex-1 mt-1 ${
                            step.status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                          }`}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="pt-2 pb-2">
                      <h4
                        className={`text-sm font-semibold ${
                          step.status === 'current'
                            ? 'text-blue-600'
                            : step.status === 'completed'
                              ? 'text-gray-900'
                              : 'text-gray-400'
                        }`}
                      >
                        {step.label}
                        {step.status === 'current' && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            Current
                          </span>
                        )}
                      </h4>
                      {step.date && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDate(step.date, { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Rejected / On Hold special state */}
              {(sample.status === 'REJECTED' || sample.status === 'ON_HOLD') && (
                <div className="mt-4 p-4 rounded-lg border border-red-200 bg-red-50">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${sample.status === 'REJECTED' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                    <span className="text-sm font-medium text-red-800">
                      Sample {sample.status === 'REJECTED' ? 'Rejected' : 'On Hold'}
                    </span>
                  </div>
                  {sample.remarks && (
                    <p className="text-sm text-red-600 mt-1">{sample.remarks}</p>
                  )}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Initial state - no search yet */}
      {!searchQuery && !isLoading && (
        <Card>
          <EmptyState
            title="Track a Sample"
            description="Enter a sample code or report number above to view the sample's journey through the testing process."
            icon={<Search className="h-8 w-8 text-gray-400" />}
          />
        </Card>
      )}
    </div>
  );
}
