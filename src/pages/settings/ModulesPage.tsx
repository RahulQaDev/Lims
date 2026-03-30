import { useState } from 'react';
import { Plus, Trash2, Layers, Package } from 'lucide-react';
import { useRoleStore } from '../../stores/roleStore';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

export default function ModulesPage() {
  const { modules, addModule, deleteModule, addSubModule, deleteSubModule } = useRoleStore();

  const [showAddModule, setShowAddModule] = useState(false);
  const [showAddSub, setShowAddSub] = useState<string | null>(null); // parent key
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');

  const handleAddModule = () => {
    if (!newKey.trim() || !newLabel.trim()) return;
    addModule({ key: newKey.trim().toLowerCase().replace(/\s+/g, '-'), label: newLabel.trim() });
    setNewKey('');
    setNewLabel('');
    setShowAddModule(false);
  };

  const handleAddSub = () => {
    if (!showAddSub || !newKey.trim() || !newLabel.trim()) return;
    addSubModule(showAddSub, { key: newKey.trim().toLowerCase().replace(/\s+/g, '-'), label: newLabel.trim() });
    setNewKey('');
    setNewLabel('');
    setShowAddSub(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Module Management</h1>
          <p className="text-sm text-gray-500 mt-1">{modules.length} parent modules configured</p>
        </div>
        <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowAddModule(true)}>
          Add Module
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {modules.map((mod) => (
          <div key={mod.key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Layers className="h-5 w-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">{mod.label}</h3>
                  <span className="text-[11px] font-mono text-gray-400">{mod.key}</span>
                </div>
              </div>
              <button
                onClick={() => deleteModule(mod.key)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                title="Delete module"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4">
              {mod.subModules && mod.subModules.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">
                    Sub-modules ({mod.subModules.length})
                  </p>
                  {mod.subModules.map((sub) => (
                    <div key={sub.key} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Package className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-xs font-medium text-gray-700 block truncate">{sub.label}</span>
                          <span className="text-[10px] font-mono text-gray-400">{sub.key}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteSubModule(mod.key, sub.key)}
                        className="p-1 rounded text-gray-400 hover:text-red-500 transition-colors shrink-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-2">No sub-modules</p>
              )}
              <button
                onClick={() => { setShowAddSub(mod.key); setNewKey(''); setNewLabel(''); }}
                className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                <Plus className="h-3 w-3" /> Add Sub-module
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Module Modal */}
      <Modal
        isOpen={showAddModule}
        onClose={() => setShowAddModule(false)}
        title="Add Parent Module"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowAddModule(false)}>Cancel</Button>
            <Button onClick={handleAddModule} disabled={!newKey.trim() || !newLabel.trim()}>Add Module</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Module Key" value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="e.g., quality-control" helperText="Lowercase with hyphens, no spaces" />
          <Input label="Module Label" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="e.g., Quality Control" />
        </div>
      </Modal>

      {/* Add Sub-Module Modal */}
      <Modal
        isOpen={!!showAddSub}
        onClose={() => setShowAddSub(null)}
        title={`Add Sub-module to ${modules.find((m) => m.key === showAddSub)?.label || ''}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowAddSub(null)}>Cancel</Button>
            <Button onClick={handleAddSub} disabled={!newKey.trim() || !newLabel.trim()}>Add Sub-module</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Sub-module Key" value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="e.g., calibration" helperText="Lowercase with hyphens, no spaces" />
          <Input label="Sub-module Label" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="e.g., Calibration" />
        </div>
      </Modal>
    </div>
  );
}
