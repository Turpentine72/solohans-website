import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Edit, Trash2, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { deliveryZones as deliveryZonesApi } from '../../lib/api';

export default function DeliveryZones() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [form, setForm] = useState({ name: '', fee: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchZones(); }, []);

  const fetchZones = async () => {
    setLoading(true);
    try {
      const data = await deliveryZonesApi.getAll();
      setZones(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleOpenAdd = () => {
    setEditingZone(null);
    setForm({ name: '', fee: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (zone) => {
    setEditingZone(zone);
    setForm({ name: zone.name, fee: zone.fee });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || form.fee === '' || Number(form.fee) < 0) {
      alert('Please enter a valid zone name and fee.');
      return;
    }
    setSaving(true);
    const dataToSave = { name: form.name.trim(), fee: Number(form.fee) };
    try {
      if (editingZone) {
        await deliveryZonesApi.update(editingZone._id, dataToSave);
      } else {
        await deliveryZonesApi.create(dataToSave);
      }
      setShowModal(false);
      fetchZones();
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (zone) => {
    try {
      await deliveryZonesApi.toggle(zone._id);
      fetchZones();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this delivery zone? Orders already placed under it keep their original fee.')) return;
    try {
      await deliveryZonesApi.delete(id);
      fetchZones();
    } catch (err) { console.error(err); }
  };

  return (
    <>
      <Helmet><title>Delivery Zones – Solohans Admin</title></Helmet>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Delivery Zones</h1>
            <p className="text-gray-500 text-sm mt-1">Customers in an active zone are charged this fee automatically and can pay immediately. Areas not listed here still go through manual admin review.</p>
          </div>
          <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-[#C62828] text-white px-5 py-2.5 rounded-full font-semibold hover:bg-[#B71C1C] transition-colors whitespace-nowrap">
            <Plus size={18} /> Add Zone
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading…</div>
        ) : zones.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No delivery zones yet. Add one to start auto-calculating fees.</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-sm">
                <tr>
                  <th className="py-3 px-4">Zone</th>
                  <th className="py-3 px-4">Fee</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {zones.map(zone => (
                  <tr key={zone._id} className="border-t border-gray-100">
                    <td className="py-3 px-4 font-medium text-gray-800">{zone.name}</td>
                    <td className="py-3 px-4">₦{zone.fee.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <button onClick={() => handleToggle(zone)} className={`flex items-center gap-1 text-sm font-medium ${zone.active ? 'text-green-600' : 'text-gray-400'}`}>
                        {zone.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        {zone.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => handleOpenEdit(zone)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg inline-block"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(zone._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg inline-block"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-5 border-b">
                <h3 className="text-xl font-bold text-gray-800">{editingZone ? 'Edit Zone' : 'Add Delivery Zone'}</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zone / Area Name</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ikorodu" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C62828]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Fee (₦)</label>
                  <input type="number" min="0" value={form.fee} onChange={e => setForm({ ...form, fee: e.target.value })} placeholder="e.g. 1500" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#C62828]" />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-5 border-t">
                <button onClick={() => setShowModal(false)} className="px-5 py-3 border border-gray-200 rounded-full text-gray-700 font-medium hover:bg-gray-50">Cancel</button>
                <button onClick={handleSave} disabled={saving} className={`px-5 py-3 bg-[#C62828] text-white rounded-full font-semibold hover:bg-[#B71C1C] transition-colors ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}>
                  {saving ? 'Saving…' : editingZone ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
