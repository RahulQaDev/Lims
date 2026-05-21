import { useMemo, useState } from 'react';
import { Mail, Send, Inbox, Search, Plus, X, Paperclip } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

interface MailRow {
  id: number;
  from: string;
  to: string;
  subject: string;
  snippet: string;
  sentAt: string;
  folder: 'INBOX' | 'SENT' | 'DRAFT';
  read: boolean;
  priority: 'NORMAL' | 'HIGH';
}

const MOCK: MailRow[] = [
  { id: 1, from: 'reception@auriga.lab',   to: 'me', subject: 'TRF batch approved — please book', snippet: 'Please book samples SMP-2026-00230 to 00235. TRFs are approved and ready.',        sentAt: '2026-04-21 09:30', folder: 'INBOX', read: false, priority: 'HIGH' },
  { id: 2, from: 'purchase@auriga.lab',    to: 'me', subject: 'Methanol PO consumption pending',  snippet: 'Please update the PO consumption against IND-2604-0021 before end of day.',         sentAt: '2026-04-21 08:55', folder: 'INBOX', read: false, priority: 'NORMAL' },
  { id: 3, from: 'accounts@auriga.lab',    to: 'me', subject: 'Quotation QT-2604-0012 confirmed', snippet: 'Pharmatech Labs confirmed quotation. Ready to convert to booking.',                 sentAt: '2026-04-20 17:10', folder: 'INBOX', read: true,  priority: 'NORMAL' },
  { id: 4, from: 'me',                     to: 'analyst@auriga.lab', subject: 'SMP-2026-00228 assigned — urgent', snippet: 'Assigning this sample to HPLC. Please prioritise — client is waiting.', sentAt: '2026-04-20 16:30', folder: 'SENT',  read: true,  priority: 'HIGH' },
  { id: 5, from: 'me',                     to: 'micro@auriga.lab',   subject: 'Re: MLT turnaround',               snippet: 'Noted. Will inform client about the delay.',                             sentAt: '2026-04-19 11:20', folder: 'SENT',  read: true,  priority: 'NORMAL' },
  { id: 6, from: 'me',                     to: 'qa@auriga.lab',      subject: 'Draft: Rebooking reason report',   snippet: 'Attached monthly rebooking analysis for QA review...',                  sentAt: '2026-04-19 10:05', folder: 'DRAFT', read: true,  priority: 'NORMAL' },
];

