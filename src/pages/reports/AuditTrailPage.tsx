import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Shield,
  Download,
  ChevronDown,
  ChevronRight,
  Search,
} from 'lucide-react';
import { get } from '../../services/api';
import type { AuditLog, PaginatedResponse } from '../../types';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Pagination from '../../components/ui/Pagination';
import SearchInput from '../../components/ui/SearchInput';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate } from '../../utils/formatters';

type ActionType = 'all' | 'create' | 'update' | 'delete' | 'login' | 'approve' | 'reject';
type EntityType = 'all' | 'sample' | 'booking' | 'result' | 'invoice' | 'user' | 'client' | 'test' | 'coa';

const ACTION_OPTIONS = [
  { value: 'all', label: 'All Actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'login', label: 'Login' },
  { value: 'approve', label: 'Approve' },
  { value: 'reject', label: 'Reject' },
];

const ENTITY_OPTIONS = [
  { value: 'all', label: 'All Entities' },
  { value: 'sample', label: 'Sample' },
  { value: 'booking', label: 'Booking' },
  { value: 'result', label: 'Result' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'user', label: 'User' },
  { value: 'client', label: 'Client' },
  { value: 'test', label: 'Test' },
  { value: 'coa', label: 'CoA' },
];

const actionBadgeVariant: Record<string, 'blue' | 'green' | 'red' | 'yellow' | 'orange' | 'purple' | 'gray' | 'cyan' | 'teal'> = {
  create: 'green',
  update: 'blue',
  delete: 'red',
  login: 'purple',
  approve: 'teal',
  reject: 'orange',
  logout: 'gray',
  view: 'cyan',
};

// Mock data for audit trail
const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    userId: 'u1',
    userName: 'Dr. Rajesh Kumar',
    action: 'approve',
    entity: 'Result',
    entityId: 'RES-2026-0142',
    oldValues: { status: 'PENDING_REVIEW' },
    newValues: { status: 'APPROVED', approvedAt: '2026-03-24T10:30:00' },
    ipAddress: '192.168.1.105',
    timestamp: '2026-03-24T10:30:00',
  },
  {
    id: '2',
    userId: 'u2',
    userName: 'Priya Sharma',
    action: 'update',
    entity: 'Sample',
    entityId: 'SMP-2026-00142',
    oldValues: { status: 'RECEIVED', priority: 'NORMAL' },
    newValues: { status: 'BOOKED', priority: 'URGENT' },
    ipAddress: '192.168.1.110',
    timestamp: '2026-03-24T09:45:00',
  },
  {
    id: '3',
    userId: 'u3',
    userName: 'Amit Patel',
    action: 'create',
    entity: 'Sample',
    entityId: 'SMP-2026-00143',
    newValues: { name: 'Drinking Water', client: 'AquaPure Inc', status: 'RECEIVED' },
    ipAddress: '192.168.1.115',
    timestamp: '2026-03-24T09:30:00',
  },
  {
    id: '4',
    userId: 'u4',
    userName: 'Neha Singh',
    action: 'login',
    entity: 'User',
    entityId: 'u4',
    newValues: { loginTime: '2026-03-24T09:00:00', browser: 'Chrome 120' },
    ipAddress: '192.168.1.120',
    timestamp: '2026-03-24T09:00:00',
  },
  {
    id: '5',
    userId: 'u5',
    userName: 'Vikram Desai',
    action: 'update',
    entity: 'Result',
    entityId: 'RES-2026-0140',
    oldValues: { parameter: 'pH', value: '6.8' },
    newValues: { parameter: 'pH', value: '7.2', remarks: 'Re-tested after calibration' },
    ipAddress: '192.168.1.108',
    timestamp: '2026-03-24T08:45:00',
  },
  {
    id: '6',
    userId: 'u1',
    userName: 'Dr. Rajesh Kumar',
    action: 'reject',
    entity: 'Result',
    entityId: 'RES-2026-0139',
    oldValues: { status: 'PENDING_REVIEW' },
    newValues: { status: 'REJECTED', remarks: 'Inconsistent results, please re-test' },
    ipAddress: '192.168.1.105',
    timestamp: '2026-03-24T08:30:00',
  },
  {
    id: '7',
    userId: 'u6',
    userName: 'System Admin',
    action: 'delete',
    entity: 'Client',
    entityId: 'CLT-0045',
    oldValues: { name: 'TestCorp Ltd', status: 'Inactive' },
    ipAddress: '192.168.1.100',
    timestamp: '2026-03-23T17:30:00',
  },
  {
    id: '8',
    userId: 'u2',
    userName: 'Priya Sharma',
    action: 'create',
    entity: 'Booking',
    entityId: 'BK-2026-0098',
    newValues: { sampleCode: 'SMP-2026-00141', tests: 5, totalAmount: 12500 },
    ipAddress: '192.168.1.110',
    timestamp: '2026-03-23T16:15:00',
  },
  {
    id: '9',
    userId: 'u3',
    userName: 'Amit Patel',
    action: 'update',
    entity: 'Invoice',
    entityId: 'INV-2026-0055',
    oldValues: { status: 'SENT', paidAmount: 0 },
    newValues: { status: 'PARTIALLY_PAID', paidAmount: 25000 },
    ipAddress: '192.168.1.115',
    timestamp: '2026-03-23T15:00:00',
  },
  {
    id: '10',
    userId: 'u5',
    userName: 'Vikram Desai',
    action: 'create',
    entity: 'Result',
    entityId: 'RES-2026-0141',
    newValues: { testName: 'HPLC Assay', sampleCode: 'SMP-2026-00140', parameters: 8 },
    ipAddress: '192.168.1.108',
    timestamp: '2026-03-23T14:30:00',
  },
];

