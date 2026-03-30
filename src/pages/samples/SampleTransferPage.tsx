import { useState } from 'react';
import { ArrowLeftRight, Send, Download, Clock, CheckCircle2, XCircle, Truck, Plus } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import StatCard from '../../components/ui/StatCard';
import EmptyState from '../../components/ui/EmptyState';

const locations = [
  { id: 1, name: 'Delhi', code: 'DEL' },
  { id: 2, name: 'Alcatec', code: 'ALC' },
  { id: 3, name: 'Manesar', code: 'MAN' },
  { id: 4, name: 'Bangalore', code: 'BLR' },
  { id: 5, name: 'Baddi', code: 'BDD' },
];

interface Transfer {
  id: number; sampleCode: string; sampleDesc: string; from: string; to: string;
  status: string; requestedBy: string; requestedDate: string; tracking?: string;
  reason: string; transportMode: string;
}

const mockOutgoing: Transfer[] = [
  { id: 1, sampleCode: 'AUR-2603-0045', sampleDesc: 'Paracetamol Tablets IP 500mg', from: 'Delhi', to: 'Bangalore', status: 'IN_TRANSIT', requestedBy: 'Mr. Ashu Kumar', requestedDate: '2026-03-24', tracking: 'DL-BLR-0324-01', reason: 'HPLC testing required at BLR facility', transportMode: 'COURIER' },
  { id: 2, sampleCode: 'AUR-2603-0029', sampleDesc: 'Groundwater Sample', from: 'Delhi', to: 'Alcatec', status: 'APPROVED', requestedBy: 'Ms. Silpi Rani Kalita', requestedDate: '2026-03-24', reason: 'Specialized ICP-MS analysis', transportMode: 'HAND_CARRY' },
  { id: 3, sampleCode: 'AUR-2603-0052', sampleDesc: 'Herbal Face Cream', from: 'Delhi', to: 'Manesar', status: 'REQUESTED', requestedBy: 'Mr. Sanjeev Tiwari', requestedDate: '2026-03-25', reason: 'Micro testing capacity at Manesar', transportMode: 'LOGISTICS' },
];

const mockIncoming: Transfer[] = [
  { id: 4, sampleCode: 'AUR-2603-0051', sampleDesc: 'Amoxicillin Capsules', from: 'Baddi', to: 'Delhi', status: 'REQUESTED', requestedBy: 'Mr. Rakesh Sharma', requestedDate: '2026-03-25', reason: 'Dissolution testing equipment at Delhi', transportMode: 'COURIER' },
  { id: 5, sampleCode: 'AUR-2603-0048', sampleDesc: 'Wheat Flour Sample', from: 'Manesar', to: 'Delhi', status: 'IN_TRANSIT', requestedBy: 'Mr. Deepak Pant', requestedDate: '2026-03-23', tracking: 'MAN-DEL-0323-01', reason: 'Aflatoxin testing via LCMS', transportMode: 'COURIER' },
];

const mockHistory: Transfer[] = [
  { id: 6, sampleCode: 'AUR-2603-0038', sampleDesc: 'Municipal Tap Water', from: 'Manesar', to: 'Delhi', status: 'RECEIVED', requestedBy: 'Ms. Puja Kumari', requestedDate: '2026-03-21', reason: 'Radiological testing', transportMode: 'HAND_CARRY' },
  { id: 7, sampleCode: 'AUR-2603-0033', sampleDesc: 'Honey Organic', from: 'Bangalore', to: 'Manesar', status: 'RECEIVED', requestedBy: 'Mr. Vinod Kumar', requestedDate: '2026-03-20', reason: 'Pesticide residue analysis', transportMode: 'COURIER' },
  { id: 8, sampleCode: 'AUR-2603-0025', sampleDesc: 'Ibuprofen Tablets', from: 'Delhi', to: 'Baddi', status: 'REJECTED', requestedBy: 'Mr. Ashu Kumar', requestedDate: '2026-03-18', reason: 'Stability testing', transportMode: 'LOGISTICS' },
];

const statusConfig: Record<string, { color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray'; icon: typeof Clock }> = {
  REQUESTED: { color: 'yellow', icon: Clock },
  APPROVED: { color: 'blue', icon: CheckCircle2 },
  IN_TRANSIT: { color: 'purple', icon: Truck },
  RECEIVED: { color: 'green', icon: Download },
  REJECTED: { color: 'red', icon: XCircle },
  CANCELLED: { color: 'gray', icon: XCircle },
};

