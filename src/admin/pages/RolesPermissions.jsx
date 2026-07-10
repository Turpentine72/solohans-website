import { useState, useEffect, Fragment } from 'react';
import { Helmet } from 'react-helmet-async';
import { ShieldCheck, ShieldAlert, Save, Plus, Trash2 } from 'lucide-react';
import { roles as rolesApi } from '../../lib/api';
import { useAuth } from '../context/AuthContext';

const MODULE_LABELS = {
  dashboard: 'Dashboard',
  orders: 'Orders / Sales History',
  pos: 'POS',
  payment_verification: 'Payment Verification',
  menu: 'Menu Management',
  categories: 'Categories',
  meal_inventory: 'Meal Inventory (Rice/Spaghetti/Boxes)',
  ingredients: 'Ingredient Inventory (Shawarma/Hotdog)',
  daily_stock: 'Daily Dish Stock',
  customers: 'Customers',
  contacts: 'Contact Messages',
  reviews: 'Reviews & Testimonials',
  notifications: 'Notifications',
  promotions: 'Promotions',
  gallery: 'Gallery',
  delivery_zones: 'Delivery Zones',
  expenses: 'Expenses',
  reconciliation: 'Day Reconciliation',
  payment_reconciliation: 'Payment Reconciliation',
  staff: 'Staff Management',
  roles: 'Roles & Permissions',
  staff_history: 'Staff History (Attendance)',
  kitchen: 'Kitchen',
  delivery: 'My Deliveries',
  audit_log: 'Audit Log',
  settings: 'Settings',
  reports: 'Reports & Analytics',
};

// Grouped for a less overwhelming table — 27 flat rows is a lot to scan.
const MODULE_GROUPS = [
  { label: 'Overview', modules: ['dashboard', 'reports'] },
  { label: 'Sales', modules: ['orders', 'pos', 'payment_verification', 'reconciliation', 'payment_reconciliation'] },
  { label: 'Menu & Inventory', modules: ['menu', 'categories', 'meal_inventory', 'ingredients', 'daily_stock'] },
  { label: 'Customer-Facing', modules: ['customers', 'contacts', 'reviews', 'notifications', 'promotions', 'gallery', 'delivery_zones'] },
  { label: 'Operations', modules: ['expenses', 'kitchen', 'delivery'] },
  { label: 'Administration', modules: ['staff', 'roles', 'staff_history', 'audit_log', 'settings'] },
];

const ACTION_LABELS = {
  view: 'View', create: 'Create', edit: 'Edit', delete: 'Delete',
  approve: 'Approve', archive: 'Archive', export: 'Export', manage: 'Manage', print: 'Print',
};

