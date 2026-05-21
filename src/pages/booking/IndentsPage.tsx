import { useMemo, useState } from 'react';
import { Package, Search, Plus, X } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

interface IndentRow {
  id: number;
  indentNo: string;
  item: string;
  category: 'CHEMICAL' | 'CONSUMABLE' | 'GLASSWARE' | 'STATIONERY';
  qty: number;
  uom: string;
  requestedFor: string;
  priority: 'NORMAL' | 'URGENT';
  status: 'PENDING' | 'APPROVED' | 'ORDERED' | 'RECEIVED' | 'REJECTED';
  createdAt: string;
}

const MOCK: IndentRow[] = [
  { id: 1, indentNo: 'IND-2604-0021', item: 'HPLC Grade Methanol', category: 'CHEMICAL',   qty: 4,   uom: 'L',    requestedFor: 'HPLC Lab',     priority: 'URGENT', status: 'APPROVED', createdAt: '2026-04-18' },
  { id: 2, indentNo: 'IND-2604-0022', item: 'Disposable Pipette Tips 1000µL', category: 'CONSUMABLE', qty: 10, uom: 'Box', requestedFor: 'Sample Prep', priority: 'NORMAL', status: 'ORDERED',  createdAt: '2026-04-17' },
  { id: 3, indentNo: 'IND-2604-0023', item: 'Volumetric Flask 100mL', category: 'GLASSWARE', qty: 6,   uom: 'Pc',   requestedFor: 'Analytical',   priority: 'NORMAL', status: 'PENDING',  createdAt: '2026-04-20' },
  { id: 4, indentNo: 'IND-2604-0024', item: 'Barcode Label Roll 100×50mm',   category: 'STATIONERY', qty: 2,   uom: 'Roll', requestedFor: 'Booking',     priority: 'URGENT', status: 'PENDING',  createdAt: '2026-04-21' },
  { id: 5, indentNo: 'IND-2604-0019', item: 'Sodium Chloride AR Grade',      category: 'CHEMICAL',   qty: 1,   uom: 'kg',   requestedFor: 'Micro Lab',   priority: 'NORMAL', status: 'RECEIVED', createdAt: '2026-04-10' },
  { id: 6, indentNo: 'IND-2603-0015', item: 'Petri Dishes Sterile',          category: 'CONSUMABLE', qty: 500, uom: 'Pc',   requestedFor: 'Micro Lab',   priority: 'NORMAL', status: 'REJECTED', createdAt: '2026-03-25' },
];

const statusCfg: Record<IndentRow['status'], { v: 'yellow' | 'blue' | 'purple' | 'green' | 'red'; l: string }> = {
  PENDING:  { v: 'yellow', l: 'Pending' },
  APPROVED: { v: 'blue',   l: 'Approved' },
  ORDERED:  { v: 'purple', l: 'Ordered' },
  RECEIVED: { v: 'green',  l: 'Received' },
  REJECTED: { v: 'red',    l: 'Rejected' },
};

const categoryCfg: Record<IndentRow['category'], { v: 'blue' | 'cyan' | 'teal' | 'gray' }> = {
  CHEMICAL:   { v: 'cyan' },
  CONSUMABLE: { v: 'blue' },
  GLASSWARE:  { v: 'teal' },
  STATIONERY: { v: 'gray' },
};