export default function SampleTransferPage() {
  const [activeTab, setActiveTab] = useState<'outgoing' | 'incoming' | 'history'>('outgoing');
  const [showNewTransfer, setShowNewTransfer] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const tabs = [
    { key: 'outgoing' as const, label: 'Outgoing', count: mockOutgoing.length, icon: Send },
    { key: 'incoming' as const, label: 'Incoming', count: mockIncoming.length, icon: Download },
    { key: 'history' as const, label: 'History', count: mockHistory.length, icon: Clock },
  ];

  const currentData = activeTab === 'outgoing' ? mockOutgoing : activeTab === 'incoming' ? mockIncoming : mockHistory;

  const renderTransferRow = (t: Transfer) => {
    const cfg = statusConfig[t.status] || statusConfig.REQUESTED;
    const Icon = cfg.icon;
    return (
      <div key={t.id} className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <ArrowLeftRight className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono font-semibold text-gray-900">{t.sampleCode}</code>
              <Badge variant={cfg.color}><Icon className="h-3 w-3 mr-1" />{t.status.replace('_', ' ')}</Badge>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{t.sampleDesc}</p>
            <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
              <span>{t.from} → {t.to}</span>
              <span>{t.requestedDate}</span>
              <span>{t.transportMode}</span>
              {t.tracking && <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{t.tracking}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {activeTab === 'incoming' && t.status === 'REQUESTED' && (
            <>
              <Button size="sm" variant="primary" onClick={() => { setSelectedTransfer(t); setShowAcceptModal(true); }}>Accept</Button>
              <Button size="sm" variant="danger" onClick={() => { setSelectedTransfer(t); setShowRejectModal(true); }}>Reject</Button>
            </>
          )}
          {activeTab === 'outgoing' && t.status === 'REQUESTED' && (
            <Button size="sm" variant="danger">Cancel</Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sample Transfers</h1>
          <p className="text-sm text-gray-500 mt-1">Transfer samples between lab locations</p>
        </div>
        <Button onClick={() => setShowNewTransfer(true)}><Plus className="h-4 w-4 mr-1" /> New Transfer</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Incoming Pending" value={2} icon={<Download className="h-5 w-5" />} />
        <StatCard label="Outgoing Pending" value={3} icon={<Send className="h-5 w-5" />} />
        <StatCard label="In Transit" value={2} icon={<Truck className="h-5 w-5" />} />
        <StatCard label="Completed This Month" value={8} icon={<CheckCircle2 className="h-5 w-5" />} trend={{ value: 15, isPositive: true }} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map(tab => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <TabIcon className="h-4 w-4" />
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                activeTab === tab.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
              }`}>{tab.count}</span>
            </button>
          );
        })}
      </div>

      {/* Transfer List */}
      <Card>
        {currentData.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {currentData.map(renderTransferRow)}
          </div>
        ) : (
          <EmptyState title="No transfers" description="No transfers found in this category" />
        )}
      </Card>

      {/* New Transfer Modal */}
      <Modal isOpen={showNewTransfer} onClose={() => setShowNewTransfer(false)} title="New Sample Transfer" size="md">
        <div className="space-y-4">
          <Select label="Sample" options={[
            { value: '', label: 'Select sample...' },
            { value: '1', label: 'AUR-2603-0045 - Paracetamol Tablets' },
            { value: '2', label: 'AUR-2603-0038 - Municipal Tap Water' },
            { value: '3', label: 'AUR-2603-0052 - Herbal Face Cream' },
          ]} />
          <Select label="Destination Location" options={[
            { value: '', label: 'Select location...' },
            ...locations.map(l => ({ value: String(l.id), label: `${l.name} (${l.code})` }))
          ]} />
          <Select label="Transport Mode" options={[
            { value: 'COURIER', label: 'Courier' },
            { value: 'HAND_CARRY', label: 'Hand Carry' },
            { value: 'LOGISTICS', label: 'Internal Logistics' },
          ]} />
          <Input label="Reason for Transfer" placeholder="Why does this sample need to go to another location?" />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowNewTransfer(false)}>Cancel</Button>
            <Button onClick={() => setShowNewTransfer(false)}>Submit Transfer Request</Button>
          </div>
        </div>
      </Modal>

      {/* Accept Modal */}
      <Modal isOpen={showAcceptModal} onClose={() => setShowAcceptModal(false)} title="Accept Transfer" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Confirm receipt of sample <strong>{selectedTransfer?.sampleCode}</strong> from {selectedTransfer?.from}?</p>
          <Input label="Remarks (optional)" placeholder="Any remarks about the sample condition..." />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAcceptModal(false)}>Cancel</Button>
            <Button onClick={() => setShowAcceptModal(false)}>Confirm Receipt</Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject Transfer" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Reject transfer of <strong>{selectedTransfer?.sampleCode}</strong> from {selectedTransfer?.from}?</p>
          <Input label="Rejection Reason *" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Why are you rejecting this transfer?" />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => { setShowRejectModal(false); setRejectReason(''); }}>Reject Transfer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
