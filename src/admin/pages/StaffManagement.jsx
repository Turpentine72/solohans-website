import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Trash2, KeyRound, X, Pencil, Tag } from 'lucide-react';
import { staff as staffApi, roles as rolesApi } from '../../lib/api';

export default function StaffManagement() {
  const [staffList, setStaffList] = useState([]);
  const [roleList, setRoleList] = useState([]); // [{ _id, name, label, builtIn }]
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showRoles, setShowRoles] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [newRoleLabel, setNewRoleLabel] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: '' });
  const [editForm, setEditForm] = useState({ name: '', email: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [staffData, roleData] = await Promise.all([staffApi.getAll(), rolesApi.getAll()]);
      setStaffList(staffData);
      setRoleList(roleData);
      if (!form.role && roleData.length > 0) {
        setForm(f => ({ ...f, role: roleData.find(r => r.name === 'cashier')?.name || roleData[0].name }));
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const roleLabel = (name) => roleList.find(r => r.name === name)?.label || name;

  const handleAdd = async () => {
    if (!form.email.trim() || form.password.length < 6) {
      alert('Email is required and password must be at least 6 characters.');
      return;
    }
    setSaving(true);
    try {
      await staffApi.create(form);
      setShowAdd(false);
      setForm(f => ({ name: '', email: '', password: '', role: f.role }));
      fetchAll();
    } catch (err) {
      alert(`Failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await staffApi.changeRole(id, role);
      fetchAll();
    } catch (err) {
      alert(`Failed: ${err.message}`);
    }
  };

  const handleStatusToggle = async (s) => {
    const next = s.status === 'Inactive' ? 'Active' : 'Inactive';
    if (next === 'Inactive' && !window.confirm(`Deactivate ${s.name || s.email}? They will not be able to log in until reactivated.`)) return;
    try {
      await staffApi.setStatus(s._id, next);
      fetchAll();
    } catch (err) {
      alert(`Failed: ${err.message}`);
    }
  };

  const openEdit = (s) => {
    setEditTarget(s);
    setEditForm({ name: s.name || '', email: s.email });
  };

  const handleSaveEdit = async () => {
    if (!editForm.email.trim()) {
      alert('Email is required.');
      return;
    }
    try {
      await staffApi.update(editTarget._id, editForm);
      setEditTarget(null);
      fetchAll();
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
      fetchAll();
    } catch (err) {
      alert(`Failed: ${err.message}`);
    }
  };

  const handleAddRole = async () => {
    if (!newRoleLabel.trim()) return;
    try {
      await rolesApi.create(newRoleLabel.trim());
      setNewRoleLabel('');
      fetchAll();
    } catch (err) {
      alert(`Failed: ${err.message}`);
    }
  };

  const handleDeleteRole = async (id) => {
    if (!window.confirm('Delete this role? Staff currently assigned to it will keep the role name but it will no longer appear as an option for new assignments.')) return;
    try {
      await rolesApi.delete(id);
      fetchAll();
    } catch (err) {
      alert(`Failed: ${err.message}`);
    }
  };

  return (
    <>
      <Helmet><title>Staff Management – Solohans Admin</title></Helmet>
      <div>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Staff Management</h1>
            <p className="text-gray-500 text-sm mt-1">Admin-only. Create staff accounts, define your own roles, and edit staff details anytime.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowRoles(true)} className="flex items-center gap-2 border border-gray-200 text-gray-700 px-5 py-2.5 rounded-full font-semibold hover:bg-gray-50">
              <Tag size={18} /> Manage Roles
            </button>
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-[#C62828] text-white px-5 py-2.5 rounded-full font-semibold hover:bg-[#B71C1C]">
              <Plus size={18} /> Add Staff
            </button>
          </div>
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
                  <th className="py-3 px-4">Status</th>
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
                        {roleList.map(r => (
                          <option key={r._id} value={r.name}>{r.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleStatusToggle(s)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s.status === 'Inactive' ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'}`}
                        title="Click to toggle"
                      >
                        {s.status === 'Inactive' ? 'Inactive' : 'Active'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button onClick={() => openEdit(s)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg inline-block" title="Edit name/email"><Pencil size={16} /></button>
                      <button onClick={() => setResetTarget(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg inline-block" title="Reset password"><KeyRound size={16} /></button>
                      <button onClick={() => handleDelete(s._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg inline-block" title="Delete"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Staff */}
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
                    {roleList.map(r => <option key={r._id} value={r.name}>{r.label}</option>)}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">Don't see the role you need? Click "Manage Roles" to add it first.</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 p-5 border-t">
                <button onClick={() => setShowAdd(false)} className="px-5 py-3 border rounded-full font-medium hover:bg-gray-50">Cancel</button>
                <button onClick={handleAdd} disabled={saving} className="px-5 py-3 bg-[#C62828] text-white rounded-full font-semibold hover:bg-[#B71C1C]">{saving ? 'Saving…' : 'Add Staff'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Staff (name/email) */}
        {editTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-5 border-b">
                <h3 className="text-xl font-bold text-gray-800">Edit Staff</h3>
                <button onClick={() => setEditTarget(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div><label className="block text-sm font-medium mb-1">Name</label><input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-4 py-3 border rounded-xl" /></div>
                <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} className="w-full px-4 py-3 border rounded-xl" /></div>
                <p className="text-xs text-gray-400">To change their password, close this and use the key icon instead.</p>
              </div>
              <div className="flex justify-end gap-3 p-5 border-t">
                <button onClick={() => setEditTarget(null)} className="px-5 py-3 border rounded-full font-medium hover:bg-gray-50">Cancel</button>
                <button onClick={handleSaveEdit} className="px-5 py-3 bg-[#C62828] text-white rounded-full font-semibold hover:bg-[#B71C1C]">Save Changes</button>
              </div>
            </div>
          </div>
        )}

        {/* Reset Password */}
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

        {/* Manage Roles */}
        {showRoles && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-5 border-b">
                <h3 className="text-xl font-bold text-gray-800">Manage Roles</h3>
                <button onClick={() => setShowRoles(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>
              <div className="p-5">
                <div className="flex gap-2 mb-4">
                  <input type="text" placeholder="New role name, e.g. Supervisor" value={newRoleLabel} onChange={e => setNewRoleLabel(e.target.value)} className="flex-1 px-4 py-2.5 border rounded-xl" />
                  <button onClick={handleAddRole} className="px-4 py-2.5 bg-[#C62828] text-white rounded-xl font-semibold hover:bg-[#B71C1C]">Add</button>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {roleList.map(r => (
                    <div key={r._id} className="flex items-center justify-between bg-gray-50 px-4 py-2.5 rounded-xl">
                      <span className="text-sm font-medium">{r.label}</span>
                      {r.builtIn ? (
                        <span className="text-xs text-gray-400">Built-in</span>
                      ) : (
                        <button onClick={() => handleDeleteRole(r._id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-4">
                  Note: built-in roles (Admin, Cashier, Store Keeper, Closing Staff, Chef, Delivery Staff) have specific
                  page access already wired up. New custom roles you add here can log in and use their own profile/attendance,
                  but won't automatically unlock other admin pages — let me know which pages a new role should access and I'll wire it up.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}