import { useMemo, useState } from 'react';
import { Barcode, Search, Printer, RefreshCw, CheckCircle2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

interface BarcodeRow {
  id: number;
  reportNumber: string;
  sampleCode: string;
  clientName: string;
  description: string;
  status: 'PENDING' | 'GENERATED' | 'PRINTED';
  generatedAt: string | null;
  printedAt: string | null;
}

const MOCK_ROWS: BarcodeRow[] = [
  { id: 1, reportNumber: 'RPT-2604-0412', sampleCode: 'SMP-2026-00230', clientName: 'Pharmatech Labs',  description: 'Ibuprofen Tablets 200mg', status: 'PENDING',   generatedAt: null,                  printedAt: null },
  { id: 2, reportNumber: 'RPT-2604-0411', sampleCode: 'SMP-2026-00229', clientName: 'Vertex Biotech',   description: 'Amoxicillin Capsules',    status: 'PENDING',   generatedAt: null,                  printedAt: null },
  { id: 3, reportNumber: 'RPT-2604-0410', sampleCode: 'SMP-2026-00228', clientName: 'Sunlife Naturals', description: 'Vitamin D3 Drops',        status: 'GENERATED', generatedAt: '2026-04-21 10:15',    printedAt: null },
  { id: 4, reportNumber: 'RPT-2604-0409', sampleCode: 'SMP-2026-00227', clientName: 'Medicore Inc.',    description: 'Paracetamol Syrup',       status: 'PRINTED',   generatedAt: '2026-04-21 09:42',    printedAt: '2026-04-21 09:45' },
  { id: 5, reportNumber: 'RPT-2604-0408', sampleCode: 'SMP-2026-00226', clientName: 'AquaPure Inc',     description: 'Mineral Water Bottle',    status: 'PRINTED',   generatedAt: '2026-04-21 09:05',    printedAt: '2026-04-21 09:10' },
];

const statusCfg: Record<BarcodeRow['status'], { v: 'yellow' | 'blue' | 'green'; l: string }> = {
  PENDING:   { v: 'yellow', l: 'Pending' },
  GENERATED: { v: 'blue',   l: 'Generated' },
  PRINTED:   { v: 'green',  l: 'Printed' },
};

export default function BarCodingPage() {
  const [rows, setRows] = useState<BarcodeRow[]>(MOCK_ROWS);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      r.reportNumber.toLowerCase().includes(q) ||
      r.sampleCode.toLowerCase().includes(q) ||
      r.clientName.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const counts = {
    total:     rows.length,
    pending:   rows.filter((r) => r.status === 'PENDING').length,
    generated: rows.filter((r) => r.status === 'GENERATED').length,
    printed:   rows.filter((r) => r.status === 'PRINTED').length,
  };

  const generate = (id: number) => {
    setRows((rs) =>
      rs.map((r) =>
        r.id === id ? { ...r, status: 'GENERATED', generatedAt: new Date().toLocaleString('en-GB', { hour12: false }).replace(',', '') } : r,
      ),
    );
    toast.success('Barcode generated');
  };

  const print = (id: number) => {
    setRows((rs) =>
      rs.map((r) =>
        r.id === id ? { ...r, status: 'PRINTED', printedAt: new Date().toLocaleString('en-GB', { hour12: false }).replace(',', '') } : r,
      ),
    );
    toast.success('Sent to printer');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Barcode className="h-5 w-5 text-blue-600" /> Bar Coding
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Generate and print barcodes for booked samples</p>
        </div>
        <Button variant="outline" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={() => toast.success('Refreshed')}>Refresh</Button>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total',     value: counts.total,     tone: 'bg-slate-50  text-slate-700  border-slate-200' },
          { label: 'Pending',   value: counts.pending,   tone: 'bg-amber-50  text-amber-700  border-amber-200' },
          { label: 'Generated', value: counts.generated, tone: 'bg-blue-50   text-blue-700   border-blue-200' },
          { label: 'Printed',   value: counts.printed,   tone: 'bg-green-50  text-green-700  border-green-200' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.tone}`}>
            <div className="text-[10px] uppercase tracking-wider font-semibold opacity-70">{s.label}</div>
            <div className="text-2xl font-bold mt-1">{s.value}</div>
          </div>
        ))}
      </div>

      <Card
        title="Report Numbers"
        subtitle={`${filtered.length} of ${rows.length}`}
        noPadding
        actions={
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search report / sample / client"
              className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Report / Sample</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Client</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Generated</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase w-48">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((r) => {
                const sc = statusCfg[r.status];
                return (
                  <tr key={r.id} className="hover:bg-blue-50/50">
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-slate-900 text-sm">{r.reportNumber}</div>
                      <div className="text-xs text-blue-600">{r.sampleCode}</div>
                    </td>
                    <td className="px-3 py-2.5 text-gray-600">{r.clientName}</td>
                    <td className="px-3 py-2.5 text-gray-600 truncate max-w-[220px]">{r.description}</td>
                    <td className="px-3 py-2.5 text-center"><Badge variant={sc.v}>{sc.l}</Badge></td>
                    <td className="px-3 py-2.5 text-xs text-gray-500">{r.generatedAt || '—'}</td>
                    <td className="px-3 py-2.5 text-right">
                      {r.status === 'PENDING' && (
                        <Button size="sm" variant="primary" icon={<Barcode className="h-3 w-3" />} onClick={() => generate(r.id)}>Generate</Button>
                      )}
                      {r.status === 'GENERATED' && (
                        <Button size="sm" variant="outline" icon={<Printer className="h-3 w-3" />} onClick={() => print(r.id)}>Print</Button>
                      )}
                      {r.status === 'PRINTED' && (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                          <CheckCircle2 className="h-3 w-3" /> Done
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400">No matching records</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
