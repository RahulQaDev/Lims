import { useState } from 'react';
import { MapPin, Plus, Edit2, Trash2, Building2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import StatCard from '../../components/ui/StatCard';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

interface LocationData {
  id: number; name: string; code: string; address: string; city: string; state: string;
  phone: string; email: string; nablNumber: string; gstNumber: string; labName: string;
  reportPrefix: string; isHQ: boolean; isActive: boolean; userCount: number; sampleCount: number;
}

const mockLocations: LocationData[] = [
  { id: 1, name: 'Delhi', code: 'DEL', address: 'A-8, Mohan Co-operative Industrial Estate, Mathura Road', city: 'New Delhi', state: 'Delhi', phone: '011-26950276', email: 'delhi@aurigalab.com', nablNumber: 'T-1234', gstNumber: '07AABCA1234F1Z5', labName: 'Auriga Research Ltd - Delhi', reportPrefix: 'DEL', isHQ: true, isActive: true, userCount: 167, sampleCount: 42 },
  { id: 2, name: 'Alcatec', code: 'ALC', address: 'Plot 45, HSIIDC Industrial Area', city: 'Kundli', state: 'Haryana', phone: '0130-2367890', email: 'alcatec@aurigalab.com', nablNumber: 'T-5678', gstNumber: '06AABCA5678G1Z3', labName: 'Alcatec Lab Services', reportPrefix: 'ALC', isHQ: false, isActive: true, userCount: 45, sampleCount: 18 },
  { id: 3, name: 'Manesar', code: 'MAN', address: 'Plot 12, IMT Manesar', city: 'Manesar', state: 'Haryana', phone: '0124-4567890', email: 'manesar@aurigalab.com', nablNumber: 'T-9012', gstNumber: '06AABCA9012H1Z1', labName: 'Auriga Research Ltd - Manesar', reportPrefix: 'MAN', isHQ: false, isActive: true, userCount: 55, sampleCount: 25 },
  { id: 4, name: 'Bangalore', code: 'BLR', address: '78, Electronics City Phase-II', city: 'Bangalore', state: 'Karnataka', phone: '080-23456789', email: 'blr@aurigalab.com', nablNumber: 'T-3456', gstNumber: '29AABCA3456I1Z2', labName: 'Auriga Research Ltd - Bangalore', reportPrefix: 'BLR', isHQ: false, isActive: true, userCount: 62, sampleCount: 31 },
  { id: 5, name: 'Baddi', code: 'BDD', address: 'Khasra No. 123, Village Thana', city: 'Baddi', state: 'Himachal Pradesh', phone: '01795-234567', email: 'baddi@aurigalab.com', nablNumber: 'T-7890', gstNumber: '02AABCA7890J1Z4', labName: 'Auriga Research Ltd - Baddi', reportPrefix: 'BDD', isHQ: false, isActive: true, userCount: 30, sampleCount: 15 },
];

const emptyForm = { name: '', code: '', address: '', city: '', state: '', phone: '', email: '', nablNumber: '', gstNumber: '', labName: '', reportPrefix: '', isHQ: false };

export default function LocationsPage() {
  const [showModal, setShowModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<LocationData | null>(null);

  const totalUsers = mockLocations.reduce((s, l) => s + l.userCount, 0);
  const totalSamples = mockLocations.reduce((s, l) => s + l.sampleCount, 0);

  const handleEdit = (loc: LocationData) => {
    setEditingId(loc.id);
    setForm({ name: loc.name, code: loc.code, address: loc.address, city: loc.city, state: loc.state, phone: loc.phone, email: loc.email, nablNumber: loc.nablNumber, gstNumber: loc.gstNumber, labName: loc.labName, reportPrefix: loc.reportPrefix, isHQ: loc.isHQ });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const set = (key: string, val: string | boolean) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
          <p className="text-sm text-gray-500 mt-1">Manage lab locations across the organization</p>
        </div>
        <Button onClick={handleAdd}><Plus className="h-4 w-4 mr-1" /> Add Location</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Locations" value={mockLocations.length} icon={<MapPin className="h-5 w-5" />} />
        <StatCard label="Active Locations" value={mockLocations.filter(l => l.isActive).length} icon={<Building2 className="h-5 w-5" />} />
        <StatCard label="Total Employees" value={totalUsers} icon={<MapPin className="h-5 w-5" />} />
        <StatCard label="Samples Today" value={totalSamples} icon={<MapPin className="h-5 w-5" />} />
      </div>

      {/* Location Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockLocations.map(loc => (
          <Card key={loc.id}>
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${loc.isHQ ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <MapPin className={`h-6 w-6 ${loc.isHQ ? 'text-blue-600' : 'text-gray-600'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{loc.name}</h3>
                      <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">{loc.code}</span>
                      {loc.isHQ && <Badge variant="blue">HQ</Badge>}
                    </div>
                    <p className="text-xs text-gray-500">{loc.city}, {loc.state}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(loc)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  {!loc.isHQ && (
                    <button onClick={() => { setDeleteTarget(loc); setShowDelete(true); }} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">NABL Number</span><span className="font-medium">{loc.nablNumber}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">GST</span><span className="font-medium text-xs">{loc.gstNumber}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Report Prefix</span><span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs">{loc.reportPrefix}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Employees</span><span className="font-semibold text-blue-600">{loc.userCount}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Samples Today</span><span className="font-semibold">{loc.sampleCount}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Phone</span><span>{loc.phone}</span></div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Location' : 'Add Location'} size="lg">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Location Name *" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g., Mumbai" />
          <Input label="Code *" value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="e.g., MUM" />
          <Input label="Lab Name (for CoA)" value={form.labName} onChange={e => set('labName', e.target.value)} placeholder="Full lab name for certificates" />
          <Input label="Report Prefix" value={form.reportPrefix} onChange={e => set('reportPrefix', e.target.value.toUpperCase())} placeholder="e.g., MUM" />
          <div className="col-span-2"><Input label="Address" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Full address" /></div>
          <Input label="City" value={form.city} onChange={e => set('city', e.target.value)} />
          <Input label="State" value={form.state} onChange={e => set('state', e.target.value)} />
          <Input label="Phone" value={form.phone} onChange={e => set('phone', e.target.value)} />
          <Input label="Email" value={form.email} onChange={e => set('email', e.target.value)} />
          <Input label="NABL Number" value={form.nablNumber} onChange={e => set('nablNumber', e.target.value)} placeholder="e.g., T-1234" />
          <Input label="GST Number" value={form.gstNumber} onChange={e => set('gstNumber', e.target.value)} />
          <div className="col-span-2 flex items-center gap-2">
            <input type="checkbox" id="isHQ" checked={form.isHQ} onChange={e => set('isHQ', e.target.checked)} className="rounded" />
            <label htmlFor="isHQ" className="text-sm text-gray-700">This is the Head Office (HQ)</label>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button onClick={() => setShowModal(false)}>{editingId ? 'Update' : 'Create'} Location</Button>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={() => setShowDelete(false)}
        title="Deactivate Location"
        message={`Are you sure you want to deactivate ${deleteTarget?.name}? This will hide it from active locations.`}
        confirmLabel="Deactivate"
        variant="danger"
      />
    </div>
  );
}
