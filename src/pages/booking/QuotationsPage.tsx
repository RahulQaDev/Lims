import { useMemo, useState } from 'react';
import { FileText, Search, Plus, CheckCircle2, Eye } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

interface QuotationRow {
  id: number;
  quotationNo: string;
  clientName: string;
  testCount: number;
  amount: number;
  validUntil: string;
  status: 'DRAFT' | 'SENT' | 'CONFIRMED' | 'REJECTED' | 'EXPIRED';
  createdAt: string;
}

const MOCK: QuotationRow[] = [
  { id: 1, quotationNo: 'QT-2604-0012', clientName: 'Pharmatech Labs',   testCount: 8,  amount: 42000,  validUntil: '2026-05-15', status: 'CONFIRMED', createdAt: '2026-04-15' },
  { id: 2, quotationNo: 'QT-2604-0013', clientName: 'Vertex Biotech',    testCount: 12, amount: 86500,  validUntil: '2026-05-20', status: 'SENT',      createdAt: '2026-04-18' },
  { id: 3, quotationNo: 'QT-2604-0014', clientName: 'Sunlife Naturals',  testCount: 4,  amount: 18000,  validUntil: '2026-05-05', status: 'DRAFT',     createdAt: '2026-04-20' },
  { id: 4, quotationNo: 'QT-2604-0015', clientName: 'Medicore Inc.',     testCount: 6,  amount: 32500,  validUntil: '2026-05-12', status: 'SENT',      createdAt: '2026-04-19' },
  { id: 5, quotationNo: 'QT-2603-0098', clientName: 'AquaPure Inc',      testCount: 3,  amount: 12500,  validUntil: '2026-04-15', status: 'EXPIRED',   createdAt: '2026-03-14' },
  { id: 6, quotationNo: 'QT-2603-0091', clientName: 'AyurVed Organics',  testCount: 5,  amount: 22000,  validUntil: '2026-04-30', status: 'REJECTED',  createdAt: '2026-03-28' },
];

const statusCfg: Record<QuotationRow['status'], { v: 'gray' | 'blue' | 'green' | 'red' | 'yellow'; l: string }> = {
  DRAFT:     { v: 'gray',   l: 'Draft' },
  SENT:      { v: 'blue',   l: 'Sent' },
  CONFIRMED: { v: 'green',  l: 'Confirmed' },
  REJECTED:  { v: 'red',    l: 'Rejected' },
  EXPIRED:   { v: 'yellow', l: 'Expired' },
};

export default function QuotationsPage() {
  const [rows, setRows] = useState<QuotationRow[]>(MOCK);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | QuotationRow['status']>('ALL');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const mq = !q || r.quotationNo.toLowerCase().includes(q) || r.clientName.toLowerCase().includes(q);
      const ms = statusFilter === 'ALL' || r.status === statusFilter;
      return mq && ms;
    });
  }, [rows, search, statusFilter]);

  const totals = {
    count: rows.length,
    value: rows.reduce((a, r) => a + r.amount, 0),
    confirmed: rows.filter((r) => r.status === 'CONFIRMED').reduce((a, r) => a + r.amount, 0),
    pending: rows.filter((r) => r.status === 'SENT' || r.status === 'DRAFT').reduce((a, r) => a + r.amount, 0),
  };

  const confirm = (id: number) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status: 'CONFIRMED' } : r)));
    toast.success('Quotation confirmed');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" /> Quotations
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">View pricing and confirm quotation numbers</p>
        </div>
        <Button icon={<Plus className="h-3.5 w-3.5" />} onClick={() => toast('New quotation — coming soon')}>New Quotation</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Total Quotations</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totals.count}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Total Value</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(totals.value)}</div>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-green-700">Confirmed</div>
          <div className="text-2xl font-bold text-green-700 mt-1">{formatCurrency(totals.confirmed)}</div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-amber-700">Pending</div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{formatCurrency(totals.pending)}</div>
        </div>
      </div>

      <Card
        title="Quotations"
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
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="REJECTED">Rejected</option>
              <option value="EXPIRED">Expired</option>
            </select>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search quotation / client"
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
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Quotation #</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Client</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Tests</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Valid Until</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase w-44">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((r) => {
                const sc = statusCfg[r.status];
                return (
                  <tr key={r.id} className="hover:bg-blue-50/50">
                    <td className="px-3 py-2.5 font-medium text-slate-900">{r.quotationNo}</td>
                    <td className="px-3 py-2.5 text-gray-600">{r.clientName}</td>
                    <td className="px-3 py-2.5 text-center text-gray-700">{r.testCount}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-900">{formatCurrency(r.amount)}</td>
                    <td className="px-3 py-2.5 text-xs text-gray-500">{r.validUntil}</td>
                    <td className="px-3 py-2.5 text-center"><Badge variant={sc.v}>{sc.l}</Badge></td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button size="sm" variant="outline" icon={<Eye className="h-3 w-3" />} onClick={() => toast('Preview coming soon')}>View</Button>
                        {r.status === 'SENT' && (
                          <Button size="sm" variant="primary" icon={<CheckCircle2 className="h-3 w-3" />} onClick={() => confirm(r.id)}>Confirm</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-400">No matching quotations</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
