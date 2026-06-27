import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Trash2, KeyRound, X } from 'lucide-react';
import { staff as staffApi } from '../../lib/api';

const ROLE_LABELS = {
  admin: 'Admin',
  cashier: 'Cashier',
  storekeeper: 'Store Keeper',
  closing_staff: 'Closing Staff',
  chef: 'Chef',
  delivery_staff: 'Delivery Staff',
};

export default function StaffManagement() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'cashier' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchStaff(); }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      setStaffList(await staffApi.getAll());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAdd = async () => {
    if (!form.email.trim() || form.password.length < 6) {
      alert('Email is required and password must be at least 6 characters.');
      return;
    }
    setSaving(true);
    try {
      await staffApi.create(form);
      setShowAdd(false);
      setForm({ name: '', email: '', password: '', role: 'cashier' });
      fetchStaff();
    } catch (err) {
      alert(`Failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await staffApi.changeRole(id, role);
      fetchStaff();
    } catch (err) {
      alert(`Failed: ${err.message}`);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      alert('New password must be at least 6 characters.');
      return;
    }
    try {
      await staffApi.resetPassword(resetTarget._id, newPassword);
      setResetTarget(null);
      setNewPassword('');
      alert('Password reset successfully.');
    } catch (err) {
      alert(`Failed: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this staff account? This cannot be undone.')) return;
    try {
      await staffApi.delete(id);
      fetchStaff();
    } catch (err) {
      alert(`Failed: ${err.message}`);
    }
  };

  return (
    <>
      <Helmet><title>Staff Management – Solohans Admin</title></Helmet>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Staff Management</h1>
            <p className="text-gray-500 text-sm mt-1">Admin-only. Create staff accounts and control what each role can access.</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-[#C62828] text-white px-5 py-2.5 rounded-full font-semibold hover:bg-[#B71C1C]">
            <Plus size={18} /> Add Staff
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading…</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-sm">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map(s => (
                  <tr key={s._id} className="border-t border-gray-100">
                    <td className="py-3 px-4 font-medium text-gray-800">{s.name || '—'}</td>
                    <td className="py-3 px-4">{s.email}</td>
                    <td className="py-3 px-4">
                      <select value={s.role} onChange={e => handleRoleChange(s._id, e.target.value)} className="border rounded-lg px-2 py-1 text-sm">
                        {Object.entries(ROLE_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => setResetTarget(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg inline-block" title="Reset password"><KeyRound size={16} /></button>
                      <button onClick={() => handleDelete(s._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg inline-block" title="Delete"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-5 border-b">
                <h3 className="text-xl font-bold text-gray-800">Add Staff</h3>
                <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div><label className="block text-sm font-medium mb-1">Name</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 border rounded-xl" /></div>
                <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 border rounded-xl" /></div>
                <div><label className="block text-sm font-medium mb-1">Password</label><input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full px-4 py-3 border rounded-xl" /></div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full px-4 py-3 border rounded-xl">
                    {Object.entries(ROLE_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 p-5 border-t">
                <button onClick={() => setShowAdd(false)} className="px-5 py-3 border rounded-full font-medium hover:bg-gray-50">Cancel</button>
                <button onClick={handleAdd} disabled={saving} className="px-5 py-3 bg-[#C62828] text-white rounded-full font-semibold hover:bg-[#B71C1C]">{saving ? 'Saving…' : 'Add Staff'}</button>
              </div>
            </div>
          </div>
        )}

        {resetTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
              <div className="flex items-center justify-between p-5 border-b">
                <h3 className="text-lg font-bold text-gray-800">Reset Password for {resetTarget.email}</h3>
                <button onClick={() => setResetTarget(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>
              <div className="p-5">
                <input type="password" placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-4 py-3 border rounded-xl" />
              </div>
              <div className="flex justify-end gap-3 p-5 border-t">
                <button onClick={() => setResetTarget(null)} className="px-5 py-3 border rounded-full font-medium hover:bg-gray-50">Cancel</button>
                <button onClick={handleResetPassword} className="px-5 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700">Reset Password</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}