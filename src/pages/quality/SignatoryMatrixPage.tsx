import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Grid3X3, MapPin, Calendar, CheckCircle2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import { signatoryApi, type MatrixData } from '../../services/signatory.service';

export default function SignatoryMatrixPage() {
  const navigate = useNavigate();
  const [unit, setUnit] = useState('Delhi');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [groupFilter, setGroupFilter] = useState<'ALL' | 'Chemical' | 'Biological' | 'Mechanical' | 'Statutory'>('ALL');

  const { data, isLoading } = useQuery<MatrixData>({
    queryKey: ['sig-matrix', unit, date],
    queryFn: () => signatoryApi.matrix(unit, date),
  });

  // Build a (signatoryId × templateId) -> Set<disciplineId> lookup
  const cellMap = useMemo(() => {
    const m = new Map<string, Set<number>>();
    if (!data) return m;
    for (const a of data.authorities) {
      const k = `${a.signatoryId}|${a.templateId}`;
      if (!m.has(k)) m.set(k, new Set());
      m.get(k)!.add(a.disciplineId);
    }
    return m;
  }, [data]);

  const filteredDisciplines = useMemo(() => {
    if (!data) return [];
    return groupFilter === 'ALL'
      ? data.disciplines
      : data.disciplines.filter((d) => d.groupType === groupFilter);
  }, [data, groupFilter]);

  const groupColor = (g: string) =>
    g === 'Chemical' ? 'bg-blue-50 text-blue-700' :
    g === 'Biological' ? 'bg-purple-50 text-purple-700' :
    g === 'Mechanical' ? 'bg-amber-50 text-amber-700' :
    'bg-emerald-50 text-emerald-700';

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading authority matrix…</div>;
  }
  if (!data) return null;

  const totalAuthorityRows = data.authorities.length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Grid3X3 className="h-5 w-5 text-blue-600" /> Authority Matrix
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {data.signatories.length} signatories · {data.templates.length} templates · {totalAuthorityRows} active authority rows
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <select value={unit} onChange={(e) => setUnit(e.target.value)} className="pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="Delhi">Delhi</option>
              <option value="Baddi" disabled>Baddi (Phase 2)</option>
              <option value="Bangalore" disabled>Bangalore (Phase 2)</option>
            </select>
          </div>
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-md" />
          </div>
        </div>
      </div>

      {/* Discipline group filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Discipline group:</span>
        {(['ALL', 'Chemical', 'Biological', 'Mechanical', 'Statutory'] as const).map((g) => (
          <button key={g} onClick={() => setGroupFilter(g)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              groupFilter === g ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {g === 'ALL' ? 'All' : g}
            {g !== 'ALL' && data.disciplines.filter((d) => d.groupType === g).length > 0 && (
              <span className="ml-1.5 opacity-70">{data.disciplines.filter((d) => d.groupType === g).length}</span>
            )}
          </button>
        ))}
      </div>

      <Card noPadding title="Signatories × Templates" subtitle="Cells show qualified discipline groups">
        <div className="overflow-x-auto">
          <table className="text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-2 text-left font-semibold text-slate-700 sticky left-0 bg-slate-50 z-10 border-r border-slate-200 min-w-[200px]">Signatory</th>
                {data.templates.map((t) => (
                  <th key={t.id} className="px-2 py-2 font-semibold text-slate-700 text-center min-w-[110px]">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">{t.regulatoryBody}</div>
                    <div>{t.templateCode}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.signatories.map((sig) => (
                <tr key={sig.id} className="hover:bg-blue-50/30">
                  <td className="px-3 py-2 sticky left-0 bg-white z-10 border-r border-slate-200">
                    <button onClick={() => navigate(`/quality/signatories/${sig.id}`)}
                      className="font-medium text-blue-600 hover:underline text-left">
                      {sig.fullName}
                    </button>
                    <div className="text-[10px] text-slate-500 truncate max-w-[180px]">{sig.designation || sig.employeeId}</div>
                  </td>
                  {data.templates.map((t) => {
                    const discIds = cellMap.get(`${sig.id}|${t.id}`);
                    const filteredIds = discIds
                      ? Array.from(discIds).filter((id) => filteredDisciplines.some((fd) => fd.id === id))
                      : [];
                    if (filteredIds.length === 0) {
                      return <td key={t.id} className="px-2 py-2 text-center text-slate-300">·</td>;
                    }
                    const discs = filteredIds.map((id) => data.disciplines.find((d) => d.id === id)!).filter(Boolean);
                    return (
                      <td key={t.id} className="px-1 py-1 text-center">
                        <div className="flex flex-wrap gap-0.5 justify-center">
                          {discs.map((d) => (
                            <span key={d.id}
                              title={d.disciplineName}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${groupColor(d.groupType)}`}
                            >
                              {d.disciplineCode.replace(/^(CHEM_|BIO_|MECH_|PIC_)/, '')}
                            </span>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {data.signatories.length === 0 && (
                <tr><td colSpan={data.templates.length + 1} className="px-3 py-8 text-center text-slate-400">No signatories in {unit}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 px-1">
        <span className="font-semibold text-slate-700">Legend:</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-blue-50 border border-blue-200" /> Chemical</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-purple-50 border border-purple-200" /> Biological</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber-50 border border-amber-200" /> Mechanical</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-50 border border-emerald-200" /> Statutory PIC</span>
        <span className="ml-auto inline-flex items-center gap-1 text-slate-500">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Hover a chip for full discipline name
        </span>
      </div>
    </div>
  );
}
