import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays, ChevronLeft, ChevronRight, Plus, X, Trash2,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { signatoryApi, type Absence, type Signatory } from '../../services/signatory.service';

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date)   { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function fmtISO(d: Date)       { return d.toISOString().slice(0, 10); }

export default function SignatoryAbsencePage() {
  const qc = useQueryClient();
  const [cursor, setCursor] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ signatoryId: 0, absentFrom: '', absentTo: '', reason: '', source: 'MANUAL' as Absence['source'] });

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const fromISO = fmtISO(monthStart);
  const toISO = fmtISO(monthEnd);

  const { data: signatories = [] } = useQuery<Signatory[]>({
    queryKey: ['sig-people'], queryFn: () => signatoryApi.listSignatories(),
  });
  const { data: absences = [] } = useQuery<Absence[]>({
    queryKey: ['sig-absences', fromISO, toISO],
    queryFn: () => signatoryApi.listAbsences({ from: fromISO, to: toISO }),
  });

  const createMut = useMutation({
    mutationFn: () => signatoryApi.createAbsence({
      signatoryId: form.signatoryId, absentFrom: form.absentFrom, absentTo: form.absentTo,
      reason: form.reason, source: form.source,
    }),
    onSuccess: () => {
      toast.success('Absence recorded');
      qc.invalidateQueries({ queryKey: ['sig-absences'] });
      qc.invalidateQueries({ queryKey: ['sig-coverage'] });
      setShowForm(false);
      setForm({ signatoryId: 0, absentFrom: '', absentTo: '', reason: '', source: 'MANUAL' });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to record absence'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => signatoryApi.deleteAbsence(id),
    onSuccess: () => {
      toast.success('Absence removed');
      qc.invalidateQueries({ queryKey: ['sig-absences'] });
      qc.invalidateQueries({ queryKey: ['sig-coverage'] });
    },
  });

  // Build day -> absences[] map
  const dayAbsences = useMemo(() => {
    const m = new Map<string, Absence[]>();
    for (const a of absences) {
      const start = new Date(a.absentFrom);
      const end = new Date(a.absentTo);
      // Iterate every day in range
      for (let d = new Date(start); d <= end; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
        const k = fmtISO(d);
        const arr = m.get(k) || [];
        arr.push(a);
        m.set(k, arr);
      }
    }
    return m;
  }, [absences]);

  // Build month grid (Sun-first)
  const grid = useMemo(() => {
    const days: { date: Date; inMonth: boolean }[] = [];
    const first = monthStart;
    const startWeekday = first.getDay();
    // Pad with leading days from previous month
    for (let i = startWeekday; i > 0; i--) {
      const d = new Date(first.getFullYear(), first.getMonth(), 1 - i);
      days.push({ date: d, inMonth: false });
    }
    // This month
    for (let i = 1; i <= monthEnd.getDate(); i++) {
      days.push({ date: new Date(first.getFullYear(), first.getMonth(), i), inMonth: true });
    }
    // Trailing
    while (days.length % 7 !== 0) {
      const last = days[days.length - 1].date;
      days.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), inMonth: false });
    }
    return days;
  }, [monthStart, monthEnd]);

  const monthLabel = cursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-600" /> Absence Calendar
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{absences.length} absence(s) in {monthLabel}</p>
        </div>
        <Button icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setShowForm(true)}>Record Absence</Button>
      </div>

      <Card noPadding>
        <div className="flex items-center justify-between p-3 border-b border-slate-100">
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="p-1.5 rounded hover:bg-slate-100"><ChevronLeft className="h-4 w-4 text-slate-600" /></button>
          <div className="text-sm font-semibold text-slate-900">{monthLabel}</div>
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="p-1.5 rounded hover:bg-slate-100"><ChevronRight className="h-4 w-4 text-slate-600" /></button>
        </div>
        <div className="grid grid-cols-7 gap-px bg-slate-200 border-b border-slate-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="bg-slate-50 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center py-2">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-slate-200">
          {grid.map((g, i) => {
            const k = fmtISO(g.date);
            const ab = dayAbsences.get(k) || [];
            const isToday = k === fmtISO(new Date());
            return (
              <div key={i} className={`bg-white min-h-[80px] p-1.5 ${g.inMonth ? '' : 'bg-slate-50'}`}>
                <div className={`text-[11px] ${g.inMonth ? 'text-slate-700' : 'text-slate-300'} ${isToday ? 'inline-block bg-blue-600 text-white rounded-full w-5 h-5 leading-5 text-center font-semibold' : ''}`}>
                  {g.date.getDate()}
                </div>
                <div className="space-y-0.5 mt-1">
                  {ab.slice(0, 3).map((a) => (
                    <div key={a.id} className="text-[9px] truncate px-1 py-0.5 rounded bg-amber-100 text-amber-800" title={`${a.signatory?.fullName || ''} — ${a.reason || ''}`}>
                      {a.signatory?.fullName?.replace(/^Mr\.|^Ms\.|^Dr\. /, '') || '?'}
                    </div>
                  ))}
                  {ab.length > 3 && <div className="text-[9px] text-slate-500">+{ab.length - 3} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Detailed list */}
      <Card noPadding title="Absences This Month" subtitle={`${absences.length} entries`}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Signatory</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">From</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">To</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Reason</th>
                <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase">Source</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {absences.map((a) => (
                <tr key={a.id}>
                  <td className="px-3 py-2.5 text-slate-700">{a.signatory?.fullName || '—'}</td>
                  <td className="px-3 py-2.5 text-slate-600">{a.absentFrom}</td>
                  <td className="px-3 py-2.5 text-slate-600">{a.absentTo}</td>
                  <td className="px-3 py-2.5 text-slate-600">{a.reason || '—'}</td>
                  <td className="px-3 py-2.5 text-center"><Badge variant="gray">{a.source}</Badge></td>
                  <td className="px-3 py-2.5 text-right">
                    <button onClick={() => deleteMut.mutate(a.id)} className="text-slate-400 hover:text-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {absences.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-400">No absences in this month</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">Record Absence</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Signatory</label>
                <select value={form.signatoryId || ''} onChange={(e) => setForm({ ...form, signatoryId: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— select —</option>
                  {signatories.map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">From</label>
                  <input type="date" value={form.absentFrom} onChange={(e) => setForm({ ...form, absentFrom: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">To</label>
                  <input type="date" value={form.absentTo} onChange={(e) => setForm({ ...form, absentTo: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Reason</label>
                <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="e.g. Annual Leave"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Source</label>
                <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value as Absence['source'] })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md">
                  <option value="MANUAL">Manual</option>
                  <option value="HR_SYNC">HR Sync</option>
                  <option value="AUTO">Auto-detected</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-slate-200">
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" variant="primary" onClick={() => createMut.mutate()} loading={createMut.isPending}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
