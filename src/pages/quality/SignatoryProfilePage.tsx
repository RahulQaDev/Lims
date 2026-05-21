import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Mail, Phone, Building2, Briefcase,
  CheckCircle2, AlertTriangle, Clock, Award, ShieldCheck, X,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { signatoryApi, type ProfileResponse } from '../../services/signatory.service';

type Tab = 'authorities' | 'substitutes' | 'absences' | 'history' | 'reauth';

export default function SignatoryProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('authorities');

  const { data, isLoading } = useQuery<ProfileResponse>({
    queryKey: ['sig-profile', id],
    queryFn: () => signatoryApi.getProfile(Number(id)),
    enabled: !!id,
  });

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading profile…</div>;
  if (!data) return <div className="p-8 text-center text-slate-500">Signatory not found</div>;

  const { signatory, authorities, absences, substitutes, history } = data;

  const today = new Date().toISOString().slice(0, 10);
  const currentlyAbsent = absences.some((a) => a.absentFrom <= today && a.absentTo >= today);
  const activeAuthorities = authorities.filter((a) => a.authorityStatus === 'Active');
  const expiringSoon = activeAuthorities.filter((a) => {
    const days = Math.ceil((new Date(a.authorisedTo).getTime() - Date.now()) / 86_400_000);
    return days >= 0 && days <= 30;
  });

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'authorities', label: 'Authorities',  count: authorities.length },
    { key: 'substitutes', label: 'Substitutes',  count: substitutes.length },
    { key: 'absences',    label: 'Absences',     count: absences.length },
    { key: 'history',     label: 'Sign History', count: history.length },
    { key: 'reauth',      label: 'Re-auth',      count: expiringSoon.length },
  ];

  return (
    <div className="space-y-5">
      <button onClick={() => navigate('/quality/signatories')} className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
        <ArrowLeft className="h-3 w-3" /> Back to matrix
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold shrink-0">
              {signatory.fullName.split(' ').map((p) => p[0]).filter((c) => /[A-Z]/.test(c)).slice(0, 2).join('')}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold">{signatory.fullName}</h2>
              <p className="text-blue-100 text-sm">{signatory.designation || '—'} · {signatory.unit}</p>
              <p className="text-blue-200 text-xs font-mono mt-0.5">{signatory.employeeId}</p>
            </div>
            <div className="flex flex-col gap-2 shrink-0 items-end">
              <Badge variant={signatory.status === 'Active' ? 'green' : 'red'}>{signatory.status}</Badge>
              {currentlyAbsent && <Badge variant="orange">On Leave</Badge>}
              {expiringSoon.length > 0 && <Badge variant="yellow">{expiringSoon.length} Re-auth Due</Badge>}
            </div>
          </div>
        </div>
        <div className="px-6 py-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600">
          {signatory.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" /><span className="truncate">{signatory.email}</span></div>}
          {signatory.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" /><span>{signatory.phone}</span></div>}
          <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-slate-400" /><span>{signatory.unit}</span></div>
          <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-slate-400" /><span>{activeAuthorities.length} active authorities</span></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-1">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
                tab === t.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.label}
              {t.count !== undefined && (
                <span className={`ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full ${
                  tab === t.key ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                }`}>{t.count}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {tab === 'authorities' && (
        <Card noPadding>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Template</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Discipline</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Unit</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Valid From</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Valid To</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {authorities.map((a) => {
                  const days = Math.ceil((new Date(a.authorisedTo).getTime() - Date.now()) / 86_400_000);
                  return (
                    <tr key={a.id} className="hover:bg-blue-50/30">
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-slate-900">{a.template?.templateCode}</div>
                        <div className="text-xs text-slate-500">{a.template?.regulatoryBody}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="text-slate-700">{a.discipline?.disciplineName}</div>
                        <div className="text-xs text-slate-500">{a.discipline?.groupType}</div>
                      </td>
                      <td className="px-3 py-2.5 text-slate-700">{a.unit}</td>
                      <td className="px-3 py-2.5 text-xs text-slate-500">{a.authorisedFrom}</td>
                      <td className="px-3 py-2.5">
                        <div className="text-xs text-slate-500">{a.authorisedTo}</div>
                        {a.authorityStatus === 'Active' && days >= 0 && days <= 30 && (
                          <div className="text-[10px] text-amber-600 font-semibold mt-0.5 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {days}d to expiry
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Badge variant={a.authorityStatus === 'Active' ? 'green' : a.authorityStatus === 'Withdrawn' ? 'red' : 'gray'}>
                          {a.authorityStatus}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
                {authorities.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-400">No authorities</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'substitutes' && (
        <Card noPadding>
          <div className="p-4 text-sm text-slate-600 border-b border-slate-100">
            People who cover this signatory when on leave (priority 1 → 3)
          </div>
          <div className="divide-y divide-slate-100">
            {substitutes.map((s) => (
              <div key={s.id} className="px-4 py-3 flex items-center gap-3">
                <Badge variant={s.priority === 1 ? 'green' : s.priority === 2 ? 'blue' : 'gray'}>P{s.priority}</Badge>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900">{s.substitute?.signatory?.fullName || '—'}</div>
                  <div className="text-xs text-slate-500">
                    Covers: {s.primary?.template?.templateCode} · {s.primary?.discipline?.disciplineName}
                  </div>
                </div>
                <button onClick={() => navigate(`/quality/signatories/${s.substitute?.signatoryId}`)} className="text-xs text-blue-600 hover:underline">
                  View profile →
                </button>
              </div>
            ))}
            {substitutes.length === 0 && <div className="px-4 py-8 text-center text-slate-400 text-sm">No substitute chains configured</div>}
          </div>
        </Card>
      )}

      {tab === 'absences' && (
        <Card noPadding>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">From</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">To</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Days</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Reason</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase">Source</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase">Notified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {absences.map((a) => {
                  const days = Math.ceil((new Date(a.absentTo).getTime() - new Date(a.absentFrom).getTime()) / 86_400_000) + 1;
                  return (
                    <tr key={a.id}>
                      <td className="px-3 py-2.5 text-slate-700">{a.absentFrom}</td>
                      <td className="px-3 py-2.5 text-slate-700">{a.absentTo}</td>
                      <td className="px-3 py-2.5 text-slate-700">{days}</td>
                      <td className="px-3 py-2.5 text-slate-600">{a.reason || '—'}</td>
                      <td className="px-3 py-2.5 text-center"><Badge variant="gray">{a.source}</Badge></td>
                      <td className="px-3 py-2.5 text-center">
                        {a.notificationSent
                          ? <CheckCircle2 className="h-4 w-4 text-emerald-600 mx-auto" />
                          : <X className="h-4 w-4 text-slate-300 mx-auto" />}
                      </td>
                    </tr>
                  );
                })}
                {absences.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-400">No absences logged</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'history' && (
        <Card noPadding>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">When</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Report</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Template</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Discipline</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase">Result</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase">Reason / Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((h) => (
                  <tr key={h.id}>
                    <td className="px-3 py-2.5 text-xs text-slate-500">{new Date(h.signedAt).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-900">{h.reportId}</td>
                    <td className="px-3 py-2.5 text-slate-700">{h.template?.templateCode || '—'}</td>
                    <td className="px-3 py-2.5 text-slate-600 truncate max-w-[180px]">{h.discipline?.disciplineCode || '—'}</td>
                    <td className="px-3 py-2.5 text-center">
                      <Badge variant={h.result === 'SUCCESS' ? 'green' : 'red'}>{h.result}</Badge>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500 truncate max-w-[200px]">
                      {h.result === 'SUCCESS' ? h.signatureHash?.slice(0, 16) + '…' : h.rejectReason}
                    </td>
                  </tr>
                ))}
                {history.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-400">No signing history</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'reauth' && (
        <Card noPadding>
          <div className="p-4 border-b border-slate-100 flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-slate-700">Authorities expiring within 30 days require re-authorisation by Quality Head.</span>
          </div>
          <div className="divide-y divide-slate-100">
            {expiringSoon.map((a) => {
              const days = Math.ceil((new Date(a.authorisedTo).getTime() - Date.now()) / 86_400_000);
              return (
                <div key={a.id} className="px-4 py-3 flex items-center gap-3">
                  <Award className="h-5 w-5 text-amber-600" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900">{a.template?.templateCode} — {a.discipline?.disciplineName}</div>
                    <div className="text-xs text-slate-500">Expires {a.authorisedTo}</div>
                  </div>
                  <Badge variant={days <= 7 ? 'red' : days <= 15 ? 'orange' : 'yellow'}>{days}d</Badge>
                </div>
              );
            })}
            {expiringSoon.length === 0 && (
              <div className="px-4 py-8 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> All authorities current
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