function DiffView({ oldValues, newValues }: { oldValues?: Record<string, unknown>; newValues?: Record<string, unknown> }) {
  const allKeys = new Set([
    ...Object.keys(oldValues || {}),
    ...Object.keys(newValues || {}),
  ]);

  return (
    <div className="bg-gray-50 rounded-lg p-4 mt-2">
      <div className="grid grid-cols-2 gap-4">
        {oldValues && Object.keys(oldValues).length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-red-600 uppercase mb-2">Previous Values</h4>
            <div className="space-y-1">
              {Object.entries(oldValues).map(([key, value]) => (
                <div key={key} className="flex items-start gap-2">
                  <span className="text-xs font-medium text-gray-500 min-w-20">{key}:</span>
                  <span className="text-xs text-red-700 bg-red-50 px-1.5 py-0.5 rounded">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {newValues && Object.keys(newValues).length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-green-600 uppercase mb-2">New Values</h4>
            <div className="space-y-1">
              {Object.entries(newValues).map(([key, value]) => (
                <div key={key} className="flex items-start gap-2">
                  <span className="text-xs font-medium text-gray-500 min-w-20">{key}:</span>
                  <span className="text-xs text-green-700 bg-green-50 px-1.5 py-0.5 rounded">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuditTrailPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [actionFilter, setActionFilter] = useState<ActionType>('all');
  const [entityFilter, setEntityFilter] = useState<EntityType>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const pageSize = 20;

  // Filter mock data
  const filteredLogs = mockAuditLogs.filter((log) => {
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    if (entityFilter !== 'all' && log.entity.toLowerCase() !== entityFilter) return false;
    if (search && !log.userName.toLowerCase().includes(search.toLowerCase()) &&
        !log.entityId.toLowerCase().includes(search.toLowerCase()) &&
        !log.entity.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const paginatedLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize);

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
          <p className="text-sm text-gray-500 mt-1">NABL compliant activity log for all system operations</p>
        </div>
        <Button variant="outline" icon={<Download className="h-4 w-4" />}>
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-end gap-4 flex-wrap">
          <SearchInput
            onSearch={(val) => { setSearch(val); setPage(1); }}
            placeholder="Search by user, entity ID..."
            className="w-72"
          />
          <Input
            label="From Date"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-40"
          />
          <Input
            label="To Date"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-40"
          />
          <Select
            label="Action"
            options={ACTION_OPTIONS}
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value as ActionType); setPage(1); }}
            className="w-40"
          />
          <Select
            label="Entity"
            options={ENTITY_OPTIONS}
            value={entityFilter}
            onChange={(e) => { setEntityFilter(e.target.value as EntityType); setPage(1); }}
            className="w-40"
          />
        </div>
      </Card>

      {/* Audit log table */}
      <Card noPadding>
        {filteredLogs.length === 0 ? (
          <EmptyState
            title="No audit logs found"
            description="Try adjusting your filters to see more results"
            icon={<Shield className="h-8 w-8 text-gray-400" />}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase w-8" />
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Timestamp</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Entity</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Entity ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedLogs.map((log) => {
                    const isExpanded = expandedRows.has(log.id);
                    const hasDetails = (log.oldValues && Object.keys(log.oldValues).length > 0) ||
                                       (log.newValues && Object.keys(log.newValues).length > 0);
                    return (
                      <tr key={log.id} className="group">
                        <td colSpan={7} className="p-0">
                          <div
                            className={`cursor-pointer hover:bg-blue-50 transition-colors ${isExpanded ? 'bg-blue-50/50' : ''}`}
                            onClick={() => hasDetails && toggleRow(log.id)}
                          >
                            <div className="flex">
                              <div className="px-3 py-3 flex items-center w-8">
                                {hasDetails && (
                                  isExpanded
                                    ? <ChevronDown className="h-4 w-4 text-gray-400" />
                                    : <ChevronRight className="h-4 w-4 text-gray-400" />
                                )}
                              </div>
                              <div className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap min-w-44">
                                {formatTimestamp(log.timestamp)}
                              </div>
                              <div className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap min-w-40">
                                {log.userName}
                              </div>
                              <div className="px-4 py-3 whitespace-nowrap min-w-28">
                                <Badge variant={actionBadgeVariant[log.action] || 'gray'}>
                                  {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                                </Badge>
                              </div>
                              <div className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap min-w-24">
                                {log.entity}
                              </div>
                              <div className="px-4 py-3 text-sm font-mono text-blue-600 whitespace-nowrap min-w-36">
                                {log.entityId}
                              </div>
                              <div className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap min-w-32">
                                {log.ipAddress || '---'}
                              </div>
                            </div>
                          </div>
                          {isExpanded && hasDetails && (
                            <div className="px-12 pb-4">
                              <DiffView oldValues={log.oldValues} newValues={log.newValues} />
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 border-t border-gray-100">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={filteredLogs.length}
                pageSize={pageSize}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
