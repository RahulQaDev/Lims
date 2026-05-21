import { useMemo, useState } from 'react';
import { TicketCheck, Search, Plus, X, MessageSquare } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

type TicketCategory = 'BOOKING_ISSUE' | 'BARCODE' | 'PRICING' | 'CLIENT_QUERY' | 'SYSTEM' | 'OTHER';
type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

interface TicketRow {
  id: number;
  ticketNo: string;
  title: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  assignedTo: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  commentCount: number;
}

const MOCK: TicketRow[] = [
  { id: 1, ticketNo: 'TKT-2604-0034', title: 'Client reported wrong parameters in booking',      category: 'BOOKING_ISSUE', priority: 'HIGH',   status: 'OPEN',         assignedTo: 'QA Team',    createdBy: 'me', createdAt: '2026-04-21 09:10', updatedAt: '2026-04-21 09:10', commentCount: 0 },
  { id: 2, ticketNo: 'TKT-2604-0033', title: 'Barcode printer offline in Delhi lab',             category: 'BARCODE',       priority: 'URGENT', status: 'IN_PROGRESS',  assignedTo: 'IT',         createdBy: 'me', createdAt: '2026-04-21 08:45', updatedAt: '2026-04-21 09:20', commentCount: 3 },
  { id: 3, ticketNo: 'TKT-2604-0032', title: 'Pricing mismatch for Vitamin D3 Drops',            category: 'PRICING',       priority: 'NORMAL', status: 'IN_PROGRESS',  assignedTo: 'Accounts',   createdBy: 'me', createdAt: '2026-04-20 16:30', updatedAt: '2026-04-21 10:05', commentCount: 2 },
  { id: 4, ticketNo: 'TKT-2604-0031', title: 'Client wants report re-issued with new format',    category: 'CLIENT_QUERY',  priority: 'LOW',    status: 'OPEN',         assignedTo: 'Reports',    createdBy: 'me', createdAt: '2026-04-20 14:15', updatedAt: '2026-04-20 14:15', commentCount: 0 },
  { id: 5, ticketNo: 'TKT-2604-0030', title: 'YLIMS session timing out too quickly',              category: 'SYSTEM',        priority: 'NORMAL', status: 'RESOLVED',     assignedTo: 'IT',         createdBy: 'me', createdAt: '2026-04-19 11:00', updatedAt: '2026-04-20 09:30', commentCount: 4 },
  { id: 6, ticketNo: 'TKT-2604-0029', title: 'Unable to find template for Pharma products',      category: 'OTHER',         priority: 'NORMAL', status: 'CLOSED',       assignedTo: 'QA Team',    createdBy: 'me', createdAt: '2026-04-18 10:20', updatedAt: '2026-04-19 12:45', commentCount: 2 },
];

const statusCfg: Record<TicketStatus, { v: 'red' | 'blue' | 'green' | 'gray'; l: string }> = {
  OPEN:        { v: 'red',   l: 'Open' },
  IN_PROGRESS: { v: 'blue',  l: 'In Progress' },
  RESOLVED:    { v: 'green', l: 'Resolved' },
  CLOSED:      { v: 'gray',  l: 'Closed' },
};

const priorityCfg: Record<TicketPriority, { v: 'gray' | 'blue' | 'orange' | 'red'; l: string }> = {
  LOW:    { v: 'gray',   l: 'Low' },
  NORMAL: { v: 'blue',   l: 'Normal' },
  HIGH:   { v: 'orange', l: 'High' },
  URGENT: { v: 'red',    l: 'Urgent' },
};

const categoryLabels: Record<TicketCategory, string> = {
  BOOKING_ISSUE: 'Booking Issue',
  BARCODE:       'Barcode',
  PRICING:       'Pricing',
  CLIENT_QUERY:  'Client Query',
  SYSTEM:        'System',
  OTHER:         'Other',
};

