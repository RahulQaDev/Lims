import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, ShieldAlert, ShieldX, MapPin, Calendar, RefreshCw,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { signatoryApi, type CoverageReport, type CoverageCell } from '../../services/signatory.service';

export default function SignatoryCoveragePage() {
  const navigate = useNavigate();
  const [unit, setUnit] = useState('Delhi');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'GREEN' | 'AMBER' | 'RED'>('ALL');

  const { data, isLoading, refetch, isFetching } = useQuery<CoverageReport>({
    queryKey: ['sig-coverage', unit, date],
    queryFn: () => signatoryApi.coverage(unit, date),
    refetchInterval: 60_000,
  });

  if (isLoading) return <div className="p-8 text-center text-slate-500">Resolving coverage…</div>;
  if (!data) return null;

  const filtered = statusFilter === 'ALL' ? data.cells : data.cells.filter((c) => c.status === statusFilter);

  const tile = (cell: CoverageCell) => {
    const tone =
      cell.status === 'GREEN' ? 'border-emerald-200 bg-emerald-50' :
      cell.status === 'AMBER' ? 'border-amber-200 bg-amber-50' :
                                 'border-red-200 bg-red-50';
    const Icon =
      cell.status === 'GREEN' ? ShieldCheck :
      cell.status === 'AMBER' ? ShieldAlert :
                                 ShieldX;
    const iconClr =
      cell.status === 'GREEN' ? 'text-emerald-600' :
      cell.status === 'AMBER' ? 'text-amber-600' :
                                 'text-red-600';
    return (
      <button
        key={`${cell.templateId}-${cell.disciplineId}`}
        onClick={() => cell.active && navigate(`/quality/signatories/${cell.active}`)}
        className={`text-left rounded-xl border p-3 transition-shadow hover:shadow-sm ${tone}`}
        title={cell.disciplineName}
      >
        <div className="flex items-start gap-2">
          <Icon className={`h-4 w-4 ${iconClr} shrink-0 mt-0.5`} />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{cell.templateCode}</div>
            <div className="text-xs text-slate-600 truncate">{cell.disciplineCode.replace(/^(CHEM_|BIO_|MECH_|PIC_)/, '')}</div>
          </div>
        </div>
        <div className="mt-2">
          {cell.status === 'GREEN' && (
            <div className="text-xs text-slate-700 font-medium truncate">{cell.activeName}</div>
          )}
          {cell.status === 'AMBER' && (
            <>
              <div className="text-xs text-slate-700 font-medium truncate">{cell.activeName}</div>
              <div className="text-[10px] text-amber-700 truncate">covering for {cell.coveringForName} (P{cell.priority})</div>
            </>
          )}
          {cell.status === 'RED' && (
            <div className="text-[11px] text-red-700 font-semibold">{cell.reason || 'No qualified signatory'}</div>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" /> Today's Coverage
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Per (template × discipline × unit) signing readiness</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <select value={unit} onChange={(e) => setUnit(e.target.value)} className="pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="Delhi">Delhi</option>
            </select>
          </div>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-md" />
          </div>
          <Button size="sm" variant="outline" icon={<RefreshCw className={`h-3 w-3 ${isFetching ? 'animate-spin' : ''}`} />} onClick={() => refetch()}>Refresh</Button>
        </div>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-3 gap-3">
        <button onClick={() => setStatusFilter('GREEN')}
          className={`rounded-xl border p-4 text-left transition ${statusFilter === 'GREEN' ? 'ring-2 ring-emerald-400' : ''} bg-emerald-50 border-emerald-200`}>
          <div className="flex items-center gap-2 text-emerald-700">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-[10px] uppercase font-semibold tracking-wider">Green — Covered</span>
          </div>
          <div className="text-3xl font-bold text-emerald-700 mt-1">{data.summary.green}</div>
        </button>
        <button onClick={() => setStatusFilter('AMBER')}
          className={`rounded-xl border p-4 text-left transition ${statusFilter === 'AMBER' ? 'ring-2 ring-amber-400' : ''} bg-amber-50 border-amber-200`}>
          <div className="flex items-center gap-2 text-amber-700">
            <ShieldAlert className="h-4 w-4" />
            <span className="text-[10px] uppercase font-semibold tracking-wider">Amber — Substitute</span>
          </div>
          <div className="text-3xl font-bold text-amber-700 mt-1">{data.summary.amber}</div>
        </button>
        <button onClick={() => setStatusFilter('RED')}
          className={`rounded-xl border p-4 text-left transition ${statusFilter === 'RED' ? 'ring-2 ring-red-400' : ''} bg-red-50 border-red-200`}>
          <div className="flex items-center gap-2 text-red-700">
            <ShieldX className="h-4 w-4" />
            <span className="text-[10px] uppercase font-semibold tracking-wider">Red — No Cover</span>
          </div>
          <div className="text-3xl font-bold text-red-700 mt-1">{data.summary.red}</div>
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-500">Filter:</span>
        {(['ALL', 'GREEN', 'AMBER', 'RED'] as const).map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-2 py-1 rounded border ${statusFilter === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-600'}`}>
            {s}
          </button>
        ))}
        <Badge variant="gray" className="ml-2">{filtered.length} cells</Badge>
      </div>

      <Card title="Coverage Cells" subtitle={`${unit} · ${date}`}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
          {filtered.map(tile)}
        </div>
        {filtered.length === 0 && <div className="py-8 text-center text-slate-400 text-sm">No cells match this filter</div>}
      </Card>
    </div>
  );
}