export default function IndentsPage() {
  const [rows, setRows] = useState<IndentRow[]>(MOCK);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ item: '', category: 'CHEMICAL' as IndentRow['category'], qty: 1, uom: '', requestedFor: '', priority: 'NORMAL' as IndentRow['priority'] });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.indentNo.toLowerCase().includes(q) || r.item.toLowerCase().includes(q) || r.requestedFor.toLowerCase().includes(q));
  }, [rows, search]);

  const counts = {
    pending:  rows.filter((r) => r.status === 'PENDING').length,
    approved: rows.filter((r) => r.status === 'APPROVED').length,
    ordered:  rows.filter((r) => r.status === 'ORDERED').length,
    received: rows.filter((r) => r.status === 'RECEIVED').length,
  };

  const submit = () => {
    if (!form.item.trim() || !form.uom.trim()) { toast.error('Item and UoM are required'); return; }
    const nextNo = `IND-2604-00${(rows.length + 25).toString().padStart(2, '0')}`;
    setRows([
      {
        id: Math.max(...rows.map((r) => r.id)) + 1,
        indentNo: nextNo,
        item: form.item,
        category: form.category,
        qty: form.qty,
        uom: form.uom,
        requestedFor: form.requestedFor || 'Booking',
        priority: form.priority,
        status: 'PENDING',
        createdAt: new Date().toISOString().slice(0, 10),
      },
      ...rows,
    ]);
    toast.success(`Indent ${nextNo} raised`);
    setForm({ item: '', category: 'CHEMICAL', qty: 1, uom: '', requestedFor: '', priority: 'NORMAL' });
    setShowForm(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" /> Indents
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Raise indents for chemicals, consumables and other supplies</p>
        </div>
        <Button icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setShowForm(true)}>Raise Indent</Button>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Pending',  value: counts.pending,  tone: 'bg-amber-50  text-amber-700  border-amber-200' },
          { label: 'Approved', value: counts.approved, tone: 'bg-blue-50   text-blue-700   border-blue-200' },
          { label: 'Ordered',  value: counts.ordered,  tone: 'bg-purple-50 text-purple-700 border-purple-200' },
          { label: 'Received', value: counts.received, tone: 'bg-green-50  text-green-700  border-green-200' },
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
            <h3 className="text-sm font-semibold text-slate-900">New Indent</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
            <input
              placeholder="Item name"
              value={form.item}
              onChange={(e) => setForm({ ...form, item: e.target.value })}
              className="md:col-span-2 px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as IndentRow['category'] })}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="CHEMICAL">Chemical</option>
              <option value="CONSUMABLE">Consumable</option>
              <option value="GLASSWARE">Glassware</option>
              <option value="STATIONERY">Stationery</option>
            </select>
            <input
              type="number"
              min={1}
              placeholder="Qty"
              value={form.qty}
              onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              placeholder="UoM (L, Box, Pc)"
              value={form.uom}
              onChange={(e) => setForm({ ...form, uom: e.target.value })}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as IndentRow['priority'] })}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="NORMAL">Normal</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              placeholder="Requested for (department)"
              value={form.requestedFor}
              onChange={(e) => setForm({ ...form, requestedFor: e.target.value })}
              className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" variant="primary" onClick={submit}>Raise</Button>
          </div>
        </div>
      )}

      <Card
        title="Indent Register"
        subtitle={`${filtered.length} of ${rows.length}`}
        noPadding
        actions={
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search indent / item / dept"
              className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2.5 text-left   text-xs font-semibold text-gray-500 uppercase">Indent #</th>
                <th className="px-3 py-2.5 text-left   text-xs font-semibold text-gray-500 uppercase">Item</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Qty</th>
                <th className="px-3 py-2.5 text-left   text-xs font-semibold text-gray-500 uppercase">Requested For</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Priority</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-3 py-2.5 text-left   text-xs font-semibold text-gray-500 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((r) => {
                const sc = statusCfg[r.status];
                const cc = categoryCfg[r.category];
                return (
                  <tr key={r.id} className="hover:bg-blue-50/50">
                    <td className="px-3 py-2.5 font-medium text-slate-900">{r.indentNo}</td>
                    <td className="px-3 py-2.5 text-gray-700 truncate max-w-[240px]">{r.item}</td>
                    <td className="px-3 py-2.5 text-center"><Badge variant={cc.v}>{r.category}</Badge></td>
                    <td className="px-3 py-2.5 text-center text-gray-700">{r.qty} {r.uom}</td>
                    <td className="px-3 py-2.5 text-gray-600">{r.requestedFor}</td>
                    <td className="px-3 py-2.5 text-center">
                      <Badge variant={r.priority === 'URGENT' ? 'red' : 'blue'}>{r.priority === 'URGENT' ? 'Urgent' : 'Normal'}</Badge>
                    </td>
                    <td className="px-3 py-2.5 text-center"><Badge variant={sc.v}>{sc.l}</Badge></td>
                    <td className="px-3 py-2.5 text-xs text-gray-500">{r.createdAt}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={8} className="px-3 py-8 text-center text-gray-400">No matching indents</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