export default function TicketsPage() {
  const [rows, setRows] = useState<TicketRow[]>(MOCK);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TicketStatus>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'BOOKING_ISSUE' as TicketCategory, priority: 'NORMAL' as TicketPriority, description: '' });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const mq = !q || r.ticketNo.toLowerCase().includes(q) || r.title.toLowerCase().includes(q);
      const ms = statusFilter === 'ALL' || r.status === statusFilter;
      return mq && ms;
    });
  }, [rows, search, statusFilter]);

  const counts = {
    open:        rows.filter((r) => r.status === 'OPEN').length,
    inProgress:  rows.filter((r) => r.status === 'IN_PROGRESS').length,
    resolved:    rows.filter((r) => r.status === 'RESOLVED').length,
    urgent:      rows.filter((r) => r.priority === 'URGENT' && r.status !== 'CLOSED' && r.status !== 'RESOLVED').length,
  };

  const raise = () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    const nextNo = `TKT-2604-00${(rows.length + 35).toString().padStart(2, '0')}`;
    const now = new Date().toLocaleString('en-GB', { hour12: false }).replace(',', '');
    setRows([
      {
        id: Math.max(...rows.map((r) => r.id)) + 1,
        ticketNo: nextNo,
        title: form.title,
        category: form.category,
        priority: form.priority,
        status: 'OPEN',
        assignedTo: 'Unassigned',
        createdBy: 'me',
        createdAt: now,
        updatedAt: now,
        commentCount: 0,
      },
      ...rows,
    ]);
    toast.success(`Ticket ${nextNo} raised`);
    setForm({ title: '', category: 'BOOKING_ISSUE', priority: 'NORMAL', description: '' });
    setShowForm(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <TicketCheck className="h-5 w-5 text-blue-600" /> Tickets
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Raise and track support tickets</p>
        </div>
        <Button icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setShowForm(true)}>Raise Ticket</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Open',        value: counts.open,       tone: 'bg-red-50    text-red-700    border-red-200' },
          { label: 'In Progress', value: counts.inProgress, tone: 'bg-blue-50   text-blue-700   border-blue-200' },
          { label: 'Resolved',    value: counts.resolved,   tone: 'bg-green-50  text-green-700  border-green-200' },
          { label: 'Urgent Open', value: counts.urgent,     tone: 'bg-amber-50  text-amber-700  border-amber-200' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.tone}`}>
            <div className="text-[10px] uppercase tracking-wider font-semibold opacity-70">{s.label}</div>
            <div className="text-2xl font-bold mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">Raise New Ticket</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
          </div>
          <div className="space-y-2">
            <input
              placeholder="Brief title (e.g. Client reported wrong parameter)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as TicketCategory })}
                className="px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {(Object.keys(categoryLabels) as TicketCategory[]).map((k) => (
                  <option key={k} value={k}>{categoryLabels[k]}</option>
                ))}
              </select>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as TicketPriority })}
                className="px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <textarea
              rows={3}
              placeholder="Describe the issue (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" variant="primary" onClick={raise}>Raise Ticket</Button>
            </div>
          </div>
        </div>
      )}

      <Card
        title="My Tickets"
        subtitle={`${filtered.length} of ${rows.length}`}
        noPadding
        actions={
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ticket / title"
                className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2.5 text-left   text-xs font-semibold text-gray-500 uppercase">Ticket #</th>
                <th className="px-3 py-2.5 text-left   text-xs font-semibold text-gray-500 uppercase">Title</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Priority</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-3 py-2.5 text-left   text-xs font-semibold text-gray-500 uppercase">Assigned To</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Comments</th>
                <th className="px-3 py-2.5 text-left   text-xs font-semibold text-gray-500 uppercase">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((r) => {
                const sc = statusCfg[r.status];
                const pc = priorityCfg[r.priority];
                return (
                  <tr key={r.id} className="hover:bg-blue-50/50">
                    <td className="px-3 py-2.5 font-medium text-slate-900">{r.ticketNo}</td>
                    <td className="px-3 py-2.5 text-gray-700 truncate max-w-[280px]">{r.title}</td>
                    <td className="px-3 py-2.5 text-center text-xs text-slate-600">{categoryLabels[r.category]}</td>
                    <td className="px-3 py-2.5 text-center"><Badge variant={pc.v}>{pc.l}</Badge></td>
                    <td className="px-3 py-2.5 text-center"><Badge variant={sc.v}>{sc.l}</Badge></td>
                    <td className="px-3 py-2.5 text-gray-600 text-xs">{r.assignedTo}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                        <MessageSquare className="h-3 w-3" />{r.commentCount}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-500">{r.updatedAt}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={8} className="px-3 py-8 text-center text-gray-400">No matching tickets</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