export default function MailerPage() {
  const [rows, setRows] = useState<MailRow[]>(MOCK);
  const [folder, setFolder] = useState<'INBOX' | 'SENT' | 'DRAFT'>('INBOX');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<MailRow | null>(MOCK[0]);
  const [compose, setCompose] = useState(false);
  const [draft, setDraft] = useState({ to: '', subject: '', body: '' });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((r) => r.folder === folder)
      .filter((r) => !q || r.subject.toLowerCase().includes(q) || r.from.toLowerCase().includes(q) || r.to.toLowerCase().includes(q));
  }, [rows, folder, search]);

  const counts = {
    inbox:   rows.filter((r) => r.folder === 'INBOX').length,
    unread:  rows.filter((r) => r.folder === 'INBOX' && !r.read).length,
    sent:    rows.filter((r) => r.folder === 'SENT').length,
    drafts:  rows.filter((r) => r.folder === 'DRAFT').length,
  };

  const openRow = (r: MailRow) => {
    setSelected(r);
    if (!r.read) setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, read: true } : x)));
  };

  const sendDraft = () => {
    if (!draft.to.trim() || !draft.subject.trim()) { toast.error('To and Subject are required'); return; }
    const newRow: MailRow = {
      id: Math.max(...rows.map((r) => r.id)) + 1,
      from: 'me',
      to: draft.to,
      subject: draft.subject,
      snippet: draft.body.slice(0, 120),
      sentAt: new Date().toLocaleString('en-GB', { hour12: false }).replace(',', ''),
      folder: 'SENT',
      read: true,
      priority: 'NORMAL',
    };
    setRows([newRow, ...rows]);
    toast.success('Mail sent');
    setCompose(false);
    setDraft({ to: '', subject: '', body: '' });
    setFolder('SENT');
    setSelected(newRow);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" /> Mailer
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Inhouse communication</p>
        </div>
        <Button icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setCompose(true)}>Compose</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Folder rail */}
        <Card className="lg:col-span-2" noPadding>
          <div className="p-2 space-y-1">
            {[
              { key: 'INBOX',  label: 'Inbox',   icon: Inbox, count: counts.inbox,  badge: counts.unread },
              { key: 'SENT',   label: 'Sent',    icon: Send,  count: counts.sent,   badge: 0 },
              { key: 'DRAFT',  label: 'Drafts',  icon: Mail,  count: counts.drafts, badge: 0 },
            ].map((f) => {
              const Icon = f.icon;
              const active = folder === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFolder(f.key as typeof folder)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    active ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{f.label}</span>
                  <span className="text-xs text-slate-400">{f.count}</span>
                  {f.badge > 0 && <span className="ml-1 text-[10px] bg-blue-600 text-white rounded-full px-1.5 py-0.5">{f.badge}</span>}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Mail list */}
        <Card
          className="lg:col-span-4"
          noPadding
          title={folder === 'INBOX' ? 'Inbox' : folder === 'SENT' ? 'Sent' : 'Drafts'}
          subtitle={`${filtered.length} message${filtered.length !== 1 ? 's' : ''}`}
          actions={
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          }
        >
          <div className="max-h-[520px] overflow-y-auto divide-y divide-gray-100">
            {filtered.map((r) => (
              <button
                key={r.id}
                onClick={() => openRow(r)}
                className={`w-full text-left px-3 py-2.5 hover:bg-blue-50/50 transition-colors ${selected?.id === r.id ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${r.read ? 'text-slate-500 font-medium' : 'text-slate-900 font-semibold'}`}>
                    {folder === 'SENT' ? `To: ${r.to}` : r.from}
                  </span>
                  {r.priority === 'HIGH' && <Badge variant="red">High</Badge>}
                  <span className="ml-auto text-[10px] text-slate-400 whitespace-nowrap">{r.sentAt.slice(5, 10)}</span>
                </div>
                <div className={`text-sm mt-0.5 ${r.read ? 'text-slate-600' : 'text-slate-900 font-medium'} truncate`}>{r.subject}</div>
                <div className="text-xs text-slate-500 truncate">{r.snippet}</div>
              </button>
            ))}
            {filtered.length === 0 && <div className="px-3 py-8 text-center text-gray-400 text-sm">No messages</div>}
          </div>
        </Card>

        {/* Mail reader */}
        <Card className="lg:col-span-6" noPadding>
          {selected ? (
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">{selected.subject}</h2>
                  <div className="text-xs text-slate-500 mt-1">
                    <span className="font-medium text-slate-700">{selected.from}</span>
                    <span className="mx-1.5">→</span>
                    <span>{selected.to}</span>
                    <span className="mx-1.5">·</span>
                    <span>{selected.sentAt}</span>
                  </div>
                </div>
                {selected.priority === 'HIGH' && <Badge variant="red">High Priority</Badge>}
              </div>
              <div className="h-px bg-slate-100" />
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selected.snippet}</p>
              <div className="pt-3 flex gap-2">
                <Button size="sm" variant="primary" icon={<Send className="h-3 w-3" />} onClick={() => toast('Reply composer coming soon')}>Reply</Button>
                <Button size="sm" variant="outline" icon={<Paperclip className="h-3 w-3" />} onClick={() => toast('No attachments')}>Attachments</Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Mail className="h-10 w-10 mb-2" />
              <p className="text-sm">Select a message to read</p>
            </div>
          )}
        </Card>
      </div>

      {/* Compose modal */}
      {compose && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-xl shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">New Message</h3>
              <button onClick={() => setCompose(false)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-4 space-y-2">
              <input
                placeholder="To (e.g. analyst@auriga.lab)"
                value={draft.to}
                onChange={(e) => setDraft({ ...draft, to: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                placeholder="Subject"
                value={draft.subject}
                onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                rows={6}
                placeholder="Message…"
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-slate-200">
              <Button size="sm" variant="outline" onClick={() => setCompose(false)}>Cancel</Button>
              <Button size="sm" variant="primary" icon={<Send className="h-3 w-3" />} onClick={sendDraft}>Send</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
