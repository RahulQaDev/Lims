import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, Award, Users, AlertCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { signatoryApi, type SigTemplate, type SigDiscipline, type Authority, type Substitution } from '../../services/signatory.service';

export default function SignatoryTemplatePage() {
  const navigate = useNavigate();
  const [unit, setUnit] = useState('Delhi');
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [disciplineId, setDisciplineId] = useState<number | null>(null);

  const { data: templates = [] } = useQuery<SigTemplate[]>({
    queryKey: ['sig-templates'], queryFn: () => signatoryApi.listTemplates(),
  });
  const { data: disciplines = [] } = useQuery<SigDiscipline[]>({
    queryKey: ['sig-disciplines'], queryFn: () => signatoryApi.listDisciplines(),
  });

  const { data: authorities = [] } = useQuery<Authority[]>({
    queryKey: ['sig-auths', templateId, disciplineId, unit],
    queryFn: () => signatoryApi.listAuthorities({
      templateId: templateId ?? undefined,
      disciplineId: disciplineId ?? undefined,
      unit,
      status: 'Active',
    }),
    enabled: !!templateId && !!disciplineId,
  });

  // Pull substitution chains for these authorities
  const { data: allSubs = [] } = useQuery<Substitution[]>({
    queryKey: ['sig-subs-all'],
    queryFn: () => signatoryApi.listSubstitutions(),
  });

  const subsByPrimary = useMemo(() => {
    const m = new Map<number, Substitution[]>();
    for (const s of allSubs) {
      const arr = m.get(s.primaryAuthorityId) || [];
      arr.push(s);
      m.set(s.primaryAuthorityId, arr);
    }
    for (const v of m.values()) v.sort((a, b) => a.priority - b.priority);
    return m;
  }, [allSubs]);

  const selectedTemplate = templates.find((t) => t.id === templateId);
  const selectedDiscipline = disciplines.find((d) => d.id === disciplineId);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" /> Template View
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Pick a template + discipline to see qualified signatories and substitute order.</p>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Template</label>
            <select value={templateId ?? ''} onChange={(e) => setTemplateId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— select —</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.templateCode} ({t.regulatoryBody})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Discipline</label>
            <select value={disciplineId ?? ''} onChange={(e) => setDisciplineId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— select —</option>
              {disciplines.map((d) => (
                <option key={d.id} value={d.id}>{d.disciplineCode} — {d.groupType}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Unit</label>
            <select value={unit} onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="Delhi">Delhi</option>
              <option value="Baddi" disabled>Baddi (Phase 2)</option>
            </select>
          </div>
        </div>
      </Card>

      {selectedTemplate && selectedDiscipline && (
        <>
          <Card>
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <div className="flex-1">
                <h2 className="text-base font-semibold text-slate-900">{selectedTemplate.templateName}</h2>
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <span>{selectedTemplate.regulatoryBody}</span>
                  <span>·</span>
                  <span>{selectedDiscipline.disciplineName}</span>
                  <span>·</span>
                  <span>{unit}</span>
                </div>
              </div>
              <Badge variant={authorities.length > 0 ? 'green' : 'red'}>
                {authorities.length} qualified
              </Badge>
            </div>
          </Card>

          <Card noPadding title="Qualified Signatories" subtitle="Click a row to see substitute chain">
            <div className="divide-y divide-slate-100">
              {authorities.map((a) => {
                const subs = subsByPrimary.get(a.id) || [];
                return (
                  <div key={a.id} className="p-4">
                    <div className="flex items-center gap-3">
                      <Award className="h-5 w-5 text-emerald-600" />
                      <div className="flex-1 min-w-0">
                        <button onClick={() => navigate(`/quality/signatories/${a.signatoryId}`)} className="text-sm font-medium text-blue-600 hover:underline text-left">
                          {a.signatory?.fullName}
                        </button>
                        <div className="text-xs text-slate-500">{a.signatory?.designation || a.signatory?.employeeId}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Valid {a.authorisedFrom} → {a.authorisedTo}</div>
                        <Badge variant="green" className="mt-1">{a.authorityStatus}</Badge>
                      </div>
                    </div>

                    {subs.length > 0 && (
                      <div className="mt-3 pl-8 border-l-2 border-slate-100 space-y-1.5">
                        <div className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider flex items-center gap-1.5">
                          <Users className="h-3 w-3" /> Substitute chain
                        </div>
                        {subs.map((s) => (
                          <div key={s.id} className="flex items-center gap-2 text-xs">
                            <Badge variant={s.priority === 1 ? 'green' : s.priority === 2 ? 'blue' : 'gray'}>P{s.priority}</Badge>
                            <button onClick={() => navigate(`/quality/signatories/${s.substitute?.signatoryId}`)} className="text-blue-600 hover:underline">
                              {s.substitute?.signatory?.fullName || '—'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {authorities.length === 0 && (
                <div className="px-4 py-8 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  No qualified signatories for this combination — escalate to QH
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