export default function RolesPermissions() {
  const { isSuperAdmin, refreshMe } = useAuth();
  const [rolesList, setRolesList] = useState([]);
  const [schema, setSchema] = useState({ modules: [], actions: [] });
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [matrix, setMatrix] = useState({}); // { [module]: { [action]: bool } }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newRoleLabel, setNewRoleLabel] = useState('');
  const [dirty, setDirty] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [rolesData, schemaData] = await Promise.all([
        rolesApi.getAll(),
        rolesApi.getPermissionSchema(),
      ]);
      setRolesList(rolesData);
      setSchema(schemaData);
      if (!selectedRoleId && rolesData.length > 0) {
        selectRole(rolesData[0]);
      } else {
        const current = rolesData.find((r) => r._id === selectedRoleId);
        if (current) selectRole(current);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); refreshMe(); }, []);

  const selectRole = (role) => {
    setSelectedRoleId(role._id);
    setMatrix(role.permissions || {});
    setDirty(false);
  };

  const toggle = (moduleName, action) => {
    if (!isSuperAdmin) return;
    setMatrix((prev) => ({
      ...prev,
      [moduleName]: { ...prev[moduleName], [action]: !prev[moduleName]?.[action] },
    }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await rolesApi.updatePermissions(selectedRoleId, matrix);
      setRolesList((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
      setDirty(false);
    } catch (err) {
      alert(`Failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!newRoleLabel.trim()) return;
    try {
      const role = await rolesApi.create(newRoleLabel.trim());
      setNewRoleLabel('');
      await load();
      selectRole(role);
    } catch (err) {
      alert(`Failed: ${err.message}`);
    }
  };

  const handleDeleteRole = async (role) => {
    if (!window.confirm(`Delete the role "${role.label}"? Staff currently assigned this role will need a new one.`)) return;
    try {
      await rolesApi.delete(role._id);
      await load();
    } catch (err) {
      alert(`Failed: ${err.message}`);
    }
  };

  const selectedRole = rolesList.find((r) => r._id === selectedRoleId);

  if (loading) return <div className="text-center py-12 text-gray-500">Loading…</div>;

  return (
    <>
      <Helmet><title>Roles & Permissions – Solohans Admin</title></Helmet>
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-1">Roles & Permissions</h1>
        <p className="text-gray-500 text-sm mb-6">
          Control exactly what each role can see and do. Changes take effect for affected staff within seconds — no need for them to log out.
        </p>

        {!isSuperAdmin && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-amber-800">
            <ShieldAlert size={20} className="flex-shrink-0" />
            <p className="text-sm">You can view this page, but only a <strong>Super Admin</strong> can change what a role is permitted to do.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 h-fit">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Roles</p>
            <div className="space-y-1 mb-4">
              {rolesList.map((role) => (
                <div key={role._id} className="flex items-center gap-1">
                  <button
                    onClick={() => selectRole(role)}
                    className={`flex-1 text-left px-3 py-2 rounded-lg text-sm font-medium ${selectedRoleId === role._id ? 'bg-[#C62828] text-white' : 'hover:bg-gray-50 text-gray-700'}`}
                  >
                    {role.label}
                  </button>
                  {!role.builtIn && isSuperAdmin && (
                    <button onClick={() => handleDeleteRole(role)} className="p-2 text-gray-300 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {isSuperAdmin && (
              <form onSubmit={handleCreateRole} className="flex gap-1">
                <input
                  type="text" placeholder="New role name" value={newRoleLabel}
                  onChange={(e) => setNewRoleLabel(e.target.value)}
                  className="flex-1 border rounded-lg px-2 py-1.5 text-sm min-w-0"
                />
                <button type="submit" className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"><Plus size={14} /></button>
              </form>
            )}
          </div>

          <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {!selectedRole ? (
              <div className="p-8 text-center text-gray-400">Select a role to view its permissions.</div>
            ) : (
              <>
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-[#C62828]" /> {selectedRole.label}
                  </h3>
                  {isSuperAdmin && (
                    <button
                      onClick={handleSave}
                      disabled={saving || !dirty}
                      className="flex items-center gap-2 bg-[#C62828] text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-[#B71C1C] disabled:opacity-50"
                    >
                      <Save size={16} /> {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 sticky top-0">
                      <tr>
                        <th className="py-3 px-4 text-left">Module</th>
                        {schema.actions.map((action) => (
                          <th key={action} className="py-3 px-3 text-center whitespace-nowrap">{ACTION_LABELS[action] || action}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MODULE_GROUPS.map((group) => {
                        const modulesInSchema = group.modules.filter((m) => schema.modules.includes(m));
                        if (modulesInSchema.length === 0) return null;
                        return (
                          <Fragment key={group.label}>
                            <tr className="bg-gray-50/70">
                              <td colSpan={schema.actions.length + 1} className="py-1.5 px-4 text-xs font-bold text-gray-400 uppercase tracking-wide">
                                {group.label}
                              </td>
                            </tr>
                            {modulesInSchema.map((moduleName) => (
                              <tr key={moduleName} className="border-t border-gray-100">
                                <td className="py-2.5 px-4 font-medium text-gray-700 whitespace-nowrap">{MODULE_LABELS[moduleName] || moduleName}</td>
                                {schema.actions.map((action) => (
                                  <td key={action} className="py-2.5 px-3 text-center">
                                    <input
                                      type="checkbox"
                                      checked={!!matrix[moduleName]?.[action]}
                                      onChange={() => toggle(moduleName, action)}
                                      disabled={!isSuperAdmin}
                                      className="w-4 h-4 accent-[#C62828] disabled:opacity-40"
                                    />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}